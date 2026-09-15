import { Fragment, type ReactNode } from "react";

export default function DetailList({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-4">
      {rows.map((row, i) => (
        <Fragment key={i}>
          <dt className={`pb-3 text-base-content/60 ${i > 0 ? "border-t border-base-400 pt-3" : ""}`}>
            {row.label}
          </dt>
          <dd className={`pb-3 sm:col-span-3 ${i > 0 ? "border-t border-base-400 pt-3" : ""}`}>{row.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
