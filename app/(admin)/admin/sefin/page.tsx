import type { Metadata } from "next";
import Link from "next/link";
import { CalendarSearch, Info } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, apiPagina, type Pagina } from "@/lib/api";
import { fmtDataHora, fmtDocumento } from "@/lib/format";
import type { AmbienteAtivo, ConfiguracaoNfse, HistoricoIntegracao, LimitesApi, Prestador } from "@/lib/nfse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Forbidden } from "@/components/ui/Forbidden";
import { buttonClass } from "@/components/ui/Button";
import { controlClass } from "@/components/forms/Field";
import { AmbienteCard, ConsultasCard, ValidacaoCard, type PrestadorOpcao } from "./SefinPainel";

export const metadata: Metadata = { title: "Integração SEFIN" };

const OPERACAO: Record<string, string> = {
  validacao_certificado: "Validação do certificado",
  consulta_nfse: "Consulta de NFS-e",
  consulta_dps: "Consulta de DPS",
  consulta_evento: "Consulta de evento",
  emitir: "Emissão (transmissão da DPS)",
  consultar_dps: "Recuperação por Id da DPS",
  consultar_nfse: "Consulta de NFS-e (nota)",
  registrar_evento: "Evento (cancelamento)",
  baixar_danfse: "DANFSe",
};

function tomResultado(r: string | null): "success" | "danger" | "warning" | "neutral" {
  if (!r) return "neutral";
  if (["ok", "autorizada", "encontrada", "registrado", "evento_101101", "evento_105102"].includes(r)) return "success";
  if (["falha", "rejeitada", "rejeitado", "sem_permissao", "nao_enviada", "nao_enviado"].includes(r)) return "danger";
  if (["desconhecida", "desconhecido", "indisponivel", "indeterminado", "divergente"].includes(r)) return "warning";
  return "neutral";
}

export default async function SefinPage() {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const [cfg, ambiente, prestadores, historico, limites] = await apiPagina(() =>
    Promise.all([
      api<ConfiguracaoNfse>("/nfse/configuracao"),
      api<AmbienteAtivo>("/nfse/integracao/ambiente"),
      api<Pagina<Prestador>>("/nfse/prestadores", { query: { limit: 200 } }),
      api<HistoricoIntegracao>("/nfse/integracao/historico", { query: { limit: 30 } }),
      api<LimitesApi>("/nfse/integracao/limites"),
    ])
  );
  const opcoes: PrestadorOpcao[] = prestadores.items
    .filter((p) => p.ativo)
    .map((p) => ({
      id: p.id,
      tipo: p.tipo,
      rotulo: `${p.tipo === "propria" ? "Nossa empresa" : "Cliente"} — ${p.razao_social} (${fmtDocumento(p.documento)})${p.certificado?.cadastrado ? "" : " · sem certificado"}`,
    }));
  const podeConfigurar = cfg.permissoes.includes("nfse.configurar");
  const podeProducao = cfg.permissoes.includes("nfse.producao");

  return (
    <>
      <PageHeader
        eyebrow="NFS-e Nacional"
        title="Integração SEFIN"
        description="Ambiente ativo, validação do certificado digital, consultas oficiais e histórico das requisições. O Portal nunca fala com a Sefin: tudo passa pela API, com o certificado do prestador."
        actions={
          <Link href="/admin/notas" prefetch={false} className={buttonClass("secondary")}>
            Notas fiscais
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <AmbienteCard ambiente={ambiente} podeConfigurar={podeConfigurar} podeProducao={podeProducao} />
          <ValidacaoCard prestadores={opcoes} ambienteRotulo={ambiente.rotulo} habilitado={ambiente.habilitado} />
        </div>
        <div className="space-y-6">
          <ConsultasCard prestadores={opcoes} ambienteRotulo={ambiente.rotulo} habilitado={ambiente.habilitado} />

          <Card as="section">
            <CardHeader title="Notas emitidas por período" description="Base deste sistema (todas as notas emitidas pela integração), filtrável por período, status e ambiente." />
            <form action="/admin/notas" method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input type="hidden" name="ambiente" value={ambiente.ambiente} />
              <div>
                <label htmlFor="per-de" className="mb-1.5 block text-sm font-medium text-ink">De</label>
                <input id="per-de" name="de" type="date" className={controlClass} />
              </div>
              <div>
                <label htmlFor="per-ate" className="mb-1.5 block text-sm font-medium text-ink">Até</label>
                <input id="per-ate" name="ate" type="date" className={controlClass} />
              </div>
              <div className="flex items-end">
                <button type="submit" className={buttonClass("secondary")}>
                  <CalendarSearch className="h-4 w-4" aria-hidden /> Ver notas
                </button>
              </div>
            </form>
          </Card>

          <Card as="section">
            <CardHeader title="O que a API oficial oferece" />
            <p className="mb-2 text-sm font-medium text-ink">Disponível</p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {limites.consultas_disponiveis.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <Alert tone="info" title="Não disponível (ainda)">
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {limites.indisponiveis.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </Alert>
          </Card>
        </div>
      </div>

      <Card as="section" className="mt-6 p-0 sm:p-0">
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardHeader title="Histórico de requisições e erros" description="Últimas operações da integração (sem corpo de requisição, XML, senha ou chave)." />
        </div>
        {historico.items.length === 0 ? (
          <div className="p-5 pt-0 sm:p-6 sm:pt-0">
            <EmptyState icon={<Info className="h-5 w-5" />} title="Nada registrado ainda" description="As validações, consultas e transmissões aparecem aqui." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Histórico da integração com a Sefin</caption>
              <thead className="border-y border-line bg-paper text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="px-5 py-2 font-medium">Quando</th>
                  <th scope="col" className="px-3 py-2 font-medium">Operação</th>
                  <th scope="col" className="px-3 py-2 font-medium">Ambiente</th>
                  <th scope="col" className="px-3 py-2 font-medium">Resultado</th>
                  <th scope="col" className="px-3 py-2 font-medium">HTTP</th>
                  <th scope="col" className="px-3 py-2 font-medium">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {historico.items.map((h) => (
                  <tr key={`${h.origem}-${h.id}`}>
                    <td className="whitespace-nowrap px-5 py-2 text-xs text-ink-soft">{fmtDataHora(h.criado_em)}</td>
                    <td className="px-3 py-2 text-ink">{OPERACAO[h.operacao] ?? h.operacao}</td>
                    <td className="px-3 py-2 text-xs text-ink-soft">{h.ambiente === "producao" ? "Produção" : h.ambiente === "homologacao" ? "Homologação" : "—"}</td>
                    <td className="px-3 py-2">{h.resultado ? <Badge tone={tomResultado(h.resultado)}>{h.resultado}</Badge> : "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-ink-soft">{h.http_status ?? "—"}</td>
                    <td className="max-w-md px-3 py-2 text-xs text-ink-soft">
                      <span className="line-clamp-2">{h.mensagem ?? "—"}</span>
                      {h.correlacao && <span className="block font-mono text-[.65rem] opacity-70">corr. {h.correlacao.slice(0, 12)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
