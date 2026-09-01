export const STATUS_STYLES: Record<
  string,
  { dot: string; label: string; text: string }
> = {
  ACTIVE: { dot: "bg-success", label: "Active", text: "text-success" },
  INACTIVE: { dot: "bg-neutral-400", label: "Inactive", text: "text-text-secondary" },
  SUSPENDED: { dot: "bg-error", label: "Suspended", text: "text-error" },
  PENDING: { dot: "bg-warning", label: "Pending", text: "text-warning" },
  APPROVED: { dot: "bg-success", label: "Approved", text: "text-success" },
  REJECTED: { dot: "bg-error", label: "Rejected", text: "text-error" },
  CANCELLED: { dot: "bg-neutral-400", label: "Cancelled", text: "text-text-secondary" },
  PLANNING: { dot: "bg-info", label: "Planning", text: "text-info" },
  ON_HOLD: { dot: "bg-warning", label: "On hold", text: "text-warning" },
  COMPLETED: { dot: "bg-success", label: "Completed", text: "text-success" },
  ARCHIVED: { dot: "bg-neutral-300", label: "Archived", text: "text-text-tertiary" },
};

export function StatusPill({ status }: { status?: string }) {
  const s =
    STATUS_STYLES[status ?? ""] ?? {
      dot: "bg-neutral-400",
      label: status ? status.charAt(0) + status.slice(1).toLowerCase() : "—",
      text: "text-text-secondary",
    };
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export const ROLE_BADGE_STYLES: Record<string, string> = {
  superadmin: "bg-brand-soft text-brand",
  founder: "bg-brand-soft text-brand",
  ceo: "bg-brand-soft text-brand",
  cto: "bg-brand-soft text-brand",
  coo: "bg-brand-soft text-brand",
  cfo: "bg-brand-soft text-brand",
  hr: "bg-warning-light text-warning",
  manager: "bg-warning-light text-warning",
  lead: "bg-info-light text-info",
  associate: "bg-neutral-100 text-neutral-700",
  member: "bg-neutral-100 text-neutral-700",
};

export function roleBadgeClass(roleName: string | undefined): string {
  return (
    ROLE_BADGE_STYLES[roleName?.toLowerCase() ?? ""] ??
    "border-border bg-surface text-text-secondary"
  );
}