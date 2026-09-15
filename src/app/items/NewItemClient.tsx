"use client";

import { useEffect, useState } from "react";
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
}: {
  roomOptions: PlaceRoomOption[];
  containerOptions: PlaceContainerOption[];
  initialRoomId?: string;
  initialContainerId?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreateItemDraft({ locationId: initialRoomId, containerId: initialContainerId }).then((d) => {
      if (!cancelled) setDraft(d);
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
    />
  );
}
