import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/tools";

export default function Home() {
  return (
    <>
      <h1>Every tool you need to work with PDFs</h1>
      <p className="lead">Merge, split, compress, convert, edit and protect. Everything is processed locally, so nothing is uploaded.</p>
      {CATEGORIES.map((c) => (
        <section key={c.id}>
          <h2 className="cat">{c.label}</h2>
          <div className="grid">
            {TOOLS.filter((t) => t.cat === c.id).map((t) => (
              <Link key={t.id} href={`/tools/${t.id}/`} className="tool">
                <div className="ic">{t.icon}</div>
                <h3>{t.name}</h3>
                <p>{t.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
