import Link from "next/link";
import { cn } from "@/lib/cn";

export function FilterChips({
  items,
  active,
  ariaLabel,
}: {
  items: { href: string; label: string; value: string }[];
  active: string;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {items.map((item) => {
        const on = item.value === active;
        return (
          <Link
            key={item.value}
            href={item.href}
            prefetch={false}
            aria-current={on ? "true" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium transition-colors",
              on ? "border-ocean bg-ocean text-white" : "border-line bg-raised text-ink-soft hover:bg-ocean-50 hover:text-ocean"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
