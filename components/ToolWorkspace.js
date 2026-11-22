"use client";
import { useState } from "react";
import FileDrop from "./FileDrop";
import OrganizeGrid from "./OrganizeGrid";
import PdfEditor from "./PdfEditor";
import * as pdf from "@/lib/pdf";
import { download, downloadZip, baseName, formatSize } from "@/lib/pdf";

const PDF = "application/pdf,.pdf";
const IMG = "image/jpeg,image/png,.jpg,.jpeg,.png";
const MULTI = { merge: true, "jpg-to-pdf": true };

export default function ToolWorkspace({ toolId }) {
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [o, setO] = useState({
    splitMode: "ranges", ranges: "", level: "medium", pos: "bottom-center", start: 1,
    wmText: "CONFIDENTIAL", password: "", imgType: "image/jpeg",
  });
  const set = (k, v) => setO((s) => ({ ...s, [k]: v }));
  const multiple = !!MULTI[toolId];
  const accept = toolId === "jpg-to-pdf" ? IMG : PDF;
  const file = files[0];

  const move = (i, d) => setFiles((fs) => {
    const j = i + d; if (j < 0 || j >= fs.length) return fs;
    const c = [...fs]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  // Wraps an operation with busy/error handling.
  const run = async (fn) => {
    setBusy(true); setMsg(null);
    try { setMsg({ ok: true, text: (await fn()) || "Done. Your download has started." }); }
    catch (e) {
      const t = e?.name === "PasswordException" ? "Wrong or missing password." : e?.message || "Something went wrong.";
      setMsg({ ok: false, text: t });
    } finally { setBusy(false); }
  };
  const progress = (i, n) => setMsg({ ok: true, text: `Processing page ${i} of ${n}...` });

  const actions = {
    merge: () => run(async () => {
      if (files.length < 2) throw new Error("Add at least two PDFs");
      download(await pdf.mergePdfs(files), "merged.pdf");
    }),
    split: () => run(async () => {
      const parts = await pdf.splitPdf(file, o.splitMode, o.ranges);
      if (parts.length === 1) download(parts[0].bytes, parts[0].name);
      else await downloadZip(parts, `${baseName(file.name)}_split.zip`);
    }),
    compress: () => run(async () => {
      const bytes = await (await import("@/lib/render")).compressPdf(file, o.level, progress);
      download(bytes, `${baseName(file.name)}_compressed.pdf`);
      const saved = Math.round((1 - bytes.length / file.size) * 100);
      return `${formatSize(file.size)} to ${formatSize(bytes.length)} (${saved >= 0 ? saved + "% smaller" : "larger - try a higher level or keep the original"}). Text in the result is not selectable.`;
    }),
    "jpg-to-pdf": () => run(async () => download(await pdf.imagesToPdf(files), "images.pdf")),
    "pdf-to-jpg": () => run(async () => {
      const imgs = await (await import("@/lib/render")).pdfToImages(file, { type: o.imgType }, progress);
      await downloadZip(imgs, `${baseName(file.name)}_images.zip`);
    }),
    "page-numbers": () => run(async () =>
      download(await pdf.addPageNumbers(file, { position: o.pos, start: Number(o.start) || 1 }), `${baseName(file.name)}_numbered.pdf`)),
    watermark: () => run(async () => {
      if (!o.wmText.trim()) throw new Error("Enter watermark text");
      download(await pdf.addWatermark(file, { text: o.wmText }), `${baseName(file.name)}_watermarked.pdf`);
    }),
    protect: () => run(async () => {
      if (o.password.length < 4) throw new Error("Use a password of at least 4 characters");
      download(await pdf.protectPdf(file, o.password), `${baseName(file.name)}_protected.pdf`);
    }),
    unlock: () => run(async () => {
      const bytes = await (await import("@/lib/render")).unlockPdf(file, o.password, progress);
      download(bytes, `${baseName(file.name)}_unlocked.pdf`);
      return "Unlocked. Pages were re-rendered as images, so text is not selectable.";
    }),
  };

  const options = () => {
    switch (toolId) {
      case "split": return (
        <div className="row">
          <label className="f">Mode
            <select value={o.splitMode} onChange={(e) => set("splitMode", e.target.value)}>
              <option value="ranges">By ranges</option><option value="every">Every page separately</option>
            </select></label>
          {o.splitMode === "ranges" && (
            <label className="f">Ranges (comma = separate files)
              <input type="text" placeholder="1-3, 5, 7-" value={o.ranges} onChange={(e) => set("ranges", e.target.value)} /></label>)}
        </div>);
      case "compress": return (
        <div className="row"><label className="f">Compression
          <select value={o.level} onChange={(e) => set("level", e.target.value)}>
            <option value="low">Low (best quality)</option><option value="medium">Medium</option><option value="high">High (smallest)</option>
          </select></label></div>);
      case "pdf-to-jpg": return (
        <div className="row"><label className="f">Format
          <select value={o.imgType} onChange={(e) => set("imgType", e.target.value)}>
            <option value="image/jpeg">JPG</option><option value="image/png">PNG</option>
          </select></label></div>);
      case "page-numbers": return (
        <div className="row">
          <label className="f">Position
            <select value={o.pos} onChange={(e) => set("pos", e.target.value)}>
              {["bottom-center", "bottom-left", "bottom-right", "top-center", "top-left", "top-right"].map((p) => <option key={p}>{p}</option>)}
            </select></label>
          <label className="f">Start at<input type="number" min="0" value={o.start} onChange={(e) => set("start", e.target.value)} /></label>
        </div>);
      case "watermark": return (
        <div className="row"><label className="f">Text<input type="text" value={o.wmText} onChange={(e) => set("wmText", e.target.value)} /></label></div>);
      case "protect": case "unlock": return (
        <div className="row"><label className="f">Password
          <input type="password" value={o.password} onChange={(e) => set("password", e.target.value)} /></label></div>);
      default: return null;
    }
  };

  const reset = () => { setFiles([]); setMsg(null); };

  return (
    <div className="panel">
      {!files.length ? (
        <FileDrop accept={accept} multiple={multiple} onFiles={setFiles} />
      ) : (
        <>
          <ul className="files">
            {files.map((f, i) => (
              <li key={f.name + i}>
                <span className="n">{f.name}</span><small>{formatSize(f.size)}</small>
                {multiple && <>
                  <button className="btn ghost" onClick={() => move(i, -1)}>↑</button>
                  <button className="btn ghost" onClick={() => move(i, 1)}>↓</button>
                  <button className="btn ghost" onClick={() => setFiles(files.filter((_, k) => k !== i))}>✕</button></>}
              </li>))}
          </ul>
          {multiple && <FileDrop accept={accept} multiple onFiles={(n) => setFiles([...files, ...n])} label="Add more files" />}

          {toolId === "organize" && <OrganizeGrid file={file} onError={(t) => setMsg({ ok: false, text: t })} onDone={(m) => setMsg({ ok: true, text: m })} />}
          {toolId === "edit" && <PdfEditor file={file} onError={(t) => setMsg({ ok: false, text: t })} onDone={(m) => setMsg({ ok: true, text: m })} />}

          {toolId !== "organize" && toolId !== "edit" && (
            <>
              {options()}
              <div className="row">
                <button className="btn" disabled={busy} onClick={actions[toolId]}>{busy ? "Working..." : "Run " + toolId.replace(/-/g, " ")}</button>
                <button className="btn ghost" onClick={reset}>Start over</button>
              </div>
            </>
          )}
          {(toolId === "organize" || toolId === "edit") && <div className="row"><button className="btn ghost" onClick={reset}>Choose another file</button></div>}
        </>
      )}
      {msg && <div className={"msg " + (msg.ok ? "ok" : "err")}>{msg.text}</div>}
    </div>
  );
}
