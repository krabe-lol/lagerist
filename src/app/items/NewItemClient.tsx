"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ItemForm from "@/app/items/ItemForm";
import { getOrCreateItemDraft, deleteItemDraft, type DraftItem } from "@/lib/drafts";
import type { PlaceRoomOption, PlaceContainerOption } from "@/components/PlaceOptions";

/** See NewRoomClient for why draft creation happens in a mount effect here
 * instead of during the "New" page's own server render. */
export default function NewItemClient({
  roomOptions,
  containerOptions,
  initialRoomId,
  initialContainerId,
  resumeDraftId,
  attachments,
}: {
  roomOptions: PlaceRoomOption[];
  containerOptions: PlaceContainerOption[];
  initialRoomId?: string;
  initialContainerId?: string;
  /** Set when an upload brought the user back here: keep filling in that draft. */
  resumeDraftId?: string;
  /** Server-rendered AttachmentSection for the resumed draft. */
  attachments?: ReactNode;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreateItemDraft({ locationId: initialRoomId, containerId: initialContainerId }, resumeDraftId).then((d) => {
      // Unmounted before the draft arrived (navigated away, or React
      // StrictMode's dev double-mount): don't leave it behind as an orphan.
      if (!cancelled) setDraft(d);
      else if (d.id !== resumeDraftId) void deleteItemDraft(d.id);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!draft) {
    return <div className="skeleton h-64 w-full max-w-2xl" />;
  }

  function cancel() {
    if (draft) void deleteItemDraft(draft.id);
    router.push("/items");
  }

  return (
    <ItemForm
      mode="new"
      item={draft}
      roomOptions={roomOptions}
      containerOptions={containerOptions}
      initialTags={[]}
      initialRoomId={initialRoomId}
      initialContainerId={initialContainerId}
      onCancel={cancel}
      attachments={draft.id === resumeDraftId ? attachments : undefined}
    />
  );
}
