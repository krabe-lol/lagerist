import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EntityNode } from "@/lib/entities";

const KIND_LABEL: Record<EntityNode["kind"], string> = {
  room: "Raum",
  container: "Container",
  item: "Artikel",
};

function NodeTitle({ node }: { node: EntityNode }) {
  if (node.kind === "container") {
    return (
      <>
        {node.name} <span className="text-base-content/60">#{node.number}</span>
      </>
    );
  }
  if (node.kind === "item" && node.quantity !== 1) {
    return (
      <>
        {node.name} <span className="text-base-content/60">×{node.quantity}</span>
      </>
    );
  }
  return <>{node.name}</>;
}

function NodeRow({ node }: { node: EntityNode }) {
  return (
    <>
      <Link href={node.href} className="link link-hover text-sm">
        <NodeTitle node={node} />
      </Link>
      <span className="badge badge-ghost badge-xs shrink-0">{KIND_LABEL[node.kind]}</span>
    </>
  );
}

export default function EntityTree({ nodes, depth = 0 }: { nodes: EntityNode[]; depth?: number }) {
  if (nodes.length === 0) return null;

  return (
    <ul className={depth === 0 ? "flex flex-col gap-1" : "mt-1 flex flex-col gap-1 border-l border-base-300 pl-3"}>
      {nodes.map((node) => {
        const hasChildren = node.kind !== "item" && node.children.length > 0;

        // Containers usually hold a lot of items — collapsed by default so a
        // room's content list stays scannable, expandable per-container.
        if (node.kind === "container" && hasChildren) {
          return (
            <li key={`${node.kind}-${node.id}`}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-base-content/40 transition-transform group-open:rotate-90" />
                  <NodeRow node={node} />
                </summary>
                <EntityTree nodes={node.children} depth={depth + 1} />
              </details>
            </li>
          );
        }

        return (
          <li key={`${node.kind}-${node.id}`}>
            <div className="flex items-center gap-2">
              <NodeRow node={node} />
            </div>
            {hasChildren && <EntityTree nodes={node.children} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}
