import Link from "next/link";
import { prisma } from "@/lib/db";
import Breadcrumbs from "@/components/Breadcrumbs";
import { deleteTemplateAction } from "@/app/templates/actions";
import { ENTITY_LABELS, ENTITY_TYPES, type TemplateFieldDef } from "@/lib/constants";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Vorlagen" }]} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vorlagen</h1>
        <Link href="/templates/new" className="btn btn-primary btn-sm">
          + Neue Vorlage
        </Link>
      </div>

      {ENTITY_TYPES.map((type) => {
        const group = templates.filter((t) => t.entityType === type);
        if (group.length === 0) return null;
        return (
          <section key={type} className="mb-6">
            <h2 className="mb-2 font-semibold">{ENTITY_LABELS[type]}</h2>
            <div className="flex flex-col gap-2">
              {group.map((t) => {
                const fields = t.fields as unknown as TemplateFieldDef[];
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 p-3"
                  >
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-base-content/60">
                        {fields.length === 0
                          ? "Keine Felder"
                          : fields.map((f) => f.label).join(", ")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/templates/${t.id}/edit`} className="btn btn-ghost btn-sm">
                        Bearbeiten
                      </Link>
                      <form action={deleteTemplateAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className="btn btn-ghost btn-sm text-error" type="submit">
                          Löschen
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {templates.length === 0 && (
        <p className="text-base-content/60">Noch keine Vorlagen angelegt.</p>
      )}
    </div>
  );
}
