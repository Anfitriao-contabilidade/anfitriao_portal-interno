"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** Aviso transitório (sucesso ou erro) que some sozinho. */
export function Toast({ message, tone = "ok" }: { message: string; tone?: "ok" | "danger" }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), 3600);
    return () => window.clearTimeout(id);
  }, [message]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 nav:bottom-6" role="status">
      <p
        className={cn(
          "pointer-events-auto max-w-md rounded-card px-4 py-3 text-sm font-medium text-white shadow-pop",
          tone === "danger" ? "bg-danger" : "bg-ink"
        )}
      >
        {message}
      </p>
    </div>
  );
}
