import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocationAncestors, getTagNames, getTemplateFieldDefs } from "@/lib/entities";
import Breadcrumbs from "@/components/Breadcrumbs";
import TagBadges from "@/components/TagBadges";
import CustomFieldsView from "@/components/CustomFieldsView";
import AttachmentSection from "@/components/AttachmentSection";
import QrCodeBlock from "@/components/QrCodeBlock";
import { deleteContainerAction } from "@/app/containers/actions";

export default async function ContainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const container = await prisma.container.findUnique({
    where: { id },
    include: {
      location: true,
      items: {
        where: { parentItemId: null },
        orderBy: { name: "asc" },
        include: { _count: { select: { subItems: true } } },
      },
      attachments: true,
    },
  });
  if (!container) notFound();

  const [ancestors, tagNames, fieldDefs] = await Promise.all([
    getLocationAncestors(container.location.id),
    getTagNames("CONTAINER", container.id),
    getTemplateFieldDefs(container.templateId),
  ]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Locations", href: "/locations" },
          ...ancestors.map((a) => ({ label: a.name, href: `/locations/${a.id}` })),
          { label: container.name },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{container.name}</h1>
          {container.description && (
            <p className="mt-1 text-base-content/70">{container.description}</p>
          )}
          <div className="mt-2">
            <TagBadges tags={tagNames} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/items/new?containerId=${container.id}`} className="btn btn-sm">
            + Item
          </Link>
          <Link href={`/containers/${container.id}/edit`} className="btn btn-sm btn-ghost">
            Bearbeiten
          </Link>
          <form action={deleteContainerAction}>
            <input type="hidden" name="id" value={container.id} />
            <button className="btn btn-sm btn-ghost text-error" type="submit">
              Löschen
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {fieldDefs.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Details</h2>
              <CustomFieldsView customFields={container.customFields} fieldDefs={fieldDefs} />
            </section>
          )}

          <section>
            <h2 className="mb-2 font-semibold">Items</h2>
            {container.items.length === 0 ? (
              <p className="text-sm text-base-content/60">Noch keine Items in diesem Container.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {container.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="rounded-box border border-base-300 bg-base-100 p-3 hover:border-primary"
                  >
                    <p className="font-medium">
                      {item.name} {item.quantity !== 1 && <span className="text-base-content/60">×{item.quantity}</span>}
                    </p>
                    {item._count.subItems > 0 && (
                      <p className="text-xs text-base-content/60">{item._count.subItems} Unteritems</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Anhänge</h2>
            <AttachmentSection
              entityType="CONTAINER"
              entityId={container.id}
              primaryPhotoId={container.primaryPhotoId}
              attachments={container.attachments}
            />
          </section>
        </div>

        <div>
          <QrCodeBlock type="CONTAINER" id={container.id} />
        </div>
      </div>
    </div>
  );
}
