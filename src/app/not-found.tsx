import Link from "next/link";
import { SearchX } from "lucide-react";

// Also where actions/uploads deliberately send the browser when the thing
// being worked on was deleted by someone else in the meantime.
export default function NotFound() {
  return (
    <div className="flex max-w-xl flex-col items-start gap-3">
      <SearchX className="h-10 w-10 text-base-content/40" />
      <h1 className="text-2xl font-bold">Nicht gefunden</h1>
      <p className="text-base-content/70">
        Diese Seite gibt es nicht (mehr). Falls hier eben noch ein Raum, Container oder Artikel war, hat ihn
        vermutlich jemand anderes inzwischen gelöscht.
      </p>
      <Link href="/" className="btn btn-primary btn-sm">
        Zur Startseite
      </Link>
    </div>
  );
}
