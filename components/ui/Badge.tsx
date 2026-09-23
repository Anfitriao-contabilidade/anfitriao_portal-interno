import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "gold";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-paper text-ink-soft",
  info: "border-ocean/20 bg-ocean-50 text-ocean",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
  gold: "border-gold/30 bg-gold-50 text-gold-dark",
};

const dots: Record<Tone, string> = {
  neutral: "bg-ink-soft",
  info: "bg-ocean",
  success: "bg-emerald-600",
  warning: "bg-amber-500",
  danger: "bg-red-600",
  gold: "bg-gold",
};

export function Badge({
  tone = "neutral",
  children,
  dot = false,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-[.72rem] font-medium",
        tones[tone],
        className
      )}
    >
      {dot && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}
