import type { ReactNode } from "react";

export default function FormField({
  label,
  as: Tag = "label",
  className = "",
  labelClassName = "label-text",
  children,
}: {
  label?: ReactNode;
  /** Use "div" instead of the default "label" when wrapping more than one
   * form control (a <label> should only ever pair with a single control). */
  as?: "label" | "div";
  className?: string;
  labelClassName?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`form-control flex flex-col gap-1 ${className}`}>
      {label && <span className={labelClassName}>{label}</span>}
      {children}
    </Tag>
  );
}
