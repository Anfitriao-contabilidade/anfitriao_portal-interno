import type { Metadata } from "next";
import { EmBreve } from "@/components/domain/EmBreve";

export const metadata: Metadata = { title: "Contratos" };

export default function ContratosPage() {
  return (
    <EmBreve eyebrow="Documentos" title="Contratos">
      Os contratos gerados para você ficam com a equipe da Anfitrião. Peça uma cópia ao seu contador se precisar de
      algum contrato específico.
    </EmBreve>
  );
}
