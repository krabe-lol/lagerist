"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import RoomForm from "@/app/rooms/RoomForm";
import { getOrCreateRoomDraft, deleteRoomDraft, type DraftRoom } from "@/lib/drafts";

interface RoomOption {
  id: string;
  name: string;
}

/** Creates (or reuses) a draft room once this component actually mounts —
 * deliberately NOT during the server render of the "New" page itself,
 * since Next.js prefetches (Link hover, viewport) would otherwise silently
 * create draft rows just from a link appearing on screen. A mount-only
 * effect only fires once real navigation lands. */
export default function NewRoomClient({
  parentOptions,
  initialParentId,
  resumeDraftId,
  attachments,
}: {
  parentOptions: RoomOption[];
  initialParentId?: string;
  /** Set when an upload brought the user back here: keep filling in that draft. */
  resumeDraftId?: string;
  /** Server-rendered AttachmentSection for the resumed draft. */
  attachments?: ReactNode;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftRoom | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreateRoomDraft(initialParentId, resumeDraftId).then((d) => {
      // Unmounted before the draft arrived (navigated away, or React
      // StrictMode's dev double-mount): don't leave it behind as an orphan.
      if (!cancelled) setDraft(d);
      else if (d.id !== resumeDraftId) void deleteRoomDraft(d.id);
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
    if (draft) void deleteRoomDraft(draft.id);
    router.push("/rooms");
  }

  return (
    <RoomForm
      mode="new"
      room={draft}
      parentOptions={parentOptions}
      initialParentId={initialParentId}
      onCancel={cancel}
      attachments={draft.id === resumeDraftId ? attachments : undefined}
    />
  );
}
