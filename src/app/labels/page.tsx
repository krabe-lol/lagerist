import Breadcrumbs from "@/components/Breadcrumbs";
import LabelsClient from "@/app/labels/LabelsClient";

export default function LabelsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Label-Druck" }]} />
      <h1 className="mb-6 text-2xl font-bold no-print">Label-Druck</h1>
      <LabelsClient />
    </div>
  );
}
