import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  icon,
  highlight = false,
  tone = "default",
  className,
}: {
  className?: string;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  highlight?: boolean;
  tone?: "default" | "negative" | "positive";
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-card sm:p-5",
        highlight ? "border-ocean/30 ring-1 ring-ocean/10" : "border-line",
        className
      )}
    >
      {highlight && <span aria-hidden className="absolute inset-y-4 left-0 w-1 rounded-r bg-ocean" />}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[.7rem] font-medium uppercase tracking-wide text-ink-soft sm:text-xs">{label}</p>
        {icon && <span className="text-ocean/60" aria-hidden>{icon}</span>}
      </div>
      <p
        className={cn(
          "mt-2 break-words font-display text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
          tone === "negative" ? "text-red-700" : tone === "positive" ? "text-emerald-800" : highlight ? "text-ocean" : "text-ink"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{hint}</p>}
    </div>
  );
}
