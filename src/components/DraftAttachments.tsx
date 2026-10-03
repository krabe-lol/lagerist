import { prisma } from "@/lib/db";
import { ENTITY_COLUMN, type EntityType } from "@/lib/constants";
import AttachmentSection from "@/components/AttachmentSection";

const RELATION = { LOCATION: "location", CONTAINER: "container", ITEM: "item" } as const;

/** What's already been uploaded to a draft the "New" page is resuming after
 * an upload round trip (see /api/uploads). Renders nothing if `draftId`
 * isn't (or no longer is) an unconfirmed draft. */
export default async function DraftAttachments({
  entityType,
  draftId,
  photoUploadError,
  fileUploadError,
}: {
  entityType: EntityType;
  draftId: string;
  photoUploadError?: string;
  fileUploadError?: string;
}) {
  const attachments = await prisma.attachment.findMany({
    where: { [ENTITY_COLUMN[entityType]]: draftId, [RELATION[entityType]]: { confirmed: false } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <AttachmentSection
      entityType={entityType}
      entityId={draftId}
      attachments={attachments}
      photoUploadError={photoUploadError}
      fileUploadError={fileUploadError}
    />
  );
}
