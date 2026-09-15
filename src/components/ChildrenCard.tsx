import Link from "next/link";
import EntityTree from "@/components/EntityTree";
import type { EntityNode } from "@/lib/entities";

export default function ChildrenCard({
  nodes,
  emptyText,
  quickAdds,
  className = "",
}: {
  nodes: EntityNode[];
  emptyText: string;
  quickAdds?: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <div className={`rounded-box border border-base-300 bg-base-100 p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Inhalt</h2>
        {quickAdds && quickAdds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickAdds.map((a) => (
              <Link key={a.href} href={a.href} className="btn btn-outline btn-xs">
                + {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {nodes.length === 0 ? <p className="text-sm text-base-content/60">{emptyText}</p> : <EntityTree nodes={nodes} />}
    </div>
  );
}
