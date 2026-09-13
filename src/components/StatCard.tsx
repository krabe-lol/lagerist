import Link from "next/link";

export default function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="rounded-box border border-base-300 bg-base-100 p-4 transition hover:border-primary">
      <p className="text-sm text-base-content/60">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
