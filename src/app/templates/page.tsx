import Link from "next/link";
import { prisma } from "@/lib/db";
import PageHeader from "@/components/PageHeader";
import EditDeleteActions from "@/components/EditDeleteActions";
import { deleteTemplateAction } from "@/app/templates/templateActions";

export default async function TemplatesPage() {
  const templates = await prisma.containerTemplate.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Vorlagen" }]}
        title="Vorlagen"
        description="Container-Vorlagen: Auswahl beim Anlegen eines Containers füllt Name, Maße und Volumen vor."
        actions={
          <Link href="/templates/new" className="btn btn-primary btn-sm">
            + Neue Vorlage
          </Link>
        }
      />

      {templates.length === 0 ? (
        <p className="text-sm text-base-content/60">Noch keine Vorlagen angelegt.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{t.name}</p>
                <p className="truncate text-xs text-base-content/60">
                  {[t.dimensions, t.volume].filter(Boolean).join(" · ") || "Keine Maße/Volumen hinterlegt"}
                </p>
              </div>
              <EditDeleteActions editHref={`/templates/${t.id}/edit`} deleteAction={deleteTemplateAction} id={t.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
