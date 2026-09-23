import { cn } from "@/lib/cn";

export function Progress({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  const tone = pct >= 80 ? "bg-emerald-600" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-ocean/10", className)}
    >
      <div className={cn("h-full rounded-full transition-[width]", tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}
