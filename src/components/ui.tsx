import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ label, className }: { label: string; className: string }) {
  return <span className={`badge ${className}`}>{label}</span>;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card text-center py-12">
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-gold mt-4 inline-flex">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "gold";
}) {
  const toneClass =
    tone === "warning"
      ? "border-red-200 bg-red-50"
      : tone === "gold"
      ? "border-gold/30 bg-gold/5"
      : "border-line bg-white";

  return (
    <div className={`rounded-2xl border p-4 shadow-card ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-2xl font-bold text-ink mt-1">{value}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}
