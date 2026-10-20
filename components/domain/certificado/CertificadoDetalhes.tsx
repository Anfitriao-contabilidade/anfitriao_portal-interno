import { AlertTriangle, CheckCircle2, FileKey, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { fmtData, fmtDataHora, fmtDocumento } from "@/lib/format";
import { ROTULO_SITUACAO, TOM_SITUACAO } from "@/lib/certificados";
import type { CertificadoStatus, SituacaoCertificado } from "@/lib/tipos";

export function SituacaoCertificadoBadge({ situacao }: { situacao: SituacaoCertificado }) {
  return (
    <Badge tone={TOM_SITUACAO[situacao]} dot>
      {ROTULO_SITUACAO[situacao]}
    </Badge>
  );
}

const TIPO: Record<string, string> = { "e-cpf": "e-CPF (pessoa física)", "e-cnpj": "e-CNPJ (pessoa jurídica)", outro: "Outro" };
const REVOGACAO: Record<string, string> = {
  nao_verificada: "Não verificada",
  nao_revogado: "Não revogado",
  revogado: "Revogado",
  indeterminada: "Não foi possível verificar",
};
const CADEIA: Record<string, string> = {
  nao_verificada: "Não verificada",
  confiavel: "Confiável",
  nao_confiavel: "Não confiável",
  incompleta: "Incompleta",
};

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-ink-soft">{rotulo}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{children}</dd>
    </div>
  );
}

function textoDias(dias: number) {
  if (dias < 0) return `vencido há ${Math.abs(dias)} dia(s)`;
  if (dias === 0) return "vence hoje";
  return `${dias} dia(s)`;
}

/** Situação + metadados do certificado. Nenhum dado secreto chega aqui (a API não os devolve). */
export function CertificadoDetalhes({ status, visaoEquipe = false }: { status: CertificadoStatus; visaoEquipe?: boolean }) {
  const c = status.certificado;
  const tomAviso = status.situacao === "proximo_vencimento" ? "warning" : "danger";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FileKey className="h-5 w-5 text-ink-soft" aria-hidden />
        <SituacaoCertificadoBadge situacao={status.situacao} />
        {c && (
          <span className="text-sm text-ink-soft">
            {c.dias_restantes >= 0 ? "Vence em " : ""}
            <strong className="font-medium text-ink">{textoDias(c.dias_restantes)}</strong>
          </span>
        )}
        {status.apto_para_uso ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Apto para emissão fiscal
          </span>
        ) : c ? (
          <span className="inline-flex items-center gap-1 text-xs text-red-800">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Bloqueado para emissão fiscal
          </span>
        ) : null}
      </div>

      {status.motivo && status.situacao !== "valido" && (
        <p
          role="status"
          className={
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm " +
            (status.situacao === "nao_cadastrado"
              ? "border-line bg-paper text-ink-soft"
              : tomAviso === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-red-200 bg-red-50 text-red-900")
          }
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {status.motivo}
        </p>
      )}

      {c && (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Linha rotulo="Titular">{c.titular_nome}</Linha>
          <Linha rotulo="CPF/CNPJ">
            {c.titular_documento ? fmtDocumento(c.titular_documento) : "Não informado no certificado"}
            {c.confere_com_cadastro === false && (
              <span className="mt-1 block text-xs text-amber-800">Diferente do CPF/CNPJ do cadastro.</span>
            )}
          </Linha>
          <Linha rotulo="Tipo">{TIPO[c.tipo] ?? c.tipo}</Linha>
          {c.responsavel_nome && <Linha rotulo="Responsável">{c.responsavel_nome}</Linha>}
          <Linha rotulo="Autoridade certificadora">
            {c.emissor_nome}
            {c.emissor_organizacao ? <span className="block text-xs text-ink-soft">{c.emissor_organizacao}</span> : null}
          </Linha>
          <Linha rotulo="Válido de">{fmtData(c.valido_de)}</Linha>
          <Linha rotulo="Válido até">{fmtData(c.valido_ate)}</Linha>
          <Linha rotulo="Número de série">
            <span className="font-mono text-xs">{c.numero_serie}</span>
          </Linha>
          <Linha rotulo="Revogação">
            {REVOGACAO[c.revogacao.situacao] ?? c.revogacao.situacao}
            {c.revogacao.verificado_em ? (
              <span className="block text-xs text-ink-soft">verificado em {fmtDataHora(c.revogacao.verificado_em)}</span>
            ) : null}
          </Linha>
          <Linha rotulo="Cadeia de certificação">{CADEIA[c.cadeia.situacao] ?? c.cadeia.situacao}</Linha>
          <Linha rotulo="Cadastrado em">
            {fmtDataHora(c.criado_em)}
            {c.enviado_por_equipe ? <span className="block text-xs text-ink-soft">pela equipe Anfitrião</span> : null}
          </Linha>
          {visaoEquipe && (
            <Linha rotulo="Impressão digital (SHA-256)">
              <span className="break-all font-mono text-[11px] leading-snug">{c.impressao_digital_sha256}</span>
            </Linha>
          )}
        </dl>
      )}
    </div>
  );
}
