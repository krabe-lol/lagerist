import TemplateForm from "@/app/templates/TemplateForm";
import PageHeader from "@/components/PageHeader";

export default function NewTemplatePage() {
  return (
    <div>
      <PageHeader breadcrumbs={[{ label: "Vorlagen", href: "/templates" }, { label: "Neu" }]} title="Neue Vorlage" />
      <TemplateForm mode="new" />
    </div>
  );
}
