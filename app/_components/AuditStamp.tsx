import { formatAuditStamp, type AuditStampData } from "@/lib/audit";

/** Línea pequeña con quién creó / modificó el registro y cuándo. */
export function AuditStamp({ record }: { record: AuditStampData }) {
  const text = formatAuditStamp(record);
  if (!text) return null;
  return <p className="text-xs text-neutral-500 dark:text-neutral-500">{text}</p>;
}
