"use client";

import { useEffect } from "react";

/** Marca <html data-hydrated> quando o React assume a página (usado nos testes E2E). */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return null;
}
