import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getItemAncestors, getTagNames, getTemplateFieldDefs } from "@/lib/entities";
import Breadcrumbs from "@/components/Breadcrumbs";
import TagBadges from "@/components/TagBadges";
import CustomFieldsView from "@/components/CustomFieldsView";
import AttachmentSection from "@/components/AttachmentSection";
import QrCodeBlock from "@/components/QrCodeBlock";
import { deleteItemAction } from "@/app/items/actions";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      subItems: {
        orderBy: { name: "asc" },
        include: { _count: { select: { subItems: true } } },
      },
      attachments: true,
    },
  });
  if (!item) notFound();

  const [{ locationAncestors, container, itemChain }, tagNames, fieldDefs] = await Promise.all([
    getItemAncestors(item.id),
    getTagNames("ITEM", item.id),
    getTemplateFieldDefs(item.templateId),
  ]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Locations", href: "/locations" },
          ...locationAncestors.map((a) => ({ label: a.name, href: `/locations/${a.id}` })),
          ...(container ? [{ label: container.name, href: `/containers/${container.id}` }] : []),
          ...itemChain.map((a) => ({ label: a.name, href: `/items/${a.id}` })),
          { label: item.name },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {item.name} {item.quantity !== 1 && <span className="text-base-content/60">×{item.quantity}</span>}
          </h1>
          {item.description && <p className="mt-1 text-base-content/70">{item.description}</p>}
          <div className="mt-2">
            <TagBadges tags={tagNames} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/items/new?parentItemId=${item.id}`} className="btn btn-sm">
            + Unteritem
          </Link>
          <Link href={`/items/${item.id}/edit`} className="btn btn-sm btn-ghost">
            Bearbeiten
          </Link>
          <form action={deleteItemAction}>
            <input type="hidden" name="id" value={item.id} />
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
              <CustomFieldsView customFields={item.customFields} fieldDefs={fieldDefs} />
            </section>
          )}

          {item.subItems.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Unteritems</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {item.subItems.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/items/${sub.id}`}
                    className="rounded-box border border-base-300 bg-base-100 p-3 hover:border-primary"
                  >
                    <p className="font-medium">
                      {sub.name} {sub.quantity !== 1 && <span className="text-base-content/60">×{sub.quantity}</span>}
                    </p>
                    {sub._count.subItems > 0 && (
                      <p className="text-xs text-base-content/60">{sub._count.subItems} Unteritems</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 font-semibold">Anhänge</h2>
            <AttachmentSection
              entityType="ITEM"
              entityId={item.id}
              primaryPhotoId={item.primaryPhotoId}
              attachments={item.attachments}
            />
          </section>
        </div>

        <div>
          <QrCodeBlock type="ITEM" id={item.id} />
        </div>
      </div>
    </div>
  );
}
