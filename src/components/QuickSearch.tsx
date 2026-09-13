"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SearchHit } from "@/lib/search-results";

export default function QuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    const timeout = setTimeout(async () => {
      if (!q) {
        setResults([]);
        return;
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = (await res.json()) as SearchHit[];
        setResults(data);
        setOpen(true);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToFullSearch() {
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && goToFullSearch()}
        placeholder="Suche nach Name, Beschreibung, Tag ..."
        className="input input-bordered w-full"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-box border border-base-300 bg-base-100 shadow-lg">
          <ul className="max-h-96 overflow-y-auto py-1">
            {results.map((r) => (
              <li key={`${r.entityType}-${r.id}`}>
                <Link
                  href={r.href}
                  className="flex items-center justify-between px-3 py-2 text-sm hover:bg-base-200"
                  onClick={() => setOpen(false)}
                >
                  <span className="truncate">{r.name}</span>
                  <span className="badge badge-sm badge-ghost ml-2 shrink-0">{r.typeLabel}</span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            onClick={goToFullSearch}
            className="w-full border-t border-base-300 px-3 py-2 text-left text-sm text-primary hover:bg-base-200"
          >
            Alle Ergebnisse für „{query}“ anzeigen
          </button>
        </div>
      )}
    </div>
  );
}
