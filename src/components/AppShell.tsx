"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Forklift, Home, MapPin, Box, LayoutGrid, ClipboardList, ScanLine, Tag, Menu } from "lucide-react";
import CreateMenu from "@/components/CreateMenu";
import QuickSearch from "@/components/QuickSearch";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rooms", label: "Räume", icon: MapPin },
  { href: "/containers", label: "Container", icon: Box },
  { href: "/items", label: "Artikel", icon: LayoutGrid },
];

const NAV_LINKS_AFTER_SEPARATOR = [
  { href: "/templates", label: "Vorlagen", icon: ClipboardList },
  { href: "/scan", label: "QR-Scan", icon: ScanLine },
  { href: "/labels", label: "Label-Druck", icon: Tag },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close the mobile drawer whenever a nav link changes the route (Next.js
  // client-side navigation doesn't remount this component, so the checkbox
  // wouldn't otherwise reset on its own). Adjusting state during render, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes,
  // instead of in an effect, which would cause an extra render pass.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="drawer min-h-dvh lg:drawer-open">
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={open}
        onChange={(e) => setOpen(e.target.checked)}
      />
      <div className="drawer-content flex min-w-0 flex-1 flex-col">
        <header className="no-print flex items-center gap-2 border-b border-base-300 bg-base-100 px-3 py-3 sm:gap-3 sm:px-6">
          <label
            htmlFor="app-drawer"
            className="btn btn-square btn-ghost btn-sm shrink-0 lg:hidden"
            aria-label="Menü öffnen"
          >
            <Menu className="h-5 w-5" />
          </label>
          <CreateMenu />
          <div className="min-w-0 flex-1">
            <QuickSearch />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-12 lg:py-8">{children}</main>
      </div>

      <div className="drawer-side z-20">
        <label htmlFor="app-drawer" aria-label="Menü schließen" className="drawer-overlay"></label>
        <aside className="no-print flex h-full w-64 flex-col gap-1 border-r border-base-300 bg-base-100 p-4">
          <Link href="/" className="mb-4 flex items-center gap-2 px-2 text-lg font-bold text-primary">
            <Forklift className="h-6 w-6" />
            Lagerist
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-btn px-3 py-2 text-md font-medium hover:bg-base-200"
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-base-300" />
            {NAV_LINKS_AFTER_SEPARATOR.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-btn px-3 py-2 text-md font-medium hover:bg-base-200"
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}
