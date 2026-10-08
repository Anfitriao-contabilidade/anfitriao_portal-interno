import { Badge } from "@/components/ui/Badge";
import { hojeISO } from "@/lib/format";

export type StatusFiscal = "regular" | "em_verificacao" | "pendencia";

export function StatusFiscalBadge({ status }: { status: StatusFiscal | string | null | undefined }) {
  switch (status) {
    case "pendencia":
      return <Badge tone="danger" dot>Pendência fiscal</Badge>;
    case "em_verificacao":
      return <Badge tone="warning" dot>Em verificação</Badge>;
    default:
      return <Badge tone="success" dot>Regular</Badge>;
  }
}

export type StatusNota = "rascunho" | "processando" | "autorizada" | "erro" | "cancelada";

export function NotaStatusBadge({ status }: { status: StatusNota | string }) {
  switch (status) {
    case "autorizada":
      return <Badge tone="success" dot>Autorizada</Badge>;
    case "processando":
      return <Badge tone="warning" dot>Processando</Badge>;
    case "erro":
      return <Badge tone="danger" dot>Erro</Badge>;
    case "cancelada":
      return <Badge tone="neutral">Cancelada</Badge>;
    default:
      return <Badge tone="info">Rascunho</Badge>;
  }
}

/** Situação de uma obrigação fiscal considerando o vencimento (fuso de São Paulo). */
export function situacaoObrigacao(vencimento: string, status: string) {
  if (status === "pago") return { tone: "success" as const, label: "Pago", ordem: 3 };
  const hoje = hojeISO();
  if (vencimento < hoje) return { tone: "danger" as const, label: "Atrasada", ordem: 0 };
  const dias = Math.round((Date.parse(`${vencimento}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86400000);
  if (dias === 0) return { tone: "warning" as const, label: "Vence hoje", ordem: 1 };
  if (dias <= 7) return { tone: "warning" as const, label: `Vence em ${dias}d`, ordem: 1 };
  return { tone: "info" as const, label: "Pendente", ordem: 2 };
}

export function ObrigacaoBadge({ vencimento, status }: { vencimento: string; status: string }) {
  const s = situacaoObrigacao(vencimento, status);
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function NotaChecklistBadge({ nota, avaliado }: { nota: number; avaliado: boolean }) {
  if (!avaliado) return <Badge tone="neutral">Sem avaliação</Badge>;
  const tone = nota >= 8 ? "success" : nota >= 5 ? "warning" : "danger";
  return <Badge tone={tone}>Nota {nota.toFixed(1).replace(".", ",")}</Badge>;
}

export function CobrancaStatusBadge({ status, vencimento }: { status: string; vencimento?: string | null }) {
  switch (status) {
    case "paga":
      return <Badge tone="success" dot>Paga</Badge>;
    case "pendente":
      if (vencimento && vencimento < hojeISO()) return <Badge tone="danger" dot>Vencida</Badge>;
      return <Badge tone="warning" dot>A pagar</Badge>;
    case "vencida":
      return <Badge tone="danger" dot>Vencida</Badge>;
    case "estornada":
      return <Badge tone="neutral">Estornada</Badge>;
    case "contestada":
      return <Badge tone="danger">Contestada</Badge>;
    case "cancelada":
      return <Badge tone="neutral">Cancelada</Badge>;
    case "erro":
      return <Badge tone="danger">Erro</Badge>;
    default:
      return <Badge tone="info">Gerando…</Badge>;
  }
}

export function AssinaturaStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ativa":
      return <Badge tone="success" dot>Ativa</Badge>;
    case "inativa":
      return <Badge tone="warning">Inativa</Badge>;
    case "cancelada":
      return <Badge tone="neutral">Cancelada</Badge>;
    case "erro":
      return <Badge tone="danger">Erro</Badge>;
    default:
      return <Badge tone="info">Gerando…</Badge>;
  }
}
