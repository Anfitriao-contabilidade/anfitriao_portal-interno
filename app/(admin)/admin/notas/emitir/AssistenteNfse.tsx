"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Loader2, Plus, Save, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { erroDocumento, mascaraDocumento, soDigitos } from "@/lib/documentos";
import { fmtData, fmtDataHora, fmtDocumento, hojeISO } from "@/lib/format";
import {
  AMBIENTE_LABEL,
  centavos,
  ETAPAS,
  estimar,
  fmtCentavos,
  normalizarValor,
  type ConfiguracaoNfse,
  type NotaNfse,
  type Pendencia,
  type Prestador,
  type Previa,
  type ServicoNfse,
  type Tomador,
  type ValoresNfse,
} from "@/lib/nfse";
import { controlClass } from "@/components/forms/Field";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { buttonClass } from "@/components/ui/Button";
import { criarTomadorNfse, listarTomadoresNfse, prepararNfse, salvarRascunhoNfse, transmitirNfse } from "../nfse-actions";

type Cliente = { id: string; nome: string; documento: string | null; email: string };
type Etapa = (typeof ETAPAS)[number]["chave"];

type Form = {
  fluxo: "propria" | "cliente";
  prestador_id: string;
  data_prestacao: string;
  data_competencia: string;
  tomador_id: string;
  intermediario_id: string;
  servico: ServicoNfse;
  valores: ValoresNfse;
  observacoes: string;
};

const MONETARIOS = [
  "valor_servico",
  "valor_recebido",
  "desconto_incondicionado",
  "desconto_condicionado",
  "deducao_valor",
  "aliquota_issqn",
  "retencao_cp",
  "retencao_irrf",
  "retencao_csll",
] as const;

function novoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}abcdef`;
}

function inicial(nota: NotaNfse | null, prestadores: Prestador[]): Form {
  const prest = prestadores.find((p) => p.id === nota?.prestador_id);
  const v = { ...(nota?.valores ?? {}) } as ValoresNfse;
  return {
    fluxo: (nota?.fluxo ?? prest?.tipo ?? "propria") as Form["fluxo"],
    prestador_id: nota?.prestador_id ?? "",
    // Nota nova: hoje (fuso de São Paulo); editável pelo calendário. Rascunho salvo mantém as datas dele.
    data_prestacao: nota?.data_prestacao?.slice(0, 10) || hojeISO(),
    data_competencia: nota?.data_competencia?.slice(0, 10) || hojeISO(),
    tomador_id: nota?.tomador_id ?? "",
    intermediario_id: nota?.intermediario_id ?? "",
    servico: { ...(nota?.servico ?? {}) },
    valores: { tributacao_issqn: "1", tipo_retencao_issqn: "1", ...v },
    observacoes: nota?.observacoes ?? "",
  };
}

function payload(f: Form, criando: boolean, chave: string) {
  const valores: Record<string, unknown> = { ...f.valores };
  for (const k of MONETARIOS) valores[k] = normalizarValor(f.valores[k] ?? null);
  const tt = f.valores.total_tributos;
  valores.total_tributos = tt?.modo
    ? {
        modo: tt.modo,
        percentual_sn: normalizarValor(tt.percentual_sn ?? null),
        federal: normalizarValor(tt.federal ?? null),
        estadual: normalizarValor(tt.estadual ?? null),
        municipal: normalizarValor(tt.municipal ?? null),
      }
    : null;
  return {
    ...(criando ? { prestador_id: f.prestador_id, chave_idempotencia: chave } : {}),
    tomador_id: f.tomador_id || null,
    intermediario_id: f.intermediario_id || null,
    data_prestacao: f.data_prestacao || null,
    data_competencia: f.data_competencia || null,
    servico: f.servico,
    valores,
    observacoes: f.observacoes || null,
  };
}

// ----------------------------------------------------------------------------- campos
function Campo({
  label,
  erro,
  hint,
  className,
  children,
  obrigatorio,
}: {
  label: string;
  erro?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
  obrigatorio?: boolean;
}) {
  return (
    <label className={cn("block min-w-0 text-sm", className)}>
      <span className="mb-1.5 block font-medium text-ink">
        {label}
        {obrigatorio && <span className="text-red-700" aria-hidden> *</span>}
      </span>
      {children}
      {erro ? <span className="mt-1 block text-xs font-medium text-red-700">{erro}</span> : hint ? <span className="mt-1 block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

function Opcoes({ mapa, vazio }: { mapa: Record<string, string> | undefined; vazio?: string }) {
  return (
    <>
      {vazio !== undefined && <option value="">{vazio}</option>}
      {Object.entries(mapa ?? {}).map(([v, l]) => (
        <option key={v} value={v}>
          {v} — {l}
        </option>
      ))}
    </>
  );
}

function Linha({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/70 py-1.5 text-sm last:border-0">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="text-right font-medium text-ink">{v || "—"}</dd>
    </div>
  );
}

// ----------------------------------------------------------------------------- assistente
export function AssistenteNfse({
  cfg,
  prestadores,
  clientes,
  notaInicial,
  tomadoresIniciais,
}: {
  cfg: ConfiguracaoNfse;
  prestadores: Prestador[];
  clientes: Cliente[];
  notaInicial: NotaNfse | null;
  tomadoresIniciais: Tomador[];
}) {
  const router = useRouter();
  const [nota, setNota] = useState<NotaNfse | null>(notaInicial);
  const [form, setForm] = useState<Form>(() => inicial(notaInicial, prestadores));
  const [etapa, setEtapa] = useState<Etapa>("operacao");
  const [tomadores, setTomadores] = useState<Tomador[]>(tomadoresIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [confirmadoProducao, setConfirmadoProducao] = useState(false);
  const [pendente, iniciar] = useTransition();
  const [chave] = useState(novoId);
  const op = cfg.opcoes;

  const prestador = prestadores.find((p) => p.id === form.prestador_id) ?? null;
  const producao = cfg.ambiente === "producao";
  const pendencias: Pendencia[] = useMemo(() => nota?.pendencias ?? [], [nota]);
  const porEtapa = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of pendencias) m[p.etapa] = (m[p.etapa] ?? 0) + 1;
    return m;
  }, [pendencias]);
  const erroDe = (campo: string) => campos[campo] ?? pendencias.find((p) => p.campo === campo)?.mensagem;
  const est = estimar(form.valores);

  useEffect(() => {
    if (!form.prestador_id || nota) return;
    let vivo = true;
    listarTomadoresNfse(form.prestador_id).then((r) => {
      if (vivo && r.ok) setTomadores(r.dados);
    });
    return () => {
      vivo = false;
    };
  }, [form.prestador_id, nota]);

  function mudar<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setPrevia(null);
    setConfirmado(false);
  }
  const mudarServ = (k: keyof ServicoNfse, v: string) => mudar("servico", { ...form.servico, [k]: v });
  const mudarVal = (k: keyof ValoresNfse, v: unknown) => mudar("valores", { ...form.valores, [k]: v });
  const mudarTot = (k: string, v: string) =>
    mudar("valores", { ...form.valores, total_tributos: { modo: "nao_informar", ...(form.valores.total_tributos ?? {}), [k]: v } as ValoresNfse["total_tributos"] });

  async function salvar(): Promise<NotaNfse | null> {
    setErro(null);
    setAviso(null);
    if (!form.prestador_id) {
      setErro("Selecione o prestador para salvar o rascunho.");
      setEtapa("operacao");
      return null;
    }
    const r = await salvarRascunhoNfse(nota?.id ?? null, payload(form, !nota, chave));
    if (!r.ok) {
      setErro(r.erro);
      setCampos(r.campos ?? {});
      return null;
    }
    setCampos({});
    setNota(r.dados);
    if (!nota) router.replace(`/admin/notas/emitir?id=${r.dados.id}`, { scroll: false });
    return r.dados;
  }

  function irPara(alvo: Etapa) {
    iniciar(async () => {
      if (form.prestador_id) {
        const salvo = await salvar();
        if (!salvo) return;
      }
      setEtapa(alvo);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function salvarAgora() {
    iniciar(async () => {
      if (await salvar()) setAviso("Rascunho salvo.");
    });
  }

  function gerarPrevia() {
    iniciar(async () => {
      const salvo = await salvar();
      if (!salvo) return;
      const r = await prepararNfse(salvo.id);
      if (!r.ok) {
        setErro(r.erro);
        setPrevia(null);
        return;
      }
      setPrevia(r.dados);
      setNota(r.dados.nota);
    });
  }

  function transmitir() {
    if (!previa || !nota) return;
    iniciar(async () => {
      setErro(null);
      const r = await transmitirNfse(nota.id, previa.hash_previa, confirmadoProducao);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      router.push(`/admin/notas/${r.dados.id}`);
    });
  }

  const idx = ETAPAS.findIndex((e) => e.chave === etapa);
  const anterior = idx > 0 ? ETAPAS[idx - 1].chave : null;
  const proxima = idx < ETAPAS.length - 1 ? ETAPAS[idx + 1].chave : null;
  const prestadoresDoFluxo = prestadores.filter((p) => p.tipo === form.fluxo && p.ativo);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Etapas da emissão" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {ETAPAS.map((e, i) => {
            const atual = e.chave === etapa;
            const n = porEtapa[e.chave] ?? 0;
            return (
              <li key={e.chave} className="shrink-0">
                <button
                  type="button"
                  onClick={() => irPara(e.chave)}
                  disabled={pendente}
                  aria-current={atual ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    atual ? "border-ocean bg-ocean-50 font-semibold text-ocean" : "border-line bg-raised text-ink hover:bg-paper"
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs", atual ? "bg-ocean text-white" : "bg-paper text-ink-soft")}>
                    {i + 1}
                  </span>
                  <span className="whitespace-nowrap">{e.titulo}</span>
                  {nota && n > 0 && e.chave !== "revisao" && (
                    <span className="ml-auto rounded-full bg-gold-50 px-1.5 font-mono text-[.7rem] text-gold-dark" title={`${n} pendência(s)`}>
                      {n}
                    </span>
                  )}
                  {nota && n === 0 && e.chave !== "revisao" && <Check className="ml-auto h-4 w-4 text-ok" aria-label="sem pendências" />}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 hidden lg:block">
          <Badge tone={producao ? "gold" : "neutral"}>Ambiente: {AMBIENTE_LABEL[cfg.ambiente]}</Badge>
        </div>
      </nav>

      <div className="min-w-0 space-y-4">
        {producao && (
          <Alert tone="warning" title="Ambiente de PRODUÇÃO">
            A transmissão gera um documento fiscal oficial, com efeitos tributários.
          </Alert>
        )}
        {erro && (
          <Alert tone="danger" role="alert">
            {erro}
          </Alert>
        )}
        {aviso && (
          <Alert tone="success" role="status">
            {aviso}
          </Alert>
        )}

        {etapa !== "revisao" && pendencias.filter((p) => p.etapa === etapa).length > 0 && (
          <Alert tone="warning" title="Pendências desta etapa">
            <ul className="list-disc pl-4">
              {pendencias
                .filter((p) => p.etapa === etapa)
                .map((p) => (
                  <li key={p.campo + p.mensagem}>{p.mensagem}</li>
                ))}
            </ul>
          </Alert>
        )}

        <Card as="section">
          {etapa === "operacao" && (
            <>
              <CardHeader title="1. Operação" description="Quem presta o serviço e quando ele ocorreu." />
              <fieldset className="mb-4">
                <legend className="mb-2 text-sm font-medium text-ink">Tipo de emissão</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["propria", "Nossa empresa → cliente", "A Anfitrião é a prestadora; o tomador é o nosso cliente."],
                      ["cliente", "Cliente → tomador dele", "Emissão em nome de um cliente que nos autorizou (procuração/contrato)."],
                    ] as const
                  ).map(([v, t, d]) => (
                    <label key={v} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3", form.fluxo === v ? "border-ocean bg-ocean-50" : "border-line", nota && "cursor-not-allowed opacity-70")}>
                      <input
                        type="radio"
                        name="fluxo"
                        value={v}
                        checked={form.fluxo === v}
                        disabled={Boolean(nota)}
                        onChange={() => setForm((f) => ({ ...f, fluxo: v, prestador_id: "", tomador_id: "", intermediario_id: "" }))}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-medium text-ink">{t}</span>
                        <span className="block text-xs text-ink-soft">{d}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Prestador" obrigatorio erro={erroDe("prestador_id")} className="sm:col-span-2" hint={nota ? "O prestador não pode ser trocado depois que o rascunho é criado." : undefined}>
                  <select
                    className={controlClass}
                    value={form.prestador_id}
                    disabled={Boolean(nota)}
                    onChange={(e) => {
                      const p = prestadores.find((x) => x.id === e.target.value);
                      setForm((f) => ({
                        ...f,
                        prestador_id: e.target.value,
                        tomador_id: "",
                        intermediario_id: "",
                        servico: { ...f.servico, municipio_prestacao: f.servico.municipio_prestacao || p?.codigo_municipio || "" },
                      }));
                    }}
                  >
                    <option value="">Selecione…</option>
                    {prestadoresDoFluxo.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.razao_social} — {fmtDocumento(p.documento)}
                        {p.apto_para_emissao ? "" : " (com pendências)"}
                      </option>
                    ))}
                  </select>
                </Campo>
                {prestadoresDoFluxo.length === 0 && (
                  <Alert tone="info" className="sm:col-span-2">
                    Nenhum prestador {form.fluxo === "propria" ? "da própria empresa" : "cliente"} cadastrado.{" "}
                    <Link href="/admin/notas/prestadores" className="font-medium underline">
                      Cadastrar prestador
                    </Link>
                  </Alert>
                )}
                <Campo label="Ambiente fiscal" hint="Definido pela configuração da API (NFSE_ENVIRONMENT).">
                  <input className={controlClass} value={AMBIENTE_LABEL[cfg.ambiente]} readOnly />
                </Campo>
                <Campo label="Data de emissão" hint="Registrada no momento da transmissão (dhEmi).">
                  <input className={controlClass} value="Na transmissão" readOnly />
                </Campo>
                <Campo label="Data da prestação" obrigatorio erro={erroDe("data_prestacao")} hint="Quando o serviço foi executado (registro interno).">
                  <input type="date" className={controlClass} value={form.data_prestacao} max={hojeISO()} onChange={(e) => mudar("data_prestacao", e.target.value)} />
                </Campo>
                <Campo label="Competência (dCompet)" obrigatorio erro={erroDe("data_competencia")} hint="Data do fato gerador do ISSQN; não pode ser posterior à emissão.">
                  <input type="date" className={controlClass} value={form.data_competencia} max={hojeISO()} onChange={(e) => mudar("data_competencia", e.target.value)} />
                </Campo>
                {nota?.dps?.id && (
                  <Campo label="Identificador da DPS" hint="Reservado na preparação; nunca muda para esta nota." className="sm:col-span-2">
                    <input className={cn(controlClass, "font-mono text-xs")} value={nota.dps.id} readOnly />
                  </Campo>
                )}
              </div>
            </>
          )}

          {etapa === "prestador" && (
            <>
              <CardHeader
                title="2. Dados do prestador"
                description="Vêm do cadastro fiscal do prestador. Para corrigir, edite o prestador."
                action={
                  prestador && (
                    <Link href={`/admin/notas/prestadores/${prestador.id}`} className={buttonClass("secondary", "sm")}>
                      Editar prestador
                    </Link>
                  )
                }
              />
              {!prestador ? (
                <Alert tone="info">Selecione o prestador na etapa 1.</Alert>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <dl>
                    <Linha k={prestador.documento.length === 14 ? "CNPJ" : "CPF"} v={fmtDocumento(prestador.documento)} />
                    <Linha k="Razão social" v={prestador.razao_social} />
                    <Linha k="Nome fantasia" v={prestador.nome_fantasia} />
                    <Linha k="Inscrição municipal" v={prestador.inscricao_municipal} />
                    <Linha k="Município (IBGE)" v={`${prestador.municipio_nome ?? ""} ${prestador.codigo_municipio}${prestador.uf ? `/${prestador.uf}` : ""}`} />
                    <Linha k="Endereço" v={prestador.endereco ? `${prestador.endereco.logradouro}, ${prestador.endereco.numero} — ${prestador.endereco.bairro}` : "Cadastro Nacional (CNC)"} />
                  </dl>
                  <dl>
                    <Linha k="Simples Nacional" v={op.optante_simples?.[prestador.optante_simples]} />
                    {prestador.optante_simples === "3" && <Linha k="Apuração SN" v={op.regime_apuracao_sn?.[prestador.regime_apuracao_sn ?? ""]} />}
                    <Linha k="Regime especial" v={op.regime_especial?.[prestador.regime_especial]} />
                    <Linha k="Série da DPS" v={prestador.serie_dps} />
                    <Linha
                      k="Certificado A1"
                      v={
                        prestador.certificado?.apto_para_emissao ? (
                          <span className="inline-flex items-center gap-1 text-ok">
                            <ShieldCheck className="h-4 w-4" aria-hidden /> Apto · vence {fmtData(prestador.certificado.valido_ate)}
                          </span>
                        ) : (
                          <span className="text-danger">{prestador.certificado?.motivo ?? "Não cadastrado"}</span>
                        )
                      }
                    />
                    <Linha
                      k="Autorização"
                      v={
                        prestador.tipo === "propria"
                          ? "Não se aplica (própria empresa)"
                          : prestador.autorizacao?.situacao === "vigente"
                            ? `Vigente · ${prestador.autorizacao.referencia}`
                            : <span className="text-danger">{prestador.autorizacao?.situacao ?? "ausente"}</span>
                      }
                    />
                  </dl>
                  {prestador.pendencias.length > 0 && (
                    <Alert tone="warning" title="O prestador ainda não está apto" className="md:col-span-2">
                      <ul className="list-disc pl-4">
                        {prestador.pendencias.map((p) => (
                          <li key={p.campo + p.mensagem}>{p.mensagem}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                </div>
              )}
            </>
          )}

          {etapa === "tomador" && (
            <EtapaTomador
              prestador={prestador}
              tomadores={tomadores}
              selecionado={form.tomador_id}
              clientes={clientes}
              erro={erroDe("tomador_id")}
              onSelecionar={(id) => mudar("tomador_id", id)}
              onCriado={(t) => {
                setTomadores((ts) => [t, ...ts]);
                mudar("tomador_id", t.id);
              }}
            />
          )}

          {etapa === "servico" && (
            <>
              <CardHeader title="4. Serviço" description="Códigos conforme a Lista de Serviços Nacional (cTribNac) e a parametrização do município." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Código de tributação nacional" obrigatorio erro={erroDe("servico.codigo_tributacao_nacional")} hint="6 dígitos: item + subitem + desdobro (ex.: 170201).">
                  <input className={controlClass} inputMode="numeric" maxLength={6} value={form.servico.codigo_tributacao_nacional ?? ""} onChange={(e) => mudarServ("codigo_tributacao_nacional", e.target.value.replace(/\D/g, ""))} />
                </Campo>
                <Campo label="Código de tributação municipal" erro={erroDe("servico.codigo_tributacao_municipal")} hint="3 dígitos, quando o município exigir.">
                  <input className={controlClass} inputMode="numeric" maxLength={3} value={form.servico.codigo_tributacao_municipal ?? ""} onChange={(e) => mudarServ("codigo_tributacao_municipal", e.target.value.replace(/\D/g, ""))} />
                </Campo>
                <Campo label="Código NBS" erro={erroDe("servico.codigo_nbs")} hint="9 dígitos (opcional).">
                  <input className={controlClass} inputMode="numeric" maxLength={9} value={form.servico.codigo_nbs ?? ""} onChange={(e) => mudarServ("codigo_nbs", e.target.value.replace(/\D/g, ""))} />
                </Campo>
                <Campo label="Código interno" erro={erroDe("servico.codigo_interno")} hint="Até 20 letras/números (cIntContrib).">
                  <input className={controlClass} maxLength={20} value={form.servico.codigo_interno ?? ""} onChange={(e) => mudarServ("codigo_interno", e.target.value.replace(/[^A-Za-z0-9]/g, ""))} />
                </Campo>
                <Campo label="Descrição do serviço" obrigatorio erro={erroDe("servico.descricao")} className="sm:col-span-2">
                  <textarea className={controlClass} rows={4} maxLength={2000} value={form.servico.descricao ?? ""} onChange={(e) => mudarServ("descricao", e.target.value)} />
                </Campo>
                <Campo label="Município da prestação (IBGE)" obrigatorio={!form.servico.pais_prestacao} erro={erroDe("servico.municipio_prestacao")} hint="Define, com o código do serviço, o município de incidência (calculado pela Sefin).">
                  <input className={controlClass} inputMode="numeric" maxLength={7} disabled={Boolean(form.servico.pais_prestacao)} value={form.servico.municipio_prestacao ?? ""} onChange={(e) => mudarServ("municipio_prestacao", e.target.value.replace(/\D/g, ""))} />
                </Campo>
                <Campo label="País da prestação (se no exterior)" erro={erroDe("servico.pais_prestacao")} hint="Código ISO de 2 letras. Deixe vazio para serviço no Brasil.">
                  <input className={controlClass} maxLength={2} value={form.servico.pais_prestacao ?? ""} onChange={(e) => mudarServ("pais_prestacao", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
                </Campo>
                <Campo label="Intermediário" hint="Somente se houver intermediário na operação (cadastre-o como tomador deste prestador).">
                  <select className={controlClass} value={form.intermediario_id} onChange={(e) => mudar("intermediario_id", e.target.value)}>
                    <option value="">Sem intermediário</option>
                    {tomadores
                      .filter((t) => t.id !== form.tomador_id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome} {t.documento ? `— ${fmtDocumento(t.documento)}` : ""}
                        </option>
                      ))}
                  </select>
                </Campo>
                <Campo label="Referência do contrato" hint="Uso interno (não vai para a DPS).">
                  <input className={controlClass} maxLength={120} value={form.servico.referencia_contrato ?? ""} onChange={(e) => mudarServ("referencia_contrato", e.target.value)} />
                </Campo>
                <Alert tone="info" className="sm:col-span-2">
                  Obra/construção civil, eventos, comércio exterior e o grupo IBS/CBS ainda não são preenchidos por este assistente (opcionais no leiaute v1.01;
                  ver docs/NFSE_NACIONAL.md). Não emita por aqui notas que os exijam.
                </Alert>
              </div>
            </>
          )}

          {etapa === "valores" && (
            <>
              <CardHeader title="5. Valores e tributos" description="Use vírgula ou ponto para os centavos. Nada é preenchido automaticamente." />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Campo label="Valor do serviço (R$)" obrigatorio erro={erroDe("valores.valor_servico")}>
                  <input className={controlClass} inputMode="decimal" value={form.valores.valor_servico ?? ""} onChange={(e) => mudarVal("valor_servico", e.target.value)} />
                </Campo>
                <Campo label="Desconto incondicionado (R$)" erro={erroDe("valores.desconto_incondicionado")}>
                  <input className={controlClass} inputMode="decimal" value={form.valores.desconto_incondicionado ?? ""} onChange={(e) => mudarVal("desconto_incondicionado", e.target.value)} />
                </Campo>
                <Campo label="Desconto condicionado (R$)">
                  <input className={controlClass} inputMode="decimal" value={form.valores.desconto_condicionado ?? ""} onChange={(e) => mudarVal("desconto_condicionado", e.target.value)} />
                </Campo>
                <Campo label="Dedução/redução da base (R$)" hint="Só quando a legislação municipal permitir.">
                  <input className={controlClass} inputMode="decimal" value={form.valores.deducao_valor ?? ""} onChange={(e) => mudarVal("deducao_valor", e.target.value)} />
                </Campo>
                <Campo label="Tributação do ISSQN" obrigatorio erro={erroDe("valores.tributacao_issqn")}>
                  <select className={controlClass} value={form.valores.tributacao_issqn ?? ""} onChange={(e) => mudarVal("tributacao_issqn", e.target.value)}>
                    <Opcoes mapa={op.tributacao_issqn} vazio="Selecione…" />
                  </select>
                </Campo>
                {form.valores.tributacao_issqn === "2" && (
                  <Campo label="Tipo de imunidade" obrigatorio erro={erroDe("valores.tipo_imunidade")}>
                    <select className={controlClass} value={form.valores.tipo_imunidade ?? ""} onChange={(e) => mudarVal("tipo_imunidade", e.target.value)}>
                      <Opcoes mapa={op.tipo_imunidade} vazio="Selecione…" />
                    </select>
                  </Campo>
                )}
                {form.valores.tributacao_issqn === "3" && (
                  <Campo label="País do resultado (ISO)" obrigatorio erro={erroDe("valores.pais_resultado")}>
                    <input className={controlClass} maxLength={2} value={form.valores.pais_resultado ?? ""} onChange={(e) => mudarVal("pais_resultado", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
                  </Campo>
                )}
                <Campo label="Retenção do ISSQN" obrigatorio erro={erroDe("valores.tipo_retencao_issqn")}>
                  <select className={controlClass} value={form.valores.tipo_retencao_issqn ?? ""} onChange={(e) => mudarVal("tipo_retencao_issqn", e.target.value)}>
                    <Opcoes mapa={op.tipo_retencao_issqn} vazio="Selecione…" />
                  </select>
                </Campo>
                <Campo label="Alíquota do ISSQN (%)" erro={erroDe("valores.aliquota_issqn")} hint="Informe só quando exigido (ex.: retenção ou regra municipal). Máx. 9,99.">
                  <input className={controlClass} inputMode="decimal" value={form.valores.aliquota_issqn ?? ""} onChange={(e) => mudarVal("aliquota_issqn", e.target.value)} />
                </Campo>
                <Campo label="Retenção CP (R$)">
                  <input className={controlClass} inputMode="decimal" value={form.valores.retencao_cp ?? ""} onChange={(e) => mudarVal("retencao_cp", e.target.value)} />
                </Campo>
                <Campo label="Retenção IRRF (R$)">
                  <input className={controlClass} inputMode="decimal" value={form.valores.retencao_irrf ?? ""} onChange={(e) => mudarVal("retencao_irrf", e.target.value)} />
                </Campo>
                <Campo label="Retenção CSLL (R$)">
                  <input className={controlClass} inputMode="decimal" value={form.valores.retencao_csll ?? ""} onChange={(e) => mudarVal("retencao_csll", e.target.value)} />
                </Campo>
                <Campo label="Total aproximado de tributos" obrigatorio erro={erroDe("valores.total_tributos")} className="sm:col-span-2 xl:col-span-3" hint="Lei 12.741/2012: escolha como declarar (o leiaute exige um dos grupos).">
                  <select
                    className={controlClass}
                    value={form.valores.total_tributos?.modo ?? ""}
                    onChange={(e) =>
                      mudarVal("total_tributos", e.target.value ? { modo: e.target.value as NonNullable<ValoresNfse["total_tributos"]>["modo"] } : null)
                    }
                  >
                    <option value="">Selecione…</option>
                    {Object.entries(op.total_tributos ?? {}).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Campo>
                {form.valores.total_tributos?.modo === "percentual_sn" && (
                  <Campo label="Percentual do Simples Nacional (%)" obrigatorio>
                    <input className={controlClass} inputMode="decimal" value={form.valores.total_tributos.percentual_sn ?? ""} onChange={(e) => mudarTot("percentual_sn", e.target.value)} />
                  </Campo>
                )}
                {(form.valores.total_tributos?.modo === "valores" || form.valores.total_tributos?.modo === "percentuais") &&
                  (["federal", "estadual", "municipal"] as const).map((k) => (
                    <Campo key={k} label={`${k[0].toUpperCase()}${k.slice(1)} (${form.valores.total_tributos?.modo === "valores" ? "R$" : "%"})`} obrigatorio>
                      <input className={controlClass} inputMode="decimal" value={form.valores.total_tributos?.[k] ?? ""} onChange={(e) => mudarTot(k, e.target.value)} />
                    </Campo>
                  ))}
              </div>
              <div className="mt-5 rounded-xl border border-line bg-paper p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Estimativa (a Sefin calcula os valores oficiais)</p>
                <dl className="grid gap-x-6 sm:grid-cols-2">
                  <Linha k="Base de cálculo" v={fmtCentavos(est.base)} />
                  <Linha k="ISSQN estimado" v={est.iss === null ? "Alíquota definida pelo município" : fmtCentavos(est.iss)} />
                  <Linha k="ISSQN retido" v={fmtCentavos(est.retido)} />
                  <Linha k="Retenções federais" v={fmtCentavos(est.fed)} />
                  <Linha k="Valor líquido estimado" v={<strong>{fmtCentavos(est.liquido)}</strong>} />
                </dl>
              </div>
            </>
          )}

          {etapa === "revisao" && (
            <>
              <CardHeader title="6. Revisão e transmissão" description="Confira tudo. A prévia é a DPS exatamente como será assinada (a data de emissão é definida no envio)." />
              {!previa ? (
                <div className="space-y-3">
                  {pendencias.length > 0 ? (
                    <Alert tone="warning" title={`${pendencias.length} pendência(s) impedem a transmissão`}>
                      <ul className="list-disc pl-4">
                        {pendencias.map((p) => (
                          <li key={p.etapa + p.campo + p.mensagem}>
                            <button type="button" className="underline" onClick={() => setEtapa(p.etapa as Etapa)}>
                              {ETAPAS.find((e) => e.chave === p.etapa)?.titulo}
                            </button>
                            : {p.mensagem}
                          </li>
                        ))}
                      </ul>
                    </Alert>
                  ) : (
                    <p className="text-sm text-ink-soft">Gere a prévia para validar a DPS contra o leiaute oficial (XSD v{cfg.versao_leiaute}) e reservar o número.</p>
                  )}
                  <button type="button" className={buttonClass("primary", "md")} onClick={gerarPrevia} disabled={pendente}>
                    {pendente ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShieldCheck className="h-4 w-4" aria-hidden />} Validar e gerar prévia
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-6 md:grid-cols-2">
                    <dl>
                      <Linha k="Prestador" v={`${String(previa.nota.prestador?.razao_social ?? "")} — ${fmtDocumento(String(previa.nota.prestador?.documento ?? ""))}`} />
                      <Linha k="Tomador" v={`${String(previa.nota.tomador?.nome ?? "")} ${previa.nota.tomador?.documento ? `— ${fmtDocumento(String(previa.nota.tomador.documento))}` : ""}`} />
                      <Linha k="Serviço" v={`${previa.nota.servico?.codigo_tributacao_nacional} · município ${previa.nota.servico?.municipio_prestacao ?? previa.nota.servico?.pais_prestacao}`} />
                      <Linha k="Competência" v={fmtData(previa.nota.data_competencia)} />
                      <Linha k="Data da prestação" v={fmtData(previa.nota.data_prestacao)} />
                      <Linha k="Ambiente" v={<Badge tone={previa.producao ? "gold" : "neutral"}>{AMBIENTE_LABEL[previa.ambiente]}</Badge>} />
                    </dl>
                    <dl>
                      <Linha k="Valor do serviço" v={fmtCentavos(centavos(previa.nota.valor))} />
                      <Linha k="Base estimada" v={previa.nota.calculo?.base_calculo ? fmtCentavos(centavos(previa.nota.calculo.base_calculo)) : "—"} />
                      <Linha k="ISSQN estimado" v={previa.nota.calculo?.issqn_estimado ? fmtCentavos(centavos(previa.nota.calculo.issqn_estimado)) : "Definido pelo município"} />
                      <Linha k="Id da DPS" v={<span className="font-mono text-xs">{previa.id_dps}</span>} />
                      <Linha
                        k="Certificado"
                        v={previa.certificado?.apto_para_emissao ? `Apto · ${previa.certificado.titular_nome ?? ""} · vence ${fmtData(previa.certificado.valido_ate)}` : previa.certificado?.motivo ?? "—"}
                      />
                      <Linha k="Prévia gerada" v={fmtDataHora(new Date().toISOString())} />
                    </dl>
                  </div>
                  <details className="rounded-lg border border-line bg-paper p-3">
                    <summary className="cursor-pointer text-sm font-medium text-ink">Ver XML da DPS (sem assinatura)</summary>
                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all font-mono text-[.7rem] text-ink-soft">{previa.xml}</pre>
                  </details>
                  <div className="space-y-2 rounded-xl border border-line p-4">
                    <label className="flex items-start gap-2 text-sm">
                      <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} className="mt-1" />
                      <span>Revisei prestador, tomador, serviço, competência e valores e autorizo a assinatura e a transmissão desta DPS.</span>
                    </label>
                    {previa.producao && (
                      <label className="flex items-start gap-2 text-sm font-medium text-gold-dark">
                        <input type="checkbox" checked={confirmadoProducao} onChange={(e) => setConfirmadoProducao(e.target.checked)} className="mt-1" />
                        <span>
                          <AlertTriangle className="mr-1 inline h-4 w-4" aria-hidden />
                          Estou ciente de que, em PRODUÇÃO, esta operação gera uma NFS-e oficial.
                        </span>
                      </label>
                    )}
                    <button
                      type="button"
                      className={buttonClass(previa.producao ? "gold" : "primary", "md")}
                      onClick={transmitir}
                      disabled={pendente || !confirmado || (previa.producao && !confirmadoProducao) || !cfg.habilitado}
                    >
                      {pendente ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />} Assinar e transmitir
                    </button>
                    {!cfg.habilitado && <p className="text-xs text-danger">Transmissão desabilitada na API (NFSE_ENABLED=false).</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {anterior && (
              <button type="button" className={buttonClass("ghost", "md")} onClick={() => irPara(anterior)} disabled={pendente}>
                <ChevronLeft className="h-4 w-4" aria-hidden /> Voltar
              </button>
            )}
            <button type="button" className={buttonClass("secondary", "md")} onClick={salvarAgora} disabled={pendente || !form.prestador_id}>
              <Save className="h-4 w-4" aria-hidden /> Salvar rascunho
            </button>
          </div>
          {proxima && (
            <button type="button" className={buttonClass("primary", "md")} onClick={() => irPara(proxima)} disabled={pendente}>
              {pendente ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Avançar <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------- etapa 3
function EtapaTomador({
  prestador,
  tomadores,
  selecionado,
  clientes,
  erro,
  onSelecionar,
  onCriado,
}: {
  prestador: Prestador | null;
  tomadores: Tomador[];
  selecionado: string;
  clientes: Cliente[];
  erro?: string;
  onSelecionar: (id: string) => void;
  onCriado: (t: Tomador) => void;
}) {
  const [busca, setBusca] = useState("");
  const [novo, setNovo] = useState(false);
  const [pendente, iniciar] = useTransition();
  const [falha, setFalha] = useState<string | null>(null);
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  const [t, setT] = useState({
    tipo_pessoa: "PF",
    documento: "",
    nif: "",
    nome: "",
    inscricao_municipal: "",
    email: "",
    telefone: "",
    usuario_uid: "",
    pais: "BR",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    codigo_municipio: "",
    uf: "",
    codigo_postal: "",
    cidade: "",
    estado_provincia: "",
  });
  const set = (k: keyof typeof t, v: string) => setT((x) => ({ ...x, [k]: v }));
  const filtrados = tomadores.filter((x) => {
    const q = busca.trim().toLowerCase();
    return !q || x.nome.toLowerCase().includes(q) || (x.documento ?? "").includes(q.replace(/\D/g, "") || "§");
  });

  if (!prestador) return <Alert tone="info">Selecione o prestador na etapa 1.</Alert>;

  function criar() {
    setFalha(null);
    const temEndereco = t.logradouro || t.numero || t.bairro;
    const endereco = temEndereco
      ? t.pais === "BR"
        ? { logradouro: t.logradouro, numero: t.numero, complemento: t.complemento, bairro: t.bairro, pais: "BR", cep: t.cep.replace(/\D/g, ""), codigo_municipio: t.codigo_municipio, uf: t.uf }
        : { logradouro: t.logradouro, numero: t.numero, complemento: t.complemento, bairro: t.bairro, pais: t.pais, codigo_postal: t.codigo_postal, cidade: t.cidade, estado_provincia: t.estado_provincia }
      : null;
    iniciar(async () => {
      const r = await criarTomadorNfse(prestador!.id, {
        tipo_pessoa: t.tipo_pessoa,
        documento: t.tipo_pessoa === "EXT" ? null : t.documento,
        nif: t.tipo_pessoa === "EXT" ? t.nif : null,
        nome: t.nome,
        inscricao_municipal: t.inscricao_municipal,
        email: t.email,
        telefone: t.telefone.replace(/\D/g, ""),
        usuario_uid: prestador!.tipo === "propria" ? t.usuario_uid : null,
        endereco,
      });
      if (!r.ok) {
        setFalha(r.erro);
        setErrosCampos(r.campos ?? {});
        return;
      }
      setNovo(false);
      onCriado(r.dados);
    });
  }

  const e = (k: string) => errosCampos[k] ?? errosCampos[`endereco.${k}`];

  return (
    <>
      <CardHeader
        title="3. Tomador"
        description={`Tomadores cadastrados para ${prestador.razao_social}. Cada prestador tem a própria lista.`}
        action={
          <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setNovo((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden /> Novo tomador
          </button>
        }
      />
      {erro && <p className="mb-3 text-sm font-medium text-red-700">{erro}</p>}
      {novo && (
        <div className="mb-5 rounded-xl border border-ocean/30 bg-ocean-50/40 p-4">
          {falha && (
            <Alert tone="danger" className="mb-3">
              {falha}
            </Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {prestador.tipo === "propria" && (
              <Campo label="Cliente da plataforma" hint="Vincula a nota ao cliente (ele passa a vê-la no Portal)." className="sm:col-span-2 xl:col-span-3">
                <select
                  className={controlClass}
                  value={t.usuario_uid}
                  onChange={(ev) => {
                    const c = clientes.find((x) => x.id === ev.target.value);
                    setT((x) => ({
                      ...x,
                      usuario_uid: ev.target.value,
                      nome: c?.nome ?? x.nome,
                      email: c?.email ?? x.email,
                      documento: c?.documento ?? x.documento,
                      tipo_pessoa: c?.documento?.length === 14 ? "PJ" : c?.documento ? "PF" : x.tipo_pessoa,
                    }));
                  }}
                >
                  <option value="">Não vincular</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.documento ? `— ${fmtDocumento(c.documento)}` : ""}
                    </option>
                  ))}
                </select>
              </Campo>
            )}
            <Campo label="Tipo de pessoa" obrigatorio>
              <select className={controlClass} value={t.tipo_pessoa} onChange={(ev) => set("tipo_pessoa", ev.target.value)}>
                <option value="PF">Pessoa física (CPF)</option>
                <option value="PJ">Pessoa jurídica (CNPJ)</option>
                <option value="EXT">Exterior (NIF)</option>
              </select>
            </Campo>
            {t.tipo_pessoa === "EXT" ? (
              <Campo label="NIF" obrigatorio erro={e("nif")}>
                <input className={controlClass} value={t.nif} onChange={(ev) => set("nif", ev.target.value)} />
              </Campo>
            ) : (
              <Campo label={t.tipo_pessoa === "PF" ? "CPF" : "CNPJ"} obrigatorio erro={e("documento") ?? erroDocumento(t.documento, t.tipo_pessoa === "PF" ? "PF" : "PJ") ?? undefined}>
                <input
                  className={controlClass}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={18}
                  value={mascaraDocumento(t.documento, t.tipo_pessoa === "PF" ? "PF" : "PJ")}
                  onChange={(ev) => set("documento", soDigitos(ev.target.value))}
                />
              </Campo>
            )}
            <Campo label="Nome / razão social" obrigatorio erro={e("nome")}>
              <input className={controlClass} value={t.nome} onChange={(ev) => set("nome", ev.target.value)} />
            </Campo>
            <Campo label="Inscrição municipal" erro={e("inscricao_municipal")}>
              <input className={controlClass} value={t.inscricao_municipal} onChange={(ev) => set("inscricao_municipal", ev.target.value)} />
            </Campo>
            <Campo label="E-mail" erro={e("email")}>
              <input type="email" className={controlClass} value={t.email} onChange={(ev) => set("email", ev.target.value)} />
            </Campo>
            <Campo label="Telefone" erro={e("telefone")}>
              <input className={controlClass} inputMode="tel" value={t.telefone} onChange={(ev) => set("telefone", ev.target.value)} />
            </Campo>
            <Campo label="País">
              <input className={controlClass} maxLength={2} value={t.pais} onChange={(ev) => set("pais", ev.target.value.toUpperCase())} />
            </Campo>
            {t.pais === "BR" ? (
              <>
                <Campo label="CEP" erro={e("cep")}>
                  <input className={controlClass} inputMode="numeric" value={t.cep} onChange={(ev) => set("cep", ev.target.value)} />
                </Campo>
                <Campo label="Município (IBGE)" erro={e("codigo_municipio")} hint="7 dígitos">
                  <input className={controlClass} inputMode="numeric" maxLength={7} value={t.codigo_municipio} onChange={(ev) => set("codigo_municipio", ev.target.value.replace(/\D/g, ""))} />
                </Campo>
                <Campo label="UF">
                  <input className={controlClass} maxLength={2} value={t.uf} onChange={(ev) => set("uf", ev.target.value.toUpperCase())} />
                </Campo>
              </>
            ) : (
              <>
                <Campo label="Código postal" erro={e("codigo_postal")}>
                  <input className={controlClass} value={t.codigo_postal} onChange={(ev) => set("codigo_postal", ev.target.value)} />
                </Campo>
                <Campo label="Cidade" erro={e("cidade")}>
                  <input className={controlClass} value={t.cidade} onChange={(ev) => set("cidade", ev.target.value)} />
                </Campo>
                <Campo label="Estado/província" erro={e("estado_provincia")}>
                  <input className={controlClass} value={t.estado_provincia} onChange={(ev) => set("estado_provincia", ev.target.value)} />
                </Campo>
              </>
            )}
            <Campo label="Logradouro" erro={e("logradouro")}>
              <input className={controlClass} value={t.logradouro} onChange={(ev) => set("logradouro", ev.target.value)} />
            </Campo>
            <Campo label="Número" erro={e("numero")}>
              <input className={controlClass} value={t.numero} onChange={(ev) => set("numero", ev.target.value)} />
            </Campo>
            <Campo label="Complemento">
              <input className={controlClass} value={t.complemento} onChange={(ev) => set("complemento", ev.target.value)} />
            </Campo>
            <Campo label="Bairro" erro={e("bairro")}>
              <input className={controlClass} value={t.bairro} onChange={(ev) => set("bairro", ev.target.value)} />
            </Campo>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className={buttonClass("primary", "sm")} onClick={criar} disabled={pendente}>
              {pendente && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Salvar tomador
            </button>
            <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setNovo(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      <input
        className={cn(controlClass, "mb-3")}
        placeholder="Filtrar por nome ou CPF/CNPJ"
        value={busca}
        onChange={(ev) => setBusca(ev.target.value)}
        aria-label="Filtrar tomadores"
      />
      {filtrados.length === 0 ? (
        <p className="text-sm text-ink-soft">Nenhum tomador cadastrado para este prestador.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line" role="radiogroup" aria-label="Tomadores">
          {filtrados.map((x) => (
            <li key={x.id}>
              <label className={cn("flex cursor-pointer items-start gap-3 px-3 py-2.5", selecionado === x.id && "bg-ocean-50")}>
                <input type="radio" name="tomador" checked={selecionado === x.id} onChange={() => onSelecionar(x.id)} className="mt-1" />
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{x.nome}</span>
                  <span className="block font-mono text-xs text-ink-soft">
                    {x.documento ? fmtDocumento(x.documento) : `NIF ${x.nif ?? "—"}`}
                    {x.endereco?.codigo_municipio ? ` · IBGE ${x.endereco.codigo_municipio}` : ""}
                    {x.email ? ` · ${x.email}` : ""}
                    {x.usuario_uid ? " · cliente da plataforma" : ""}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
