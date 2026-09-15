import type { ReactNode } from "react";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";

export default function PageHeader({
  breadcrumbs,
  title,
  description,
  actions,
}: {
  breadcrumbs: Crumb[];
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-base-content/60">{description}</p>}
        {actions && <div className="mt-3">{actions}</div>}
      </div>
    </>
  );
}
