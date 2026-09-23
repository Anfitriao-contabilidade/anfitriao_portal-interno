type Status = "regular" | "em_verificacao" | "pendencia";

const STYLES: Record<Status, string> = {
  regular: "bg-emerald-50 text-emerald-700 border-emerald-200",
  em_verificacao: "bg-amber-50 text-amber-700 border-amber-200",
  pendencia: "bg-red-50 text-red-700 border-red-200",
};

const LABELS: Record<Status, string> = {
  regular: "Regular",
  em_verificacao: "Em verificação",
  pendencia: "Pendência fiscal",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
