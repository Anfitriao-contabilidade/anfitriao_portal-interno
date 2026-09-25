import { PageHeader } from "@/components/ui/PageHeader";
import { CarneLeaoPainel } from "./CarneLeaoPainel";

export const metadata = { title: "Pessoa Física — Carnê-Leão" };

export default function CarneLeaoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Fiscal"
        title="Pessoa Física — Carnê-Leão"
        description="Demonstrativo mensal do imposto da pessoa física. O valor é estimado e não grava a obrigação."
      />
      <CarneLeaoPainel />
    </>
  );
}
