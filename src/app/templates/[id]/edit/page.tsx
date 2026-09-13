import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import TemplateForm from "@/app/templates/TemplateForm";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) notFound();

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Vorlagen", href: "/templates" }, { label: template.name }, { label: "Bearbeiten" }]}
      />
      <h1 className="mb-6 text-2xl font-bold">Vorlage bearbeiten</h1>
      <TemplateForm mode="edit" template={template} />
    </div>
  );
}
