import type { Metadata } from "next";
import { ExternalLink, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { apiPagina, apiTodos, num } from "@/lib/api";
import type { NotaFiscal } from "@/lib/tipos";
import { fmtBRL } from "@/lib/metrics";
import { fmtData } from "@/lib/format";
import { safeExternalUrl } from "@/lib/security/url";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotaStatusBadge } from "@/components/domain/badges";

export const metadata: Metadata = { title: "Notas fiscais" };

const TIPO: Record<string, string> = {
  hospede: "Nota para hóspede",
  proprietario: "Honorários da Anfitrião",
  comissao: "Comissão de Co-Anfitrião",
};

export default async function NotasPage() {
  const sessao = await requireUser();
  const notas = await apiPagina(() => apiTodos<NotaFiscal>("/notas-fiscais", { cliente_id: sessao.id }, 200));

  return (
    <>
      <PageHeader
        eyebrow="Documentos"
        title="Notas fiscais"
        description="Notas emitidas pela equipe a partir do seu cadastro: para hóspedes, honorários da Anfitrião e, se você é Co-Anfitrião, o rascunho da nota de comissão."
      />
      {notas.length === 0 ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="Nenhuma nota fiscal emitida ainda" />
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {notas.map((n) => {
              const pdf = safeExternalUrl(n.url_pdf);
              return (
                <li key={n.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {TIPO[n.tipo] ?? n.tipo}
                      {n.competencia ? <span className="font-normal text-ink-soft"> · {n.competencia}</span> : null}
                    </p>
                    <p className="text-sm text-ink-soft">{n.descricao_servico}</p>
                    <p className="mt-1 font-mono text-xs text-ink-soft">
                      {fmtData(n.criado_em)}
                      {n.numero ? ` · nº ${n.numero}` : ""}
                    </p>
                    {n.status === "erro" && (
                      <p className="mt-1 text-xs text-red-700">Houve um problema na emissão. A equipe já está verificando.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="font-mono text-sm font-medium tabular-nums">{fmtBRL(num(n.valor))}</span>
                    <NotaStatusBadge status={n.status} />
                    {pdf && (
                      <a href={pdf} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-ocean hover:bg-ocean-50">
                        PDF <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">(abre em nova aba)</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
