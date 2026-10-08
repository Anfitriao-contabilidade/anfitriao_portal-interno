import type { Metadata } from "next";
import { CreditCard, ExternalLink, Repeat } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { api, apiPagina, apiTodos, num } from "@/lib/api";
import { fmtBRL } from "@/lib/metrics";
import { fmtData } from "@/lib/format";
import { safeExternalUrl } from "@/lib/security/url";
import type { Assinatura, Cobranca, PlanoVitrine } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { AssinaturaStatusBadge, CobrancaStatusBadge } from "@/components/domain/badges";
import { AssinarPlanoForm } from "./AssinarPlanoForm";

export const metadata: Metadata = { title: "Pagamentos" };

const CICLO: Record<string, string> = { mensal: "mês", trimestral: "trimestre", semestral: "semestre", anual: "ano" };
const FORMA: Record<string, string> = { indefinida: "Pix, boleto ou cartão", pix: "Pix", boleto: "Boleto", cartao: "Cartão de crédito" };

export default async function PagamentosPage() {
  const sessao = await requireUser();
  const [cobrancas, assinaturas, vitrine] = await apiPagina(() =>
    Promise.all([
      apiTodos<Cobranca>("/pagamentos/cobrancas", { cliente_id: sessao.id }, 200),
      apiTodos<Assinatura>("/pagamentos/assinaturas", { cliente_id: sessao.id }, 50),
      api<{ planos: PlanoVitrine[] }>("/planos/vitrine").catch(() => ({ planos: [] as PlanoVitrine[] })),
    ])
  );

  const vigente = assinaturas.find((a) => a.status === "ativa" || a.status === "criando");
  const aPagar = cobrancas.filter((c) => c.status === "pendente" || c.status === "vencida");
  const historico = cobrancas.filter((c) => !(c.status === "pendente" || c.status === "vencida"));
  const semDocumento = !sessao.usuario.documento;

  return (
    <>
      <PageHeader
        eyebrow="Operação & financeiro"
        title="Pagamentos"
        description="Sua assinatura com a Anfitrião e as faturas a pagar. O pagamento é feito na página segura do Asaas, por Pix, boleto ou cartão."
      />

      <Card as="section" className="mb-6">
        <CardHeader title="Seu plano" />
        {vigente ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{vigente.plano_titulo ?? "Plano"}</p>
              <p className="font-mono text-sm text-ink-soft">
                {fmtBRL(num(vigente.valor))}/{CICLO[vigente.ciclo] ?? vigente.ciclo} · {FORMA[vigente.forma] ?? vigente.forma}
                {vigente.proximo_vencimento ? ` · próxima fatura em ${fmtData(vigente.proximo_vencimento)}` : ""}
              </p>
            </div>
            <AssinaturaStatusBadge status={vigente.status} />
          </div>
        ) : semDocumento ? (
          <Alert tone="warning" title="Complete seu cadastro">
            Para assinar um plano, informe seu CPF ou CNPJ no perfil.{" "}
            <ButtonLink href="/perfil" variant="secondary" size="sm" className="ml-1">
              Ir para o perfil
            </ButtonLink>
          </Alert>
        ) : vitrine.planos.length === 0 ? (
          <EmptyState icon={<Repeat className="h-5 w-5" />} title="Nenhum plano disponível no momento" description="Fale com a equipe Anfitrião." />
        ) : (
          <AssinarPlanoForm
            planos={vitrine.planos.map((p) => ({
              id: p.id,
              titulo: p.titulo,
              descricao: p.descricao,
              preco: fmtBRL(num(p.preco_atual)),
              beneficios: p.beneficios,
              destaque: p.mais_escolhido,
            }))}
          />
        )}
      </Card>

      <Card as="section" className="mb-6 p-0 sm:p-0">
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardHeader title="A pagar" />
        </div>
        {aPagar.length === 0 ? (
          <div className="p-5 pt-0 sm:p-6 sm:pt-0">
            <EmptyState icon={<CreditCard className="h-5 w-5" />} title="Nenhuma fatura em aberto" />
          </div>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {aPagar.map((c) => (
              <LinhaCobranca key={c.id} c={c} pagar />
            ))}
          </ul>
        )}
      </Card>

      {historico.length > 0 && (
        <Card as="section" className="p-0 sm:p-0">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardHeader title="Histórico" />
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {historico.map((c) => (
              <LinhaCobranca key={c.id} c={c} />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function LinhaCobranca({ c, pagar = false }: { c: Cobranca; pagar?: boolean }) {
  const fatura = safeExternalUrl(c.url_fatura);
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <p className="font-medium text-ink">{c.descricao ?? (c.origem === "assinatura" ? "Mensalidade do plano" : "Cobrança")}</p>
        <p className="mt-1 font-mono text-xs text-ink-soft">
          Vence {fmtData(c.vencimento)}
          {c.pago_em ? ` · pago em ${fmtData(c.pago_em)}` : ""}
          {c.numero_fatura ? ` · fatura ${c.numero_fatura}` : ""}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className="font-mono text-sm font-medium tabular-nums">{fmtBRL(num(c.valor))}</span>
        <CobrancaStatusBadge status={c.status} vencimento={c.vencimento} />
        {fatura &&
          (pagar ? (
            <a href={fatura} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "sm")}>
              Pagar <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">(abre a fatura do Asaas em nova aba)</span>
            </a>
          ) : (
            <a href={fatura} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-ocean hover:bg-ocean-50">
              Comprovante <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          ))}
      </div>
    </li>
  );
}
