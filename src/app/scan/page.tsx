import Breadcrumbs from "@/components/Breadcrumbs";
import ScanClient from "@/app/scan/ScanClient";

export default function ScanPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "QR-Scan" }]} />
      <h1 className="mb-6 text-2xl font-bold">QR-Code scannen</h1>
      <ScanClient />
    </div>
  );
}
