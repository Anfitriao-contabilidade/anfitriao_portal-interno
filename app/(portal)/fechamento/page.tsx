import type { Metadata } from "next";
import { EmBreve } from "@/components/domain/EmBreve";

export const metadata: Metadata = { title: "Fechamento mensal" };

export default function FechamentoPage() {
  return (
    <EmBreve eyebrow="Operação & financeiro" title="Fechamento mensal">
      O checklist de fechamento (documentos entregues, pendências, confirmação do mês) existe hoje só no Painel
      Interno. Fale com o seu contador se precisar do status do fechamento.
    </EmBreve>
  );
}
