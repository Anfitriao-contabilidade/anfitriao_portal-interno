import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Pencil } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, ApiError, apiPagina, num } from "@/lib/api";
import { fmtBRL } from "@/lib/metrics";
import { listarUsuarios } from "@/lib/data";
import { fmtData, fmtDataHora, fmtDocumento } from "@/lib/format";
import { AMBIENTE_LABEL, EDITAVEIS, STATUS_LABEL, type ConfiguracaoNfse, type HistoricoNfse, type NotaNfse } from "@/lib/nfse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Forbidden } from "@/components/ui/Forbidden";
import { NotaStatusBadge } from "@/components/domain/badges";
import { CancelarForm, ConsultarButton, DanfseLinks, DescartarButton, EnviarEmailForm, LinkDocumento, SubstituirForm } from "./AcoesNota";

export const metadata: Metadata = { title: "NFS-e" };

const OPERACAO: Record<string, string> = {
  emitir: "Transmissão da DPS",
  consultar_dps: "Consulta por Id da DPS",
  consultar_nfse: "Consulta da NFS-e",
  cancelar: "Pedido de cancelamento",
  baixar_danfse: "Download do DANFSe",
};

function Linha({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/70 py-1.5 text-sm last:border-0">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-ink">{v || "—"}</dd>
    </div>
  );
}

export default async function NotaNfsePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();

  let nota: NotaNfse;
  let historico: HistoricoNfse;
  let cfg: ConfiguracaoNfse;
  try {
    [nota, historico, cfg] = await apiPagina(() =>
      Promise.all([
        api<NotaNfse>(`/nfse/notas/${id}`),
        api<HistoricoNfse>(`/nfse/notas/${id}/historico`),
        api<ConfiguracaoNfse>("/nfse/configuracao"),
      ])
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const nomes = new Map((await listarUsuarios()).map((u) => [u.id, u.nome]));
  const nome = (uid: string | null | undefined) => (uid ? nomes.get(uid) ?? uid : "—");
  const p = cfg.permissoes;
  const mesmoAmbiente = nota.ambiente === cfg.ambiente;
  const producao = nota.ambiente === "producao";
  const editavel = EDITAVEIS.includes(nota.status);
  const consultavel = ["processando", "situacao_desconhecida", "falha_comunicacao", "autorizada"].includes(nota.status);
  const prest = nota.prestador ?? {};
  const tom = nota.tomador ?? {};

  return (
    <>
      <Link href="/admin/notas" prefetch={false} className="mb-3 inline-flex items-center gap-1 text-sm text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Notas fiscais
      </Link>
      <PageHeader
        eyebrow={`NFS-e Nacional · ${nota.ambiente ? AMBIENTE_LABEL[nota.ambiente] : ""}`}
        title={nota.nfse?.numero ? `NFS-e nº ${nota.nfse.numero}` : STATUS_LABEL[nota.status] ?? "Nota"}
        description={nota.descricao_servico || undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NotaStatusBadge status={nota.status} />
            {editavel && p.includes("nfse.emitir") && (
              <ButtonLink href={`/admin/notas/emitir?id=${nota.id}`} variant="secondary" prefetch={false}>
                <Pencil className="h-4 w-4" aria-hidden /> Continuar edição
              </ButtonLink>
            )}
          </div>
        }
      />

      <div className="mb-6 grid gap-3">
        {!mesmoAmbiente && (
          <Alert tone="warning" title="Nota de outro ambiente">
            Esta nota é de {AMBIENTE_LABEL[nota.ambiente ?? ""] ?? nota.ambiente}; a API está em {AMBIENTE_LABEL[cfg.ambiente]}. Operações oficiais ficam bloqueadas.
          </Alert>
        )}
        {nota.status === "situacao_desconhecida" && (
          <Alert tone="warning" title="Situação desconhecida — não reenvie">
            A DPS pode ter sido processada. Use “Consultar situação”: o sistema busca pelo Id da DPS ({nota.dps?.id}) e só libera nova transmissão se
            a Sefin confirmar que ela não existe. {nota.erro_mensagem}
          </Alert>
        )}
        {nota.status === "falha_comunicacao" && (
          <Alert tone="info" title="Falha de comunicação">
            {nota.erro_mensagem ?? "A DPS não foi processada."} A retransmissão usa o mesmo Id de DPS — não gera nota em duplicidade.{" "}
            <Link href={`/admin/notas/emitir?id=${nota.id}`} className="font-medium underline">
              Revisar e retransmitir
            </Link>
          </Alert>
        )}
        {nota.status === "rejeitada" && nota.rejeicoes.length > 0 && (
          <Alert tone="danger" title="Rejeitada pela Sefin Nacional">
            <ul className="list-disc pl-4">
              {nota.rejeicoes.map((r, i) => (
                <li key={i}>
                  {r.codigo && <span className="font-mono">{r.codigo}</span>} {r.descricao}
                  {r.complemento ? ` — ${r.complemento}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-1">Corrija os dados (a nota volta a rascunho mantendo o mesmo Id de DPS) e transmita de novo.</p>
          </Alert>
        )}
        {nota.alertas.length > 0 && (
          <Alert tone="info" title="Alertas da Sefin">
            {nota.alertas.map((a) => `${a.codigo ?? ""} ${a.descricao}`).join(" · ")}
          </Alert>
        )}
        {nota.cancelamento?.situacao && nota.status === "autorizada" && (
          <Alert tone={nota.cancelamento.situacao === "rejeitado" ? "danger" : "warning"} title={`Cancelamento: ${nota.cancelamento.situacao.replace(/_/g, " ")}`}>
            {nota.cancelamento.situacao === "desconhecido" ? "Pedido enviado sem confirmação — consulte a situação antes de repetir." : null}
            {(nota.cancelamento.mensagens ?? []).map((m) => `${m.codigo ?? ""} ${m.descricao}`).join(" · ")}
          </Alert>
        )}
        {nota.substituicao?.chave_substituida && (
          <Alert tone="info" title="Nota substituta">
            Substitui a NFS-e de chave <span className="font-mono text-xs">{nota.substituicao.chave_substituida}</span>
            {nota.substituicao.nota_id && (
              <>
                {" "}
                (
                <Link href={`/admin/notas/${nota.substituicao.nota_id}`} className="underline">
                  ver original
                </Link>
                )
              </>
            )}
            .
          </Alert>
        )}
        {nota.substituida_por && (
          <Alert tone="info" title={nota.status === "substituida" ? "Substituída" : "Substituição em andamento"}>
            <Link href={`/admin/notas/${nota.substituida_por}`} className="underline">
              Ver nota substituta
            </Link>
            {nota.status !== "substituida" && " — a mudança de situação desta nota só ocorre após confirmação do evento oficial (consulte a situação)."}
          </Alert>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <Card as="section">
            <CardHeader title="Documento" />
            <div className="grid gap-6 md:grid-cols-2">
              <dl>
                <Linha k="Prestador" v={`${String(prest.razao_social ?? "")} ${prest.documento ? `— ${fmtDocumento(String(prest.documento))}` : ""}`} />
                <Linha k="Tipo de emissão" v={nota.fluxo === "propria" ? "Nossa empresa → cliente" : "Em nome do cliente"} />
                <Linha k="Conta (cliente da plataforma)" v={nome(nota.conta_uid ?? nota.cliente_id)} />
                <Linha k="Tomador" v={`${String(tom.nome ?? "")} ${tom.documento ? `— ${fmtDocumento(String(tom.documento))}` : ""}`} />
                <Linha k="Competência" v={fmtData(nota.data_competencia)} />
                <Linha k="Data da prestação" v={fmtData(nota.data_prestacao)} />
                <Linha k="Emissão (dhEmi)" v={fmtDataHora(nota.dps?.dh_emi)} />
              </dl>
              <dl>
                <Linha k="Valor do serviço" v={nota.valor ? fmtBRL(num(nota.valor)) : "—"} />
                <Linha k="Base (oficial)" v={nota.nfse?.base_calculo ? fmtBRL(num(nota.nfse.base_calculo)) : nota.calculo?.base_calculo ? `${fmtBRL(num(nota.calculo.base_calculo))} (estimada)` : "—"} />
                <Linha k="ISSQN (oficial)" v={nota.nfse?.valor_issqn ? fmtBRL(num(nota.nfse.valor_issqn)) : "—"} />
                <Linha k="Valor líquido (oficial)" v={nota.nfse?.valor_liquido ? fmtBRL(num(nota.nfse.valor_liquido)) : "—"} />
                <Linha k="Id da DPS" v={<span className="font-mono text-xs">{nota.dps?.id}</span>} />
                <Linha k="Chave de acesso" v={<span className="font-mono text-xs">{nota.nfse?.chave_acesso ?? nota.nfse?.chave_informada}</span>} />
                <Linha k="Processada em" v={fmtDataHora(nota.nfse?.data_processamento)} />
              </dl>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {nota.nfse?.xml_disponivel && <LinkDocumento id={nota.id} tipo="xml" rotulo="XML da NFS-e" />}
              {nota.nfse?.chave_acesso && <DanfseLinks id={nota.id} />}
              {nota.dps?.hash_assinada && <LinkDocumento id={nota.id} tipo="dps" rotulo="DPS assinada" />}
              {nota.status === "cancelada" && <LinkDocumento id={nota.id} tipo="evento" rotulo="Evento de cancelamento" />}
            </div>
          </Card>

          {nota.status === "autorizada" && nota.nfse?.chave_acesso && (
            <Card as="section">
              <CardHeader
                title="Enviar por e-mail"
                description={
                  cfg.email_automatico
                    ? "Envio automático ligado: ao autorizar, o DANFSe oficial e o XML vão para o e-mail do tomador."
                    : "Envia o DANFSe oficial (PDF) e o XML da NFS-e."
                }
              />
              {!cfg.email_habilitado ? (
                <Alert tone="info" title="E-mail não configurado">
                  Configure o SMTP na API (SMTP_HOST, SMTP_USER, SMTP_PASSWORD…) para habilitar o envio.
                </Alert>
              ) : !p.includes("nfse.emitir") ? (
                <p className="text-sm text-ink-soft">Você não tem permissão para enviar notas por e-mail.</p>
              ) : (
                <EnviarEmailForm id={nota.id} emailTomador={typeof tom.email === "string" ? tom.email : undefined} />
              )}
              {(nota.emails ?? []).length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
                  {[...(nota.emails ?? [])].reverse().map((m, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 break-words text-ink">{m.para.join(", ")}</span>
                      <span className="flex items-center gap-2 text-xs text-ink-soft">
                        {fmtDataHora(m.enviado_em)} · {m.automatico ? "automático" : nome(m.enviado_por)}
                        <Badge tone={m.status === "enviado" ? "success" : "danger"}>{m.status === "enviado" ? "enviado" : "falhou"}</Badge>
                      </span>
                      {m.erro && <p className="w-full text-xs text-ink-soft">{m.erro}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card as="section">
            <CardHeader title="Histórico" description="Tentativas de comunicação, eventos e auditoria (sem dados sensíveis)." />
            {historico.tentativas.length === 0 && historico.auditoria.length === 0 ? (
              <p className="text-sm text-ink-soft">Sem registros.</p>
            ) : (
              <ol className="space-y-3">
                {historico.tentativas.map((t) => (
                  <li key={t.id} className="rounded-lg border border-line p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">{OPERACAO[t.operacao] ?? t.operacao}</span>
                      <Badge tone={t.resultado.startsWith("autoriz") || t.resultado === "encontrada" || t.resultado === "registrado" ? "success" : t.resultado.includes("rejeit") ? "danger" : "warning"}>
                        {t.resultado.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink-soft">
                      {fmtDataHora(t.criado_em)} · {nome(t.operador_uid)}
                      {t.http_status ? ` · HTTP ${t.http_status}` : ""}
                      {t.duracao_ms !== null ? ` · ${t.duracao_ms} ms` : ""}
                      {t.erro_transporte ? ` · ${t.erro_transporte}` : ""}
                      {t.correlacao ? ` · corr. ${t.correlacao.slice(0, 12)}` : ""}
                    </p>
                    {t.detalhe && <p className="mt-1 text-xs text-ink-soft">{t.detalhe}</p>}
                    {t.mensagens.map((m, i) => (
                      <p key={i} className="mt-1 text-xs text-danger">
                        {m.codigo} {m.descricao}
                      </p>
                    ))}
                  </li>
                ))}
                {historico.auditoria.map((a, i) => (
                  <li key={`a${i}`} className="text-xs text-ink-soft">
                    <span className="font-mono">{fmtDataHora(a.criado_em)}</span> · {a.acao} · {nome(a.ator_id)}
                    {a.request_id ? <span className="font-mono"> · req {a.request_id.slice(0, 8)}</span> : null}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card as="section">
            <CardHeader title="Ações" />
            <div className="flex flex-col gap-3">
              {consultavel && mesmoAmbiente && <ConsultarButton id={nota.id} />}
              {editavel && p.includes("nfse.emitir") && <DescartarButton id={nota.id} />}
              {!consultavel && !editavel && <p className="text-sm text-ink-soft">Nenhuma ação disponível nesta situação.</p>}
            </div>
          </Card>
          {nota.status === "autorizada" && mesmoAmbiente && p.includes("nfse.cancelar") && (producao ? p.includes("nfse.producao") : true) && (
            <>
              <Card as="section">
                <CardHeader title="Cancelar NFS-e" description="Evento oficial e101101. O status só muda após a confirmação da Sefin." />
                {nota.cancelamento?.situacao === "desconhecido" ? (
                  <p className="flex items-center gap-2 text-sm text-gold-dark">
                    <AlertTriangle className="h-4 w-4" aria-hidden /> Consulte a situação antes de repetir o pedido.
                  </p>
                ) : (
                  <CancelarForm id={nota.id} producao={producao} motivos={cfg.opcoes.motivo_cancelamento ?? {}} />
                )}
              </Card>
              {!nota.substituida_por && p.includes("nfse.emitir") && (
                <Card as="section">
                  <CardHeader title="Substituir NFS-e" description="Cria um rascunho com o grupo de substituição. A original é cancelada pelo Sistema Nacional quando a substituta é autorizada." />
                  <SubstituirForm id={nota.id} motivos={cfg.opcoes.motivo_substituicao ?? {}} />
                </Card>
              )}
            </>
          )}
          <Card as="section">
            <CardHeader title="Responsáveis" />
            <dl>
              <Linha k="Criada por" v={nome(nota.solicitado_por)} />
              <Linha k="Transmitida por" v={nome(nota.transmitido_por)} />
              <Linha k="Criada em" v={fmtDataHora(nota.criado_em)} />
              <Linha k="Atualizada em" v={fmtDataHora(nota.atualizado_em)} />
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
