"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ContainerForm from "@/app/containers/ContainerForm";
import { getOrCreateContainerDraft, deleteContainerDraft, type DraftContainer } from "@/lib/drafts";
import type { ContainerTemplateOption } from "@/components/ContainerTemplateFields";

interface RoomOption {
  id: string;
  name: string;
}

/** See NewRoomClient for why draft creation happens in a mount effect here
 * instead of during the "New" page's own server render. */
export default function NewContainerClient({
  roomOptions,
  templates,
  initialRoomId,
}: {
  roomOptions: RoomOption[];
  templates: ContainerTemplateOption[];
  initialRoomId?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftContainer | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreateContainerDraft(initialRoomId).then((d) => {
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
    if (draft) void deleteContainerDraft(draft.id);
    router.push("/containers");
  }

  return (
    <ContainerForm
      mode="new"
      container={draft}
      roomOptions={roomOptions}
      templates={templates}
      initialRoomId={initialRoomId}
      onCancel={cancel}
    />
  );
}
