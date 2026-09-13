import TemplateForm from "@/app/templates/TemplateForm";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function NewTemplatePage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Vorlagen", href: "/templates" }, { label: "Neu" }]} />
      <h1 className="mb-6 text-2xl font-bold">Neue Vorlage</h1>
      <TemplateForm mode="new" />
    </div>
  );
}
