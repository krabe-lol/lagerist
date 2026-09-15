import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import TemplateForm from "@/app/templates/TemplateForm";
import PageHeader from "@/components/PageHeader";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = await prisma.containerTemplate.findUnique({ where: { id: templateId } });
  if (!template) notFound();

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Vorlagen", href: "/templates" }, { label: template.name }, { label: "Bearbeiten" }]}
        title="Vorlage bearbeiten"
      />
      <TemplateForm mode="edit" template={template} />
    </div>
  );
}
