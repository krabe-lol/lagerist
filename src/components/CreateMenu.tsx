"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function CreateMenu() {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative shrink-0">
      <div className="join">
        <Link href="/items/new" className="btn btn-primary btn-sm join-item">
          + Artikel
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="Weitere Entity-Typen anlegen"
          className="btn btn-primary btn-sm join-item px-2"
        >
          ▾
        </button>
      </div>
      {open && (
        <ul className="menu absolute z-20 mt-1 w-44 rounded-box border border-base-300 bg-base-100 p-1 shadow-lg">
          <li>
            <Link href="/rooms/new" onClick={() => setOpen(false)}>
              + Raum
            </Link>
          </li>
          <li>
            <Link href="/containers/new" onClick={() => setOpen(false)}>
              + Container
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
