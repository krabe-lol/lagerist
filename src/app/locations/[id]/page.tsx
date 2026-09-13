import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLocationAncestors, getTagNames, getTemplateFieldDefs } from "@/lib/entities";
import Breadcrumbs from "@/components/Breadcrumbs";
import TagBadges from "@/components/TagBadges";
import CustomFieldsView from "@/components/CustomFieldsView";
import AttachmentSection from "@/components/AttachmentSection";
import QrCodeBlock from "@/components/QrCodeBlock";
import { deleteLocationAction } from "@/app/locations/actions";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const location = await prisma.location.findUnique({
    where: { id },
    include: {
      children: { orderBy: { name: "asc" }, include: { _count: { select: { containers: true, children: true } } } },
      containers: { orderBy: { name: "asc" }, include: { _count: { select: { items: true } } } },
      attachments: true,
      template: true,
    },
  });
  if (!location) notFound();

  const [ancestors, tagNames, fieldDefs] = await Promise.all([
    getLocationAncestors(location.parentId),
    getTagNames("LOCATION", location.id),
    getTemplateFieldDefs(location.templateId),
  ]);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Locations", href: "/locations" },
          ...ancestors.map((a) => ({ label: a.name, href: `/locations/${a.id}` })),
          { label: location.name },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{location.name}</h1>
          {location.description && <p className="mt-1 text-base-content/70">{location.description}</p>}
          <div className="mt-2">
            <TagBadges tags={tagNames} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/locations/new?parentId=${location.id}`} className="btn btn-sm">
            + Unter-Location
          </Link>
          <Link href={`/containers/new?locationId=${location.id}`} className="btn btn-sm">
            + Container
          </Link>
          <Link href={`/locations/${location.id}/edit`} className="btn btn-sm btn-ghost">
            Bearbeiten
          </Link>
          <form action={deleteLocationAction}>
            <input type="hidden" name="id" value={location.id} />
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
              <CustomFieldsView customFields={location.customFields} fieldDefs={fieldDefs} />
            </section>
          )}

          {location.children.length > 0 && (
            <section>
              <h2 className="mb-2 font-semibold">Unter-Locations</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {location.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/locations/${child.id}`}
                    className="rounded-box border border-base-300 bg-base-100 p-3 hover:border-primary"
                  >
                    <p className="font-medium">{child.name}</p>
                    <p className="text-xs text-base-content/60">
                      {child._count.children} Unter-Locations · {child._count.containers} Container
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 font-semibold">Container</h2>
            {location.containers.length === 0 ? (
              <p className="text-sm text-base-content/60">Noch keine Container in dieser Location.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {location.containers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/containers/${c.id}`}
                    className="rounded-box border border-base-300 bg-base-100 p-3 hover:border-primary"
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-base-content/60">{c._count.items} Items</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Anhänge</h2>
            <AttachmentSection
              entityType="LOCATION"
              entityId={location.id}
              primaryPhotoId={location.primaryPhotoId}
              attachments={location.attachments}
            />
          </section>
        </div>

        <div>
          <QrCodeBlock type="LOCATION" id={location.id} />
        </div>
      </div>
    </div>
  );
}
