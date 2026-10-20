"use client";

import { RefreshCw } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { executarMonitor } from "./actions";

export function MonitorButton() {
  return (
    <ActionForm action={executarMonitor} className="flex flex-col items-stretch gap-2 sm:items-end">
      <SubmitButton variant="secondary" size="sm" pendingLabel="Verificando…">
        <RefreshCw className="h-4 w-4" aria-hidden />
        Verificar validade agora
      </SubmitButton>
    </ActionForm>
  );
}
