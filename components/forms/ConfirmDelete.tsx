"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { ActionForm } from "./ActionForm";
import { SubmitButton } from "./SubmitButton";
import type { ActionState } from "@/lib/actions";

/**
 * Exclusão em duas etapas (evita apagar algo com um toque acidental no celular).
 * A confirmação é inline — sem window.confirm (bloqueante e pouco acessível).
 */
export function ConfirmDelete({
  action,
  id,
  label = "Remover",
  confirmLabel = "Confirmar exclusão",
  description,
  extra,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id: string;
  /** Campos ocultos adicionais (ex.: imovel_id de um item de estoque). */
  extra?: Record<string, string>;
  label?: string;
  confirmLabel?: string;
  description?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={buttonClass("danger", "sm")}>
        <Trash2 className="h-4 w-4" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <ActionForm action={action} className="flex flex-col items-stretch gap-2 sm:items-end">
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {description && <p className="max-w-xs text-xs text-red-800">{description}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={() => setConfirming(false)} className={buttonClass("ghost", "sm")}>
          Cancelar
        </button>
        <SubmitButton variant="danger" size="sm" pendingLabel="Removendo…">
          {confirmLabel}
        </SubmitButton>
      </div>
    </ActionForm>
  );
}
