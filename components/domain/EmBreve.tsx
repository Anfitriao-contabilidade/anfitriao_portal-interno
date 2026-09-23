import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

// Telas honestas: o recurso existe só no Painel Interno da equipe e ainda não
// foi trazido ao portal — não fingimos ter dados.
export function EmBreve({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} />
      <EmptyState icon={<Clock className="h-5 w-5" />} title="Ainda não disponível no Portal do Cliente" description={children} />
    </>
  );
}
