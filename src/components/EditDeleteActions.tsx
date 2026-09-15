import Link from "next/link";

export default function EditDeleteActions({
  editHref,
  deleteAction,
  id,
}: {
  editHref: string;
  deleteAction: (formData: FormData) => void | Promise<void>;
  id: string;
}) {
  return (
    <div className="flex gap-2">
      <Link href={editHref} className="btn btn-sm btn-outline">
        Bearbeiten
      </Link>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={id} />
        <button className="btn btn-sm btn-outline btn-error" type="submit">
          Löschen
        </button>
      </form>
    </div>
  );
}
