"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, Loader2, MinusCircle, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { buttonClass } from "@/components/ui/Button";
import { controlClass } from "@/components/forms/Field";
import { fmtDataHora, fmtDocumento } from "@/lib/format";
import {
  TIPOS_EVENTO,
  type AmbienteAtivo,
  type ConsultaResultado,
  type Indicador,
  type IndicadorStatus,
  type ValidacaoCertificado,
} from "@/lib/nfse";
import { alterarAmbienteSefin, consultarSefin, validarCertificadoSefin } from "./sefin-actions";

export type PrestadorOpcao = { id: string; rotulo: string; tipo: "propria" | "cliente" };

// ====================================================================================== ambiente
export function AmbienteCard({ ambiente, podeConfigurar, podeProducao }: { ambiente: AmbienteAtivo; podeConfigurar: boolean; podeProducao: boolean }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [alvo, setAlvo] = useState(ambiente.ambiente);
  const [motivo, setMotivo] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [msg, setMsg] = useState<{ tom: "success" | "danger"; texto: string } | null>(null);
  const emProducao = ambiente.ambiente === "producao";
  const indo = alvo !== ambiente.ambiente;
  const paraProducao = alvo === "producao";
  const bloqueado = !podeConfigurar || (paraProducao && !podeProducao);

  function trocar() {
    setMsg(null);
    iniciar(async () => {
      const r = await alterarAmbienteSefin({
        ambiente: alvo,
        versao_esperada: ambiente.versao,
        motivo: motivo.trim() || undefined,
        confirmacao: paraProducao ? confirmacao : undefined,
      });
      if (r.ok) {
        setMsg({ tom: "success", texto: `Ambiente ativo: ${r.dados.rotulo}. Vale já para todas as telas e requisições, sem reiniciar.` });
        setConfirmacao("");
        setMotivo("");
        router.refresh();
      } else {
        setMsg({ tom: "danger", texto: r.erro });
      }
    });
  }

  return (
    <Card as="section" className={emProducao ? "border-gold/60" : undefined}>
      <CardHeader
        title="Ambiente ativo"
        description="Define para onde vão a emissão, as consultas, a validação do certificado e a recuperação de documentos."
        action={
          <Badge tone={emProducao ? "gold" : "info"} dot>
            {ambiente.rotulo}
          </Badge>
        }
      />
      {emProducao && (
        <Alert tone="warning" title="Produção ativa" className="mb-4">
          Toda transmissão gera documento fiscal oficial. Notas criadas em homologação não são operadas aqui (e vice-versa).
        </Alert>
      )}
      {ambiente.avisos.filter((a) => !a.startsWith("AMBIENTE DE PRODUÇÃO")).map((a) => (
        <Alert key={a} tone="info" className="mb-3">
          {a}
        </Alert>
      ))}

      <dl className="mb-5 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-ink-soft">Sefin Nacional</dt>
        <dd className="break-all font-mono text-xs text-ink">{ambiente.sefin_url}</dd>
        <dt className="text-ink-soft">ADN</dt>
        <dd className="break-all font-mono text-xs text-ink">{ambiente.adn_url}</dd>
        <dt className="text-ink-soft">tpAmb</dt>
        <dd className="font-mono text-xs text-ink">
          {ambiente.tp_amb} ({emProducao ? "produção" : "homologação"})
        </dd>
        <dt className="text-ink-soft">Origem</dt>
        <dd className="text-xs text-ink">
          {ambiente.origem === "configuracao_dinamica"
            ? `Alterado na interface${ambiente.alterado_em ? ` em ${fmtDataHora(ambiente.alterado_em)}` : ""}`
            : `Variável de ambiente (padrão de boot: ${ambiente.padrao_boot})`}
        </dd>
      </dl>

      <fieldset className="grid gap-3 sm:grid-cols-2" disabled={pendente}>
        <legend className="sr-only">Escolher o ambiente</legend>
        {ambiente.disponiveis.map((a) => (
          <label
            key={a.ambiente}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${alvo === a.ambiente ? "border-ocean bg-ocean-50" : "border-line bg-white"} ${!a.disponivel ? "opacity-60" : ""}`}
          >
            <input
              type="radio"
              name="ambiente"
              value={a.ambiente}
              checked={alvo === a.ambiente}
              disabled={!a.disponivel}
              onChange={() => setAlvo(a.ambiente)}
              className="mt-1"
            />
            <span className="min-w-0">
              <span className="block font-medium text-ink">{a.rotulo}</span>
              <span className="block break-all font-mono text-[.7rem] text-ink-soft">{a.sefin_url}</span>
              {a.motivo_indisponivel && <span className="mt-1 block text-xs text-amber-800">{a.motivo_indisponivel}</span>}
            </span>
          </label>
        ))}
      </fieldset>

      {indo && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="amb-motivo" className="mb-1.5 block text-sm font-medium text-ink">
              Motivo <span className="text-xs font-normal text-ink-soft">opcional</span>
            </label>
            <input id="amb-motivo" className={controlClass} value={motivo} maxLength={200} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          {paraProducao && (
            <div>
              <label htmlFor="amb-conf" className="mb-1.5 block text-sm font-medium text-ink">
                Digite PRODUCAO para confirmar
              </label>
              <input id="amb-conf" className={controlClass} value={confirmacao} autoComplete="off" onChange={(e) => setConfirmacao(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {!podeConfigurar && <p className="mt-3 text-xs text-ink-soft">Você não tem a permissão nfse.configurar para trocar o ambiente.</p>}
      {podeConfigurar && paraProducao && !podeProducao && <p className="mt-3 text-xs text-ink-soft">Ativar a produção exige também a permissão nfse.producao.</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={trocar} disabled={!indo || bloqueado || pendente || (paraProducao && confirmacao.trim().toUpperCase() !== "PRODUCAO")} className={buttonClass(paraProducao ? "gold" : "primary")}>
          {pendente ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          {indo ? `Ativar ${alvo === "producao" ? "produção" : "homologação"}` : "Ambiente já ativo"}
        </button>
        <span className="text-xs text-ink-soft">Sem reiniciar. Operações em andamento terminam no ambiente em que começaram.</span>
      </div>
      {msg && (
        <Alert tone={msg.tom} role={msg.tom === "danger" ? "alert" : "status"} className="mt-4">
          {msg.texto}
        </Alert>
      )}
    </Card>
  );
}

// ====================================================================================== validação do certificado
const ICONE: Record<IndicadorStatus, ReactNode> = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />,
  falha: <XCircle className="h-4 w-4 text-red-600" aria-hidden />,
  aviso: <AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden />,
  nao_executado: <MinusCircle className="h-4 w-4 text-ink-soft" aria-hidden />,
};
const TEXTO_STATUS: Record<IndicadorStatus, string> = { ok: "OK", falha: "Falha", aviso: "Atenção", nao_executado: "Não executado" };
const LOCAIS = ["certificado_carregado", "senha_validada", "chave_privada", "validade", "documento", "uso_cliente"];

function Linha({ i }: { i: Indicador }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5">{ICONE[i.status]}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {i.rotulo} <span className="sr-only">— {TEXTO_STATUS[i.status]}</span>
        </p>
        <p className="text-sm text-ink-soft">{i.mensagem}</p>
        {i.detalhe && <p className="mt-0.5 break-all font-mono text-[.7rem] text-ink-soft">{i.detalhe}</p>}
      </div>
    </li>
  );
}

export function ValidacaoCard({ prestadores, ambienteRotulo, habilitado }: { prestadores: PrestadorOpcao[]; ambienteRotulo: string; habilitado: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [prestador, setPrestador] = useState(prestadores.find((p) => p.tipo === "propria")?.id ?? prestadores[0]?.id ?? "");
  const [testar, setTestar] = useState(true);
  const [res, setRes] = useState<ValidacaoCertificado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function rodar() {
    setErro(null);
    iniciar(async () => {
      const r = await validarCertificadoSefin(prestador, testar);
      if (r.ok) setRes(r.dados);
      else {
        setRes(null);
        setErro(r.erro);
      }
    });
  }

  const locais = res?.indicadores.filter((i) => LOCAIS.includes(i.chave)) ?? [];
  const remotos = res?.indicadores.filter((i) => !LOCAIS.includes(i.chave)) ?? [];

  return (
    <Card as="section">
      <CardHeader
        title="Validar certificado digital"
        description={`Verifica o A1 cadastrado e testa a comunicação real com a Sefin (${ambienteRotulo}).`}
      />
      {prestadores.length === 0 ? (
        <Alert tone="warning">Cadastre um prestador (e o certificado A1 dele) para validar.</Alert>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="val-prest" className="mb-1.5 block text-sm font-medium text-ink">
              Prestador / certificado
            </label>
            <select id="val-prest" className={controlClass} value={prestador} onChange={(e) => setPrestador(e.target.value)}>
              {prestadores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.rotulo}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-sm">
            <input type="checkbox" checked={testar} onChange={(e) => setTestar(e.target.checked)} /> Testar comunicação com a Sefin
          </label>
          <button type="button" onClick={rodar} disabled={pendente || !prestador} className={buttonClass("primary")}>
            {pendente ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />}
            {pendente ? "Validando…" : "Validar"}
          </button>
        </div>
      )}
      {!habilitado && <Alert tone="info" className="mt-4">A integração está desligada (NFSE_ENABLED=false): só a validação local é possível.</Alert>}
      {erro && (
        <Alert tone="danger" role="alert" className="mt-4">
          {erro}
        </Alert>
      )}

      {res && (
        <div className="mt-5 space-y-5" aria-live="polite">
          <Alert tone={res.local_ok && res.autenticacao_ok ? "success" : res.local_ok ? "info" : "danger"} title="Resultado">
            {res.conclusao}
          </Alert>

          <div>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
              Validação local <Badge tone={res.local_ok ? "success" : "danger"}>{res.local_ok ? "aprovada" : "reprovada"}</Badge>
            </h3>
            <p className="mb-1 text-xs text-ink-soft">Feita no nosso servidor, sem falar com a Sefin. Não prova que a Sefin aceita o certificado.</p>
            <ul className="divide-y divide-line">{locais.map((i) => <Linha key={i.chave} i={i} />)}</ul>
          </div>

          <div>
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
              Teste com a Sefin{" "}
              <Badge tone={res.autenticacao_ok ? "success" : res.autenticacao_ok === false || res.comunicacao_ok === false ? "danger" : "neutral"}>
                {res.autenticacao_ok ? "autenticação aceita" : res.comunicacao_ok === null ? "não executado" : "sem confirmação"}
              </Badge>
            </h3>
            <p className="mb-1 break-all font-mono text-[.7rem] text-ink-soft">{res.sefin_url}</p>
            <ul className="divide-y divide-line">{remotos.map((i) => <Linha key={i.chave} i={i} />)}</ul>
          </div>

          {res.certificado && (
            <dl className="grid gap-x-4 gap-y-1 rounded-xl border border-line bg-paper p-4 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="text-ink-soft">Titular</dt>
              <dd className="text-ink">{res.certificado.titular_nome ?? "—"}</dd>
              <dt className="text-ink-soft">CPF/CNPJ</dt>
              <dd className="font-mono text-xs text-ink">{fmtDocumento(res.certificado.titular_documento)}</dd>
              <dt className="text-ink-soft">Emissor</dt>
              <dd className="text-ink">{res.certificado.emissor_nome ?? "—"}</dd>
              <dt className="text-ink-soft">Validade</dt>
              <dd className="text-ink">
                {fmtDataHora(res.certificado.valido_de)} → {fmtDataHora(res.certificado.valido_ate)}
                {res.certificado.dias_para_vencer !== null && ` (${res.certificado.dias_para_vencer} dia(s))`}
              </dd>
              <dt className="text-ink-soft">Tipo / chave</dt>
              <dd className="text-ink">
                {res.certificado.tipo ?? "—"} · {res.certificado.algoritmo_chave ?? "—"}
                {res.certificado.icp_brasil ? " · ICP-Brasil" : ""}
              </dd>
            </dl>
          )}
          <p className="text-xs text-ink-soft">{res.aviso}</p>
        </div>
      )}
    </Card>
  );
}

// ====================================================================================== consultas
const RESULTADO_TOM: Record<ConsultaResultado["resultado"], "success" | "warning" | "danger" | "neutral"> = {
  encontrada: "success",
  nao_encontrada: "neutral",
  sem_permissao: "danger",
  indisponivel: "warning",
  indeterminado: "warning",
};
const RESULTADO_TEXTO: Record<ConsultaResultado["resultado"], string> = {
  encontrada: "Encontrado",
  nao_encontrada: "Não encontrado",
  sem_permissao: "Sem permissão",
  indisponivel: "Serviço indisponível",
  indeterminado: "Sem conclusão",
};

function baixarXml(nome: string, xml: string) {
  const url = URL.createObjectURL(new Blob([xml], { type: "application/xml;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ROTULOS_RESUMO: Record<string, string> = {
  numero: "Número",
  chave_acesso: "Chave de acesso",
  codigo_status: "Status (cStat)",
  data_processamento: "Processamento",
  id_dps: "Id da DPS",
  documento_prestador: "Prestador",
  tp_amb: "tpAmb",
  valor_liquido: "Valor líquido",
  valor_issqn: "ISSQN",
  base_calculo: "Base de cálculo",
  municipio_incidencia: "Município de incidência",
  codigo_evento: "Evento",
  id_pedido: "Id do pedido",
  num_seq_evento: "Nº sequencial",
};

export function ConsultasCard({ prestadores, ambienteRotulo, habilitado }: { prestadores: PrestadorOpcao[]; ambienteRotulo: string; habilitado: boolean }) {
  const [aba, setAba] = useState<"nfse" | "dps" | "evento">("nfse");
  const [pendente, iniciar] = useTransition();
  const [prestador, setPrestador] = useState(prestadores.find((p) => p.tipo === "propria")?.id ?? prestadores[0]?.id ?? "");
  const [chave, setChave] = useState("");
  const [idDps, setIdDps] = useState("");
  const [tipoEvento, setTipoEvento] = useState(101101);
  const [seq, setSeq] = useState(1);
  const [res, setRes] = useState<ConsultaResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function consultar() {
    setErro(null);
    setRes(null);
    iniciar(async () => {
      const r = await consultarSefin(aba, prestador, { chave_acesso: chave, id_dps: idDps, tipo_evento: tipoEvento, num_seq_evento: seq });
      if (r.ok) setRes(r.dados);
      else setErro(r.erro);
    });
  }

  const abas: [typeof aba, string][] = [
    ["nfse", "NFS-e por chave"],
    ["dps", "Id da DPS"],
    ["evento", "Evento"],
  ];

  return (
    <Card as="section">
      <CardHeader
        title="Consultar na Sefin Nacional"
        description={`Consulta oficial em ${ambienteRotulo} com o certificado do prestador. Só quem participou do documento pode consultá-lo.`}
      />
      <div role="tablist" aria-label="Tipo de consulta" className="mb-4 flex flex-wrap gap-2">
        {abas.map(([k, r]) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={aba === k}
            onClick={() => {
              setAba(k);
              setRes(null);
              setErro(null);
            }}
            className={buttonClass(aba === k ? "primary" : "secondary", "sm")}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="con-prest" className="mb-1.5 block text-sm font-medium text-ink">
            Prestador (certificado usado na consulta)
          </label>
          <select id="con-prest" className={controlClass} value={prestador} onChange={(e) => setPrestador(e.target.value)}>
            {prestadores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </div>
        {aba !== "dps" && (
          <div className="sm:col-span-2">
            <label htmlFor="con-chave" className="mb-1.5 block text-sm font-medium text-ink">
              Chave de acesso (50 dígitos)
            </label>
            <input id="con-chave" inputMode="numeric" className={`${controlClass} font-mono`} value={chave} onChange={(e) => setChave(e.target.value)} placeholder="Somente números" />
          </div>
        )}
        {aba === "dps" && (
          <div className="sm:col-span-2">
            <label htmlFor="con-dps" className="mb-1.5 block text-sm font-medium text-ink">
              Id da DPS
            </label>
            <input id="con-dps" className={`${controlClass} font-mono`} value={idDps} onChange={(e) => setIdDps(e.target.value)} placeholder="DPS + 42 dígitos" />
          </div>
        )}
        {aba === "evento" && (
          <>
            <div>
              <label htmlFor="con-tipo" className="mb-1.5 block text-sm font-medium text-ink">
                Tipo de evento
              </label>
              <select id="con-tipo" className={controlClass} value={tipoEvento} onChange={(e) => setTipoEvento(Number(e.target.value))}>
                {Object.entries(TIPOS_EVENTO).map(([c, r]) => (
                  <option key={c} value={c}>
                    {c} — {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="con-seq" className="mb-1.5 block text-sm font-medium text-ink">
                Nº sequencial do evento
              </label>
              <input id="con-seq" type="number" min={1} max={999} className={controlClass} value={seq} onChange={(e) => setSeq(Number(e.target.value))} />
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={consultar} disabled={pendente || !prestador || !habilitado} className={buttonClass("primary")}>
          {pendente ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          {pendente ? "Consultando a Sefin…" : "Consultar"}
        </button>
        {!habilitado && <span className="text-xs text-ink-soft">Integração desligada (NFSE_ENABLED=false).</span>}
      </div>

      {erro && (
        <Alert tone="danger" role="alert" className="mt-4">
          {erro}
        </Alert>
      )}
      {res && (
        <div className="mt-5 space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={RESULTADO_TOM[res.resultado]} dot>
              {RESULTADO_TEXTO[res.resultado]}
            </Badge>
            {res.http_status !== null && <span className="font-mono text-xs text-ink-soft">HTTP {res.http_status}</span>}
            <span className="text-xs text-ink-soft">
              {res.ambiente === "producao" ? "Produção" : "Homologação"} · {fmtDataHora(res.executado_em)}
            </span>
          </div>
          <p className="text-sm text-ink">{res.mensagem}</p>
          {res.resumo && (
            <dl className="grid gap-x-4 gap-y-1 rounded-xl border border-line bg-paper p-4 text-sm sm:grid-cols-[auto_1fr]">
              {Object.entries(res.resumo)
                .filter(([, v]) => v !== null && v !== "")
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-ink-soft">{ROTULOS_RESUMO[k] ?? k}</dt>
                    <dd className="break-all font-mono text-xs text-ink">{String(v)}</dd>
                  </div>
                ))}
            </dl>
          )}
          <div className="flex flex-wrap gap-2">
            {res.xml && (
              <button
                type="button"
                className={buttonClass("secondary", "sm")}
                onClick={() => baixarXml(`${res.operacao}-${res.chave_acesso ?? res.id}.xml`, res.xml ?? "")}
              >
                <Download className="h-4 w-4" aria-hidden /> Baixar XML
              </button>
            )}
            {res.nota_id && (
              <a className={buttonClass("ghost", "sm")} href={`/admin/notas/${res.nota_id}`}>
                Abrir a nota no sistema
              </a>
            )}
          </div>
          {res.xml && (
            <details className="rounded-xl border border-line bg-white p-3 text-xs">
              <summary className="cursor-pointer font-medium text-ink">Ver XML</summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all font-mono text-[.7rem] text-ink-soft">{res.xml}</pre>
            </details>
          )}
        </div>
      )}
    </Card>
  );
}
