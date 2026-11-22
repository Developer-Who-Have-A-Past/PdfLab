"use client";
import { useRef, useState } from "react";

export default function FileDrop({ accept, multiple, onFiles, label }) {
  const ref = useRef(null);
  const [over, setOver] = useState(false);
  const pick = (list) => {
    const files = Array.from(list || []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  return (
    <div
      className={"drop" + (over ? " over" : "")}
      onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
    >
      <input ref={ref} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      <div style={{ fontSize: 34 }}>📄</div>
      <strong>{label || (multiple ? "Select files" : "Select a file")}</strong>
      <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>or drop here</div>
    </div>
  );
}
