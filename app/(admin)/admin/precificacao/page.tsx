import { PageHeader } from "@/components/ui/PageHeader";
import { PrecificacaoPainel } from "./PrecificacaoPainel";

export const metadata = { title: "Precificação" };

export default function PrecificacaoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operação & financeiro"
        title="Precificação — custo mínimo da diária"
        description="Simulação manual. Não grava o imóvel nem substitui o preço publicado na plataforma."
      />
      <PrecificacaoPainel />
    </>
  );
}
