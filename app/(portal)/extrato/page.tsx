import type { Metadata } from "next";
import { EmBreve } from "@/components/domain/EmBreve";

export const metadata: Metadata = { title: "Extrato (IA)" };

export default function ExtratoPage() {
  return (
    <EmBreve eyebrow="Documentos" title="Extrato (IA)">
      A classificação automática de extrato bancário por IA é um recurso interno da equipe e ainda não foi trazida
      para o portal.
    </EmBreve>
  );
}
