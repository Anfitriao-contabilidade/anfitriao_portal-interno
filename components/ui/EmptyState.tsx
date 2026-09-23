import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ocean/20 bg-white/60 px-6 py-10 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ocean-50 text-ocean" aria-hidden>
          {icon}
        </div>
      )}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
