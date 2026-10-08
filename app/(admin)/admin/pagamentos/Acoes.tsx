"use client";

import { useState } from "react";
import { Ban, RefreshCw } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { buttonClass } from "@/components/ui/Button";
import type { ActionState } from "@/lib/actions";
import { cancelarAssinatura, cancelarCobranca, sincronizarAssinatura, sincronizarCobranca } from "./actions";

type Acao = (state: ActionState, formData: FormData) => Promise<ActionState>;

const ACOES: Record<"cobranca" | "assinatura", { cancelar: Acao; sincronizar: Acao; aviso: string }> = {
  cobranca: {
    cancelar: cancelarCobranca,
    sincronizar: sincronizarCobranca,
    aviso: "A fatura deixa de ser pagável no Asaas.",
  },
  assinatura: {
    cancelar: cancelarAssinatura,
    sincronizar: sincronizarAssinatura,
    aviso: "Para de gerar cobranças e cancela as que estiverem em aberto.",
  },
};

/** Sincronizar (plano B do webhook) e cancelar em duas etapas — sem window.confirm. */
export function AcoesPagamento({ tipo, id, podeCancelar }: { tipo: "cobranca" | "assinatura"; id: string; podeCancelar: boolean }) {
  const [confirmando, setConfirmando] = useState(false);
  const a = ACOES[tipo];

  if (confirmando) {
    return (
      <ActionForm action={a.cancelar} className="flex flex-col items-stretch gap-2 sm:items-end">
        <input type="hidden" name="id" value={id} />
        <p className="max-w-xs text-xs text-red-800">{a.aviso}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setConfirmando(false)} className={buttonClass("ghost", "sm")}>
            Voltar
          </button>
          <SubmitButton variant="danger" size="sm" pendingLabel="Cancelando…">
            Confirmar cancelamento
          </SubmitButton>
        </div>
      </ActionForm>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-end gap-2">
      <ActionForm action={a.sincronizar} className="flex flex-col items-end">
        <input type="hidden" name="id" value={id} />
        <SubmitButton variant="ghost" size="sm" pendingLabel="Consultando…">
          <RefreshCw className="h-4 w-4" aria-hidden /> Sincronizar
        </SubmitButton>
      </ActionForm>
      {podeCancelar && (
        <button type="button" onClick={() => setConfirmando(true)} className={buttonClass("danger", "sm")}>
          <Ban className="h-4 w-4" aria-hidden /> Cancelar
        </button>
      )}
    </div>
  );
}
