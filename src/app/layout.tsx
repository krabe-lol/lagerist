import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import QuickSearch from "@/components/QuickSearch";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lagerist",
  description: "Lagerverwaltung",
};

// Every page reads live data straight from SQLite; nothing here should be
// prerendered at build time (and the DB file doesn't even exist yet then).
export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/locations", label: "Locations" },
  { href: "/templates", label: "Vorlagen" },
  { href: "/scan", label: "QR-Scan" },
  { href: "/labels", label: "Label-Druck" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      data-theme="dracula"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex bg-base-200 text-base-content antialiased">
        <aside className="no-print w-56 shrink-0 border-r border-base-300 bg-base-100 p-4 flex flex-col gap-1">
          <Link href="/" className="mb-4 flex items-center gap-2 px-2 text-lg font-bold text-primary">
            📦 Lagerist
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-btn px-3 py-2 text-sm font-medium hover:bg-base-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print flex items-center gap-4 border-b border-base-300 bg-base-100 px-6 py-3">
            <QuickSearch />
          </header>
          <main className="min-w-0 flex-1 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
