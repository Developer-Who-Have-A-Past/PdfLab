// Pure client-side PDF operations built on pdf-lib. Every function returns bytes (Uint8Array)
// or an array of { name, bytes }.
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

const read = (f) => f.arrayBuffer();
const load = async (f) => PDFDocument.load(await read(f), { ignoreEncryption: true });

export const baseName = (name) => name.replace(/\.[^.]+$/, "");

/** "1-3, 5, 8-" -> zero-based indices. Throws on bad input. */
export function parseRanges(input, total) {
  const out = [];
  for (const part of input.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
    let a, b;
    if (m) {
      a = m[1] ? parseInt(m[1], 10) : 1;
      b = m[2] ? parseInt(m[2], 10) : total;
    } else if (/^\d+$/.test(part)) {
      a = b = parseInt(part, 10);
    } else throw new Error(`Invalid range: "${part}"`);
    if (a < 1 || b > total || a > b) throw new Error(`Range "${part}" is outside 1-${total}`);
    for (let i = a; i <= b; i++) out.push(i - 1);
  }
  if (!out.length) throw new Error("Enter at least one page or range");
  return out;
}

export async function mergePdfs(files) {
  const out = await PDFDocument.create();
  for (const f of files) {
    const src = await load(f);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

export async function extractPages(file, indices) {
  const src = await load(file);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

/** mode "ranges": one output per comma-separated range. mode "every": one file per page. */
export async function splitPdf(file, mode, rangeText) {
  const src = await load(file);
  const total = src.getPageCount();
  const groups =
    mode === "every"
      ? src.getPageIndices().map((i) => [i])
      : rangeText.split(",").map((r) => parseRanges(r, total));
  const base = baseName(file.name);
  const results = [];
  for (let g = 0; g < groups.length; g++) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, groups[g]);
    pages.forEach((p) => out.addPage(p));
    results.push({ name: `${base}_part${g + 1}.pdf`, bytes: await out.save() });
  }
  return results;
}

/** pages: ordered array of { index, rotation (extra degrees), deleted } */
export async function organizePdf(file, pages) {
  const src = await load(file);
  const out = await PDFDocument.create();
  const keep = pages.filter((p) => !p.deleted);
  if (!keep.length) throw new Error("Keep at least one page");
  const copied = await out.copyPages(src, keep.map((p) => p.index));
  copied.forEach((page, i) => {
    const base = page.getRotation().angle;
    page.setRotation(degrees((base + keep[i].rotation) % 360));
    out.addPage(page);
  });
  return out.save();
}

export async function addPageNumbers(file, { position = "bottom-center", start = 1, size = 11 }) {
  const doc = await load(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach((page, i) => {
    const { width, height } = page.getSize();
    const text = String(start + i);
    const w = font.widthOfTextAtSize(text, size);
    const m = 28;
    const [v, h] = position.split("-");
    const x = h === "left" ? m : h === "right" ? width - m - w : (width - w) / 2;
    const y = v === "top" ? height - m : m;
    page.drawText(text, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
  });
  return doc.save();
}

export async function addWatermark(file, { text, opacity = 0.25, size = 60 }) {
  const doc = await load(file);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: width / 2 - (w / 2) * Math.cos(Math.PI / 4),
      y: height / 2 - (w / 2) * Math.sin(Math.PI / 4),
      size,
      font,
      rotate: degrees(45),
      color: rgb(0.5, 0.5, 0.5),
      opacity,
    });
  });
  return doc.save();
}

export async function imagesToPdf(files) {
  const doc = await PDFDocument.create();
  for (const f of files) {
    const bytes = await read(f);
    const isPng = f.type === "image/png" || /\.png$/i.test(f.name);
    const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  return doc.save();
}

/** items: [{ page (0-based), type: "text"|"image", x, y (PDF points, origin bottom-left), text, size, png (bytes), w, h }] */
export async function applyEdits(file, items) {
  const doc = await load(file);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  for (const it of items) {
    const page = pages[it.page];
    if (it.type === "text") {
      page.drawText(it.text, { x: it.x, y: it.y, size: it.size, font, color: rgb(0, 0, 0) });
    } else {
      const img = await doc.embedPng(it.png);
      page.drawImage(img, { x: it.x, y: it.y, width: it.w, height: it.h });
    }
  }
  return doc.save();
}

/** Password-protect with AES-256 via @pdfsmaller/pdf-encrypt (loaded lazily, only needed here). */
export async function protectPdf(file, password) {
  const { encryptPDF } = await import("@pdfsmaller/pdf-encrypt");
  const bytes = new Uint8Array(await read(file));
  return encryptPDF(bytes, password, {
    algorithm: "AES-256",
    ownerPassword: password + "-owner",
    allowPrinting: true,
    allowCopying: false,
    allowModifying: false,
  });
}

export function download(bytesOrBlob, filename, type = "application/pdf") {
  const blob = bytesOrBlob instanceof Blob ? bytesOrBlob : new Blob([bytesOrBlob], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

export async function downloadZip(files, zipName) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.name, f.bytes));
  download(await zip.generateAsync({ type: "blob" }), zipName, "application/zip");
}

export const formatSize = (n) =>
  n > 1048576 ? (n / 1048576).toFixed(2) + " MB" : (n / 1024).toFixed(1) + " KB";
