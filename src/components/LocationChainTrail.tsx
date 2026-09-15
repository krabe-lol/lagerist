import Link from "next/link";

export default function LocationChainTrail({ links }: { links: { name: string; href: string }[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-base-content/60">
      {links.map((l, i) => (
        <span key={l.href} className="flex items-center gap-1">
          {i > 0 && <span>›</span>}
          <Link href={l.href} className="link">
            {l.name}
          </Link>
        </span>
      ))}
    </div>
  );
}
