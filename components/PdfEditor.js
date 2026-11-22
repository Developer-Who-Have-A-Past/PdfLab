"use client";
import { useEffect, useRef, useState } from "react";
import { openPdf, renderPage } from "@/lib/render";
import { applyEdits, download, baseName } from "@/lib/pdf";

const SCALE = 1.25;

// Small drawing pad that produces a transparent PNG signature.
function SignaturePad({ onSave, onCancel }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e) => { drawing.current = true; const c = ref.current.getContext("2d"); c.lineWidth = 2.5; c.lineCap = "round"; c.beginPath(); c.moveTo(...pos(e)); };
  const move = (e) => { if (!drawing.current) return; const c = ref.current.getContext("2d"); c.lineTo(...pos(e)); c.stroke(); };
  const up = () => { drawing.current = false; };
  return (
    <div className="row">
      <canvas ref={ref} width={300} height={110} className="sigpad" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <button className="btn ghost" onClick={() => ref.current.getContext("2d").clearRect(0, 0, 300, 110)}>Clear</button>
      <button className="btn ghost" onClick={() => ref.current.toBlob(async (b) => onSave(new Uint8Array(await b.arrayBuffer()), ref.current.toDataURL()))}>Use signature</button>
      <button className="btn ghost" onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default function PdfEditor({ file, onError, onDone }) {
  const [doc, setDoc] = useState(null);
  const [pageNo, setPageNo] = useState(1);
  const [dims, setDims] = useState(null);
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("Your text");
  const [size, setSize] = useState(14);
  const [sig, setSig] = useState(null); // { bytes, url }
  const [padOpen, setPadOpen] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    openPdf(file).then(setDoc).catch((e) => onError(e.name === "PasswordException" ? "This PDF is password protected. Unlock it first." : e.message));
  }, [file]);

  useEffect(() => {
    if (doc) renderPage(doc, pageNo, SCALE, canvasRef.current).then(setDims);
  }, [doc, pageNo]);

  const place = (e) => {
    if (!dims) return;
    const r = canvasRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) * (dims.width / r.width);   // canvas px
    const py = (e.clientY - r.top) * (dims.height / r.height);
    const x = px / SCALE, y = dims.pdfHeight - py / SCALE;       // PDF points
    if (mode === "text") {
      if (!text.trim()) return;
      setItems((it) => [...it, { page: pageNo - 1, type: "text", x, y: y - size, text, size }]);
    } else {
      if (!sig) { setPadOpen(true); return; }
      const w = 140, h = 51;
      setItems((it) => [...it, { page: pageNo - 1, type: "image", x, y: y - h, w, h, png: sig.bytes, url: sig.url }]);
    }
  };

  const save = async () => {
    try { download(await applyEdits(file, items), `${baseName(file.name)}_edited.pdf`); onDone("Done. Your download has started."); }
    catch (e) { onError(e.message); }
  };

  if (!doc) return <p>Loading...</p>;
  const mine = items.map((it, i) => ({ ...it, i })).filter((it) => it.page === pageNo - 1);
  const k = dims ? canvasRef.current.getBoundingClientRect().width / dims.width : 1;

  return (
    <>
      <div className="row">
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="text">Add text</option><option value="sig">Add signature</option>
        </select>
        {mode === "text" ? (<>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
          <input type="number" min="6" max="72" value={size} onChange={(e) => setSize(Number(e.target.value) || 12)} style={{ width: 80 }} />
        </>) : <button className="btn ghost" onClick={() => setPadOpen(true)}>{sig ? "Redraw signature" : "Draw signature"}</button>}
        <small style={{ color: "var(--muted)" }}>Then click the page where it should go.</small>
      </div>
      {padOpen && <SignaturePad onCancel={() => setPadOpen(false)} onSave={(bytes, url) => { setSig({ bytes, url }); setPadOpen(false); }} />}
      <div className="row">
        <button className="btn ghost" disabled={pageNo <= 1} onClick={() => setPageNo(pageNo - 1)}>← Prev</button>
        <span>Page {pageNo} / {doc.numPages}</span>
        <button className="btn ghost" disabled={pageNo >= doc.numPages} onClick={() => setPageNo(pageNo + 1)}>Next →</button>
        <button className="btn ghost" disabled={!items.length} onClick={() => setItems(items.slice(0, -1))}>Undo</button>
      </div>
      <div className="editor-wrap">
        <div className="stage" onClick={place}>
          <canvas ref={canvasRef} />
          {mine.map((it) => it.type === "text"
            ? <div key={it.i} className="item" style={{ left: it.x * SCALE * k, top: (dims.pdfHeight - it.y) * SCALE * k, fontSize: it.size * SCALE * k, lineHeight: 1 }}>{it.text}</div>
            : <img key={it.i} className="item" alt="" src={it.url} style={{ left: it.x * SCALE * k, top: (dims.pdfHeight - it.y) * SCALE * k, width: it.w * SCALE * k, height: it.h * SCALE * k }} />)}
        </div>
      </div>
      <div className="row"><button className="btn" disabled={!items.length} onClick={save}>Save edited PDF</button></div>
    </>
  );
}
