"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import type { SaveState } from "@/lib/versioning";

const ENTITY = {
  location: { noun: "Raum", segment: "rooms" },
  container: { noun: "Container", segment: "containers" },
  item: { noun: "Artikel", segment: "items" },
} as const;

/** The <form> for the Room/Container/Item edit (and "New") pages. Submits
 * id + the `updatedAt` it was rendered with, and handles the two ways a save
 * can fail when several people work at once (see lib/versioning.ts):
 * someone else saved in between → ask whether to overwrite; someone else
 * deleted it → say so instead of crashing into an error page. */
export default function VersionedForm({
  action,
  entity,
  id,
  updatedAt,
  className,
  children,
}: {
  action: (state: SaveState, formData: FormData) => Promise<SaveState>;
  entity: keyof typeof ENTITY;
  id: string;
  updatedAt: Date;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState(action, null);
  // Submitting via onSubmit + dispatch (instead of <form action>) keeps
  // React from resetting the fields after a conflict, and lets "overwrite"
  // resend exactly what the user had entered.
  const lastSubmission = useRef<FormData | null>(null);
  const [answeredConflict, setAnsweredConflict] = useState<SaveState>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const { noun, segment } = ENTITY[entity];
  const detailHref = `/${segment}/${id}`;
  const showConflict = state?.status === "conflict" && state !== answeredConflict;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (showConflict && !dialog.open) dialog.showModal();
    if (!showConflict && dialog.open) dialog.close();
  }, [showConflict]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    lastSubmission.current = formData;
    startTransition(() => dispatch(formData));
  }

  function overwrite() {
    setAnsweredConflict(state);
    const formData = lastSubmission.current;
    if (!formData) return;
    formData.set("force", "1");
    startTransition(() => dispatch(formData));
  }

  function discard() {
    setAnsweredConflict(state);
    router.push(detailHref);
  }

  return (
    <>
      <form onSubmit={submit}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="version" value={new Date(updatedAt).getTime()} />
        {state?.status === "deleted" && (
          <div role="alert" className="alert alert-error mb-4">
            <TriangleAlert className="h-5 w-5" />
            <span>
              Dieser {noun} wurde inzwischen von jemand anderem gelöscht. Deine Änderungen konnten nicht gespeichert
              werden.{" "}
              <Link href={`/${segment}`} className="link">
                Zur Übersicht
              </Link>
            </span>
          </div>
        )}
        <fieldset disabled={pending} className={className}>
          {children}
        </fieldset>
      </form>

      <dialog
        ref={dialogRef}
        className="modal"
        // Esc would otherwise close the dialog without either answer.
        onCancel={(e) => e.preventDefault()}
      >
        <div className="modal-box">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <TriangleAlert className="h-5 w-5 text-warning" />
            Zwischenzeitlich geändert
          </h3>
          <p className="py-4">
            Jemand anderes hat diesen {noun} gespeichert, während du ihn bearbeitet hast. Wenn du jetzt speicherst,
            werden diese Änderungen überschrieben. Willst du das wirklich?
          </p>
          <p className="text-sm text-base-content/60">
            „Nein“ verwirft deine Eingaben und öffnet den {noun} mit dem aktuellen Stand.
          </p>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={discard}>
              Nein, verwerfen
            </button>
            <button type="button" className="btn btn-warning" onClick={overwrite}>
              Ja, überschreiben
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
