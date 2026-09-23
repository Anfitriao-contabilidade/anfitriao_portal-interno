"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/** Indicador de carregamento no item de menu clicado (feedback imediato de navegação). */
export function LinkPending() {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin opacity-70" aria-label="Carregando" /> : null;
}
