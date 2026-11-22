import { notFound } from "next/navigation";
import { TOOLS, toolById } from "@/lib/tools";
import ToolWorkspace from "@/components/ToolWorkspace";

export const dynamicParams = false;
export function generateStaticParams() {
  return TOOLS.map((t) => ({ tool: t.id }));
}

export default async function ToolPage({ params }) {
  const { tool } = await params;
  const t = toolById(tool);
  if (!t) notFound();
  return (
    <>
      <h1>{t.name}</h1>
      <p className="lead">{t.desc}</p>
      <ToolWorkspace toolId={t.id} />
    </>
  );
}
