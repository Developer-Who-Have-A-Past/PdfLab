// Registry of tools shown on the home page and routed at /tools/<id>
export const CATEGORIES = [
  { id: "organize", label: "Organize PDF" },
  { id: "optimize", label: "Optimize PDF" },
  { id: "convert", label: "Convert PDF" },
  { id: "edit", label: "Edit PDF" },
  { id: "security", label: "PDF Security" },
];

export const TOOLS = [
  { id: "merge", cat: "organize", name: "Merge PDF", desc: "Combine several PDFs into one, in the order you choose.", icon: "⧉" },
  { id: "split", cat: "organize", name: "Split PDF", desc: "Split by page ranges or extract selected pages.", icon: "✂" },
  { id: "organize", cat: "organize", name: "Organize PDF", desc: "Rotate, delete and reorder pages visually.", icon: "▦" },
  { id: "compress", cat: "optimize", name: "Compress PDF", desc: "Shrink file size by recompressing pages.", icon: "⇲" },
  { id: "jpg-to-pdf", cat: "convert", name: "JPG to PDF", desc: "Turn images into a single PDF.", icon: "🖼" },
  { id: "pdf-to-jpg", cat: "convert", name: "PDF to JPG", desc: "Export every page as an image (ZIP).", icon: "⇱" },
  { id: "page-numbers", cat: "edit", name: "Add Page Numbers", desc: "Number your pages in any corner.", icon: "#" },
  { id: "watermark", cat: "edit", name: "Watermark", desc: "Stamp text across every page.", icon: "◈" },
  { id: "edit", cat: "edit", name: "Edit PDF", desc: "Add text and signatures anywhere on a page.", icon: "✎" },
  { id: "protect", cat: "security", name: "Protect PDF", desc: "Lock a PDF with a password.", icon: "🔒" },
  { id: "unlock", cat: "security", name: "Unlock PDF", desc: "Remove a password you know from a PDF.", icon: "🔓" },
];

export const toolById = (id) => TOOLS.find((t) => t.id === id);
