import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  as: Tag = "div",
  id,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6", className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  as: Heading = "h2",
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Heading className="font-display text-lg font-semibold text-ink">{title}</Heading>
        {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
