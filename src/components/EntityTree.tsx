import Link from "next/link";
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

export default function EntityTree({ nodes, depth = 0 }: { nodes: EntityNode[]; depth?: number }) {
  if (nodes.length === 0) return null;

  return (
    <ul className={depth === 0 ? "flex flex-col gap-1" : "mt-1 flex flex-col gap-1 border-l border-base-300 pl-3"}>
      {nodes.map((node) => (
        <li key={`${node.kind}-${node.id}`}>
          <div className="flex items-center gap-2">
            <Link href={node.href} className="link text-sm">
              <NodeTitle node={node} />
            </Link>
            <span className="badge badge-ghost badge-xs shrink-0">{KIND_LABEL[node.kind]}</span>
          </div>
          {node.kind !== "item" && <EntityTree nodes={node.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}
