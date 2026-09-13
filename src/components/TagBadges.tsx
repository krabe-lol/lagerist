export default function TagBadges({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className="badge badge-secondary badge-sm">
          {tag}
        </span>
      ))}
    </div>
  );
}
