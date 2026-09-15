import type { ReactNode } from "react";
import EntityCard from "@/components/EntityCard";

export interface EntityCollectionItem {
  key: string;
  href: string;
  title: ReactNode;
  subtitle?: string | null;
  meta?: ReactNode;
  badge?: string;
}

export default function EntityCollection({
  items,
  emptyText,
  layout = "grid",
}: {
  items: EntityCollectionItem[];
  emptyText: string;
  layout?: "grid" | "stack";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-base-content/60">{emptyText}</p>;
  }

  return (
    <div className={layout === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-2"}>
      {items.map((item) => (
        <EntityCard
          key={item.key}
          href={item.href}
          title={item.title}
          subtitle={item.subtitle}
          meta={item.meta}
          badge={item.badge}
          dense={layout === "stack"}
        />
      ))}
    </div>
  );
}
