import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { searchAndHydrate } from "@/lib/search-results";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? await searchAndHydrate(query, 100) : [];

  return (
    <div>
      <Breadcrumbs items={[{ label: "Suche" }]} />
      <h1 className="mb-6 text-2xl font-bold">Suche</h1>

      <form action="/search" className="mb-6 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Suche nach Name, Beschreibung, Tag, Feldwert ..."
          className="input input-bordered flex-1"
        />
        <button type="submit" className="btn btn-primary">
          Suchen
        </button>
      </form>

      {query && (
        <p className="mb-4 text-sm text-base-content/60">
          {results.length} Ergebnis{results.length !== 1 && "se"} für „{query}“
        </p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((r) => (
          <Link
            key={`${r.entityType}-${r.id}`}
            href={r.href}
            className="flex items-center justify-between rounded-box border border-base-300 bg-base-100 px-4 py-3 hover:border-primary"
          >
            <div>
              <p className="font-medium">{r.name}</p>
              {r.breadcrumb && <p className="text-xs text-base-content/60">{r.breadcrumb}</p>}
            </div>
            <span className="badge badge-ghost badge-sm">{r.typeLabel}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
