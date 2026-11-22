// pdf.js helpers (rendering). Browser-only: always import this from client components.
import * as pdfjs from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function openPdf(file, password) {
  const data = new Uint8Array(await file.arrayBuffer());
  return pdfjs.getDocument({ data, password }).promise;
}

export async function renderPage(pdf, pageNumber, scale, canvas) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
  return { width: viewport.width, height: viewport.height, pdfWidth: page.view[2] - page.view[0], pdfHeight: page.view[3] - page.view[1] };
}

const canvasToBytes = (canvas, type, quality) =>
  new Promise((res) =>
    canvas.toBlob(async (b) => res(new Uint8Array(await b.arrayBuffer())), type, quality)
  );

/** Every page -> image bytes. */
export async function pdfToImages(file, { scale = 2, type = "image/jpeg", quality = 0.9 } = {}, onProgress) {
  const pdf = await openPdf(file);
  const ext = type === "image/png" ? "png" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "");
  const out = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const canvas = document.createElement("canvas");
    await renderPage(pdf, i, scale, canvas);
    out.push({ name: `${base}_page${i}.${ext}`, bytes: await canvasToBytes(canvas, type, quality) });
    onProgress?.(i, pdf.numPages);
  }
  return out;
}

/** Rebuild a PDF from page bitmaps. Used by compress and unlock. Text becomes non-selectable. */
async function rasterRebuild(pdf, { scale, quality }, onProgress) {
  const out = await PDFDocument.create();
  for (let i = 1; i <= pdf.numPages; i++) {
    const canvas = document.createElement("canvas");
    const info = await renderPage(pdf, i, scale, canvas);
    const jpg = await out.embedJpg(await canvasToBytes(canvas, "image/jpeg", quality));
    const page = out.addPage([info.pdfWidth, info.pdfHeight]);
    page.drawImage(jpg, { x: 0, y: 0, width: info.pdfWidth, height: info.pdfHeight });
    onProgress?.(i, pdf.numPages);
  }
  return out.save();
}

/** level: "low" | "medium" | "high" compression */
export async function compressPdf(file, level, onProgress) {
  const presets = { low: { scale: 1.6, quality: 0.8 }, medium: { scale: 1.2, quality: 0.6 }, high: { scale: 0.9, quality: 0.4 } };
  return rasterRebuild(await openPdf(file), presets[level], onProgress);
}

export async function unlockPdf(file, password, onProgress) {
  const pdf = await openPdf(file, password); // throws PasswordException if wrong
  return rasterRebuild(pdf, { scale: 2, quality: 0.92 }, onProgress);
}
