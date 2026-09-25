import type { Metadata } from "next";
import { ExternalLink, FileText } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { apiPagina, apiTodos, num } from "@/lib/api";
import { listarImoveis, listarUsuarios } from "@/lib/data";
import { fmtBRL } from "@/lib/metrics";
import type { NotaFiscal } from "@/lib/tipos";
import { fmtData } from "@/lib/format";
import { safeExternalUrl } from "@/lib/security/url";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Forbidden } from "@/components/ui/Forbidden";
import { NotaStatusBadge } from "@/components/domain/badges";
import { EmitirNotaForm } from "./EmitirNotaForm";
import { ReconsultarButton } from "./ReconsultarButton";

export const metadata: Metadata = { title: "Emitir notas" };

const TIPO: Record<string, string> = { hospede: "Hóspede", proprietario: "Honorários", comissao: "Comissão" };


export default async function AdminNotasPage() {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;

  const [usuarios, imoveisApi, lista] = await apiPagina(() =>
    Promise.all([listarUsuarios(), listarImoveis(), apiTodos<NotaFiscal>("/notas-fiscais", {}, 50)])
  );
  const clientes = usuarios.filter((u) => !u.papeis.includes("admin") && u.ativo).map((u) => ({ id: u.id, nome: u.nome }));
  const nomeCliente = new Map(usuarios.map((u) => [u.id, u.nome]));
  const imoveis = imoveisApi.map((im) => ({
    id: im.id,
    nome: im.nome,
    donos: [im.proprietario_id, ...im.coanfitriao_ids].filter(Boolean) as string[],
  }));

  return (
    <>
      <PageHeader
        eyebrow="Equipe"
        title="Notas fiscais"
        description="Emissão de NFS-e via Focus NFe, feita pela Anfitrião API (FOCUSNFE_TOKEN configurado na API)."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card as="section">
          <CardHeader title="Emitir nota fiscal" />
          <EmitirNotaForm clientes={clientes} imoveis={imoveis} />
        </Card>

        <Card as="section" className="p-0 sm:p-0">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardHeader title="Últimas notas" description="50 mais recentes" />
          </div>
          {lista.length === 0 ? (
            <div className="p-5 pt-0 sm:p-6 sm:pt-0">
              <EmptyState icon={<FileText className="h-5 w-5" />} title="Nenhuma nota emitida ainda" />
            </div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {lista.map((n) => {
                const pdf = safeExternalUrl(n.url_pdf);
                return (
                  <li key={n.id} className="px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {nomeCliente.get(n.cliente_id) ?? "Cliente"} <span className="font-normal text-ink-soft">· {TIPO[n.tipo] ?? n.tipo}</span>
                        </p>
                        <p className="line-clamp-2 text-sm text-ink-soft">{n.descricao_servico}</p>
                        <p className="mt-1 font-mono text-xs text-ink-soft">
                          {fmtBRL(num(n.valor))} · {fmtData(n.criado_em)}
                          {n.numero ? ` · nº ${n.numero}` : ""}
                        </p>
                        {n.status === "erro" && n.erro_mensagem && <p className="mt-1 text-xs text-red-700">{n.erro_mensagem}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <NotaStatusBadge status={n.status} />
                        {pdf && (
                          <a href={pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-ocean hover:underline">
                            PDF <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        )}
                      </div>
                    </div>
                    {n.status === "processando" && (
                      <div className="mt-2">
                        <ReconsultarButton id={n.id} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
