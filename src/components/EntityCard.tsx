import type { ReactNode } from "react";
import Link from "next/link";

export default function EntityCard({
  href,
  title,
  subtitle,
  meta,
  badge,
  dense = false,
}: {
  href: string;
  title: ReactNode;
  subtitle?: string | null;
  meta?: ReactNode;
  badge?: string;
  dense?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-box border border-base-300 bg-base-100 transition hover:border-primary ${dense ? "p-3" : "p-4"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={dense ? "font-medium" : "font-semibold"}>{title}</p>
        {badge && <span className="badge badge-ghost badge-sm shrink-0">{badge}</span>}
      </div>
      {subtitle && <p className={`truncate text-sm text-base-content/60 ${dense ? "" : "mt-1"}`}>{subtitle}</p>}
      {meta && <p className={`text-xs text-base-content/60 ${dense ? "" : "mt-2"}`}>{meta}</p>}
    </Link>
  );
}
