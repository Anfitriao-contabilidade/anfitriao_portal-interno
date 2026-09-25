"use client";

import { RefreshCw } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { reconsultarNota } from "./actions";

export function ReconsultarButton({ id }: { id: string }) {
  return (
    <ActionForm action={reconsultarNota} className="flex flex-col items-end">
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost" size="sm" pendingLabel="Consultando…">
        <RefreshCw className="h-4 w-4" aria-hidden /> Atualizar status
      </SubmitButton>
    </ActionForm>
  );
}
