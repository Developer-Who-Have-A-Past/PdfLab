"use client";
import { useEffect, useRef, useState } from "react";
import { openPdf, renderPage } from "@/lib/render";
import { organizePdf, download, baseName } from "@/lib/pdf";

function Thumb({ pdfDoc, n, rotation }) {
  const ref = useRef(null);
  useEffect(() => { renderPage(pdfDoc, n, 0.35, ref.current); }, [pdfDoc, n]);
  return <canvas ref={ref} style={{ transform: `rotate(${rotation}deg)` }} />;
}

export default function OrganizeGrid({ file, onError, onDone }) {
  const [doc, setDoc] = useState(null);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const d = await openPdf(file);
        if (!live) return;
        setDoc(d);
        setPages(Array.from({ length: d.numPages }, (_, i) => ({ index: i, rotation: 0, deleted: false })));
      } catch (e) { onError(e.name === "PasswordException" ? "This PDF is password protected. Unlock it first." : e.message); }
    })();
    return () => { live = false; };
  }, [file]);

  const upd = (i, patch) => setPages((ps) => ps.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const move = (i, d) => setPages((ps) => {
    const j = i + d; if (j < 0 || j >= ps.length) return ps;
    const c = [...ps]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });
  const save = async () => {
    try { download(await organizePdf(file, pages), `${baseName(file.name)}_organized.pdf`); onDone("Done. Your download has started."); }
    catch (e) { onError(e.message); }
  };

  if (!doc) return <p>Loading pages...</p>;
  return (
    <>
      <div className="thumbs">
        {pages.map((p, i) => (
          <div key={p.index} className={"thumb" + (p.deleted ? " del" : "")}>
            <Thumb pdfDoc={doc} n={p.index + 1} rotation={p.rotation} />
            <div><small>Page {p.index + 1}</small></div>
            <div className="acts">
              <button className="btn ghost" title="Move left" onClick={() => move(i, -1)}>←</button>
              <button className="btn ghost" title="Rotate" onClick={() => upd(i, { rotation: (p.rotation + 90) % 360 })}>⟳</button>
              <button className="btn ghost" title="Delete / restore" onClick={() => upd(i, { deleted: !p.deleted })}>{p.deleted ? "↩" : "🗑"}</button>
              <button className="btn ghost" title="Move right" onClick={() => move(i, 1)}>→</button>
            </div>
          </div>))}
      </div>
      <div className="row"><button className="btn" onClick={save}>Save organized PDF</button></div>
    </>
  );
}
