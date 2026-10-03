import Link from "next/link";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";
import { ORPHAN_KINDS, findOrphans, type OrphanKind } from "@/lib/orphans";
import { deleteAllOrphansAction, deleteOrphanAction } from "@/app/cleanup/cleanupActions";

const SECTIONS: Record<OrphanKind, { title: string; description: string }> = {
  draft: {
    title: "Abgebrochene Entwürfe",
    description:
      "„Neu“-Seiten, die vor über 24 Stunden geöffnet, aber nie gespeichert oder abgebrochen wurden — samt bereits hochgeladener Anhänge.",
  },
  file: {
    title: "Dateien ohne Eintrag",
    description:
      "Foto- und Dateianhänge auf der Festplatte, die zu keinem Raum, Container oder Artikel mehr gehören. Dateien jünger als eine Stunde werden ausgelassen, da sie noch mitten im Hochladen sein können.",
  },
  missingFile: {
    title: "Anhänge ohne Datei",
    description: "Anhänge, deren Datei auf der Festplatte fehlt. Sie erscheinen als kaputte Bilder bzw. Downloads.",
  },
  unassigned: {
    title: "Anhänge ohne Zuordnung",
    description: "Anhänge, die zu keinem Raum, Container oder Artikel gehören.",
  },
  index: {
    title: "Suchindex",
    description: "Sucheinträge für gelöschte Objekte oder doppelte Einträge.",
  },
};

function DeleteButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="btn btn-circle btn-error btn-sm hover:border-error hover:bg-white hover:text-error"
      aria-label={label}
      title="Löschen"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export default async function CleanupPage() {
  const orphans = await findOrphans();
  const total = ORPHAN_KINDS.reduce((sum, kind) => sum + orphans[kind].length, 0);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: "Aufräumen" }]}
        title="Aufräumen"
        description="Verwaiste Daten, die übrig bleiben können, wenn mehrere Personen gleichzeitig arbeiten oder ein Vorgang abgebrochen wird."
        actions={
          total > 0 && (
            <ConfirmDeleteForm
              action={deleteAllOrphansAction}
              confirmMessage={`Alle ${total} verwaisten Einträge wirklich löschen?`}
              hiddenFields={{}}
            >
              <button type="submit" className="btn btn-error btn-sm">
                <Trash2 className="h-4 w-4" />
                Alle löschen ({total})
              </button>
            </ConfirmDeleteForm>
          )
        }
      />

      {total === 0 ? (
        <p className="text-sm text-base-content/60">Alles sauber — nichts Verwaistes gefunden.</p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-6">
          {ORPHAN_KINDS.filter((kind) => orphans[kind].length > 0).map((kind) => (
            <section key={kind}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">
                  {SECTIONS[kind].title} ({orphans[kind].length})
                </h2>
                <ConfirmDeleteForm
                  action={deleteAllOrphansAction}
                  confirmMessage={`Alle ${orphans[kind].length} Einträge unter „${SECTIONS[kind].title}“ wirklich löschen?`}
                  hiddenFields={{ kind }}
                >
                  <button type="submit" className="btn btn-outline btn-error btn-xs">
                    Alle löschen
                  </button>
                </ConfirmDeleteForm>
              </div>
              <p className="mb-2 text-sm text-base-content/60">{SECTIONS[kind].description}</p>
              <ul className="flex flex-col gap-1">
                {orphans[kind].map((orphan) => (
                  <li
                    key={orphan.key}
                    className="flex items-center justify-between gap-3 rounded-box border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {orphan.href ? (
                          <Link href={orphan.href} className="link">
                            {orphan.title}
                          </Link>
                        ) : (
                          orphan.title
                        )}
                      </p>
                      <p className="truncate text-xs text-base-content/60">{orphan.detail}</p>
                    </div>
                    <ConfirmDeleteForm
                      action={deleteOrphanAction}
                      confirmMessage={`„${orphan.title}“ wirklich löschen?`}
                      hiddenFields={{ kind, key: orphan.key }}
                      className="shrink-0"
                    >
                      <DeleteButton label={`${orphan.title} löschen`} />
                    </ConfirmDeleteForm>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
