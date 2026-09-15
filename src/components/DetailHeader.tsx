import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import EditDeleteActions from "@/components/EditDeleteActions";

export default function DetailHeader({
  icon: Icon,
  title,
  badge,
  description,
  extra,
  editHref,
  deleteAction,
  deleteId,
}: {
  icon: LucideIcon;
  title: ReactNode;
  badge?: ReactNode;
  description?: string | null;
  extra?: ReactNode;
  editHref: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
  deleteId: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Icon className="h-6 w-6 shrink-0 text-primary" />
          {title} {badge}
        </h1>
        {description && <p className="mt-1 text-base-content/70">{description}</p>}
        {extra}
      </div>
      <EditDeleteActions editHref={editHref} deleteAction={deleteAction} id={deleteId} />
    </div>
  );
}
