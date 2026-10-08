import type { Metadata } from "next";
import { CreditCard, ExternalLink, Repeat } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, apiPagina, apiTodos, num } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { fmtBRL } from "@/lib/metrics";
import { fmtData, hojeISO } from "@/lib/format";
import { safeExternalUrl } from "@/lib/security/url";
import type { Assinatura, Cobranca, ConfiguracaoPagamentos } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { Forbidden } from "@/components/ui/Forbidden";
import { AssinaturaStatusBadge, CobrancaStatusBadge } from "@/components/domain/badges";
import { NovaCobrancaForm } from "./NovaCobrancaForm";
import { NovaAssinaturaForm } from "./NovaAssinaturaForm";
import { AcoesPagamento } from "./Acoes";
import { FORMA_LABEL } from "./FormaPagamentoOptions";

export const metadata: Metadata = { title: "Cobranças" };

type Plano = { id: string; titulo: string; preco_atual: string };

const CICLO: Record<string, string> = { mensal: "mês", trimestral: "trimestre", semestral: "semestre", anual: "ano" };
const ABERTAS = new Set(["criando", "pendente", "vencida"]);

export default async function AdminPagamentosPage() {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;

  const [config, usuarios, planos, cobrancas, assinaturas] = await apiPagina(() =>
    Promise.all([
      api<ConfiguracaoPagamentos>("/pagamentos/configuracao"),
      listarUsuarios(),
      api<Plano[]>("/planos"),
      apiTodos<Cobranca>("/pagamentos/cobrancas", {}, 100),
      apiTodos<Assinatura>("/pagamentos/assinaturas", {}, 200),
    ])
  );

  const hoje = hojeISO();
  const nome = new Map(usuarios.map((u) => [u.id, u.nome]));
  const vigentes = new Set(assinaturas.filter((a) => a.status === "ativa" || a.status === "criando").map((a) => a.cliente_id));
  const clientes = usuarios
    .filter((u) => !u.papeis.includes("admin") && u.ativo)
    .map((u) => ({ id: u.id, nome: u.nome, temDocumento: Boolean(u.documento), temAssinatura: vigentes.has(u.id) }));

  const mes = hoje.slice(0, 7);
  const recebidoMes = cobrancas.filter((c) => c.status === "paga" && (c.pago_em ?? "").startsWith(mes)).reduce((s, c) => s + num(c.valor), 0);
  const emAberto = cobrancas.filter((c) => c.status === "pendente" || c.status === "vencida");
  const vencidas = emAberto.filter((c) => c.status === "vencida" || (c.vencimento ?? "9") < hoje);
  const mrr = assinaturas
    .filter((a) => a.status === "ativa")
    .reduce((s, a) => s + num(a.valor) / ({ mensal: 1, trimestral: 3, semestral: 6, anual: 12 }[a.ciclo] ?? 1), 0);

  return (
    <>
      <PageHeader
        eyebrow="Equipe"
        title="Cobranças"
        description="Assinaturas dos planos e cobranças avulsas pelo Asaas. O cliente paga pela fatura (Pix, boleto ou cartão) e o status volta sozinho pelo webhook."
      />

      {!config.habilitado ? (
        <Alert tone="warning" title="Pagamentos desabilitados" className="mb-6">
          Configure <code>ASAAS_API_KEY</code> na API (veja <code>docs/ASAAS.md</code>). As listas abaixo continuam visíveis.
        </Alert>
      ) : (
        <>
          {config.ambiente === "sandbox" && (
            <Alert tone="info" title="Ambiente de testes (sandbox)" className="mb-6">
              Nenhuma cobrança é real. Troque <code>ASAAS_BASE_URL</code> e a chave para produção quando validar o fluxo.
            </Alert>
          )}
          {!config.webhook_configurado && (
            <Alert tone="warning" title="Webhook sem token" className="mb-6">
              Defina <code>ASAAS_WEBHOOK_TOKEN</code> e cadastre o webhook no Asaas apontando para{" "}
              <code>{config.webhook_path}</code> — sem ele os pagamentos só atualizam com “Sincronizar”.
            </Alert>
          )}
        </>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Recebido no mês" value={fmtBRL(recebidoMes)} />
        <StatCard label="Em aberto" value={fmtBRL(emAberto.reduce((s, c) => s + num(c.valor), 0))} />
        <StatCard label="Vencidas" value={String(vencidas.length)} />
        <StatCard label="Recorrência mensal" value={fmtBRL(mrr)} />
      </div>

      {config.habilitado && (
        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <Card as="section">
            <CardHeader title="Nova assinatura de plano" description="Uma assinatura vigente por cliente." />
            <NovaAssinaturaForm
              clientes={clientes}
              planos={planos.map((p) => ({ id: p.id, titulo: p.titulo, preco: fmtBRL(num(p.preco_atual)) }))}
              hoje={hoje}
            />
          </Card>
          <Card as="section">
            <CardHeader title="Cobrança avulsa" description="Valor mínimo do Asaas: R$ 5,00." />
            <NovaCobrancaForm clientes={clientes} hoje={hoje} />
          </Card>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card as="section" className="p-0 sm:p-0">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardHeader title="Assinaturas" />
          </div>
          {assinaturas.length === 0 ? (
            <div className="p-5 pt-0 sm:p-6 sm:pt-0">
              <EmptyState icon={<Repeat className="h-5 w-5" />} title="Nenhuma assinatura ainda" />
            </div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {assinaturas.map((a) => (
                <li key={a.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {nome.get(a.cliente_id) ?? "Cliente"} <span className="font-normal text-ink-soft">· {a.plano_titulo ?? "Plano"}</span>
                      </p>
                      <p className="mt-1 font-mono text-xs text-ink-soft">
                        {fmtBRL(num(a.valor))}/{CICLO[a.ciclo] ?? a.ciclo} · {FORMA_LABEL[a.forma] ?? a.forma}
                        {a.status === "ativa" && a.proximo_vencimento ? ` · próx. ${fmtData(a.proximo_vencimento)}` : ""}
                      </p>
                      {a.erro_mensagem && <p className="mt-1 text-xs text-red-700">{a.erro_mensagem}</p>}
                    </div>
                    <AssinaturaStatusBadge status={a.status} />
                  </div>
                  {a.status !== "cancelada" && config.habilitado && (
                    <div className="mt-2">
                      <AcoesPagamento tipo="assinatura" id={a.id} podeCancelar />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" className="p-0 sm:p-0">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardHeader title="Cobranças" description="100 mais recentes por vencimento" />
          </div>
          {cobrancas.length === 0 ? (
            <div className="p-5 pt-0 sm:p-6 sm:pt-0">
              <EmptyState icon={<CreditCard className="h-5 w-5" />} title="Nenhuma cobrança ainda" />
            </div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {cobrancas.map((c) => {
                const fatura = safeExternalUrl(c.url_fatura);
                return (
                  <li key={c.id} className="px-5 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {nome.get(c.cliente_id) ?? "Cliente"}{" "}
                          <span className="font-normal text-ink-soft">· {c.origem === "assinatura" ? "Assinatura" : "Avulsa"}</span>
                        </p>
                        {c.descricao && <p className="line-clamp-2 text-sm text-ink-soft">{c.descricao}</p>}
                        <p className="mt-1 font-mono text-xs text-ink-soft">
                          {fmtBRL(num(c.valor))} · vence {fmtData(c.vencimento)}
                          {c.pago_em ? ` · pago ${fmtData(c.pago_em)}` : ""}
                          {c.valor_liquido && c.status === "paga" ? ` · líquido ${fmtBRL(num(c.valor_liquido))}` : ""}
                        </p>
                        {c.erro_mensagem && <p className="mt-1 text-xs text-red-700">{c.erro_mensagem}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <CobrancaStatusBadge status={c.status} vencimento={c.vencimento} />
                        {fatura && (
                          <a href={fatura} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-ocean hover:underline">
                            Fatura <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        )}
                      </div>
                    </div>
                    {config.habilitado && c.status !== "erro" && (ABERTAS.has(c.status) || c.status === "paga") && (
                      <div className="mt-2">
                        <AcoesPagamento tipo="cobranca" id={c.id} podeCancelar={ABERTAS.has(c.status)} />
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
