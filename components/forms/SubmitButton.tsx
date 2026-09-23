"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { useFormPending } from "./ActionForm";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel = "Salvando…",
  variant = "primary",
  size = "md",
  className,
  name,
  value,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md";
  className?: string;
  name?: string;
  value?: string;
}) {
  const status = useFormStatus();
  const pending = useFormPending() || status.pending;
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-disabled={pending}
      className={buttonClass(variant, size, className)}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? pendingLabel : children}
    </button>
  );
}
