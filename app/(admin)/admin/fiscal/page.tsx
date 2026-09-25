import { PageHeader } from "@/components/ui/PageHeader";
import { SimuladorFiscal } from "./SimuladorFiscal";

export const metadata = { title: "Fiscal" };

export default function FiscalPage() {
  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        title="Simulador fiscal"
        description="Pessoa física usa Carnê-Leão (DARF mensal). A estimativa não grava apuração e não substitui a obrigação oficial."
      />
      <SimuladorFiscal />
    </>
  );
}
