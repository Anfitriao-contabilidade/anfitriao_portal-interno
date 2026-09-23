type Status = "rascunho" | "processando" | "autorizada" | "erro" | "cancelada";

const STYLES: Record<Status, string> = {
  rascunho: "bg-ocean/5 text-ocean border-ocean/20",
  processando: "bg-amber-50 text-amber-700 border-amber-200",
  autorizada: "bg-emerald-50 text-emerald-700 border-emerald-200",
  erro: "bg-red-50 text-red-700 border-red-200",
  cancelada: "bg-ink-soft/10 text-ink-soft border-ink-soft/20",
};

const LABELS: Record<Status, string> = {
  rascunho: "Rascunho",
  processando: "Processando",
  autorizada: "Autorizada",
  erro: "Erro",
  cancelada: "Cancelada",
};

export default function NotaFiscalBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
