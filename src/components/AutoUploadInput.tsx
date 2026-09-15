"use client";

export default function AutoUploadInput({
  action,
  hiddenFields,
  accept,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  accept?: string;
  className?: string;
}) {
  return (
    <form action={action}>
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input
        type="file"
        name="file"
        accept={accept}
        required
        className={className ?? "file-input file-input-bordered file-input-sm"}
        onChange={(e) => {
          if (e.currentTarget.files && e.currentTarget.files.length > 0) {
            e.currentTarget.form?.requestSubmit();
          }
        }}
      />
    </form>
  );
}
