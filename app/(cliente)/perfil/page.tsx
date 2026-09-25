import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { fmtDocumento } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatusFiscalBadge } from "@/components/domain/badges";
import { PerfilForm } from "./PerfilForm";
import { SenhaForm } from "./SenhaForm";

export const metadata: Metadata = { title: "Perfil" };

const ATUACAO: Record<string, { label: string; desc: string }> = {
  proprietario: { label: "Proprietário", desc: "Você administra apenas o(s) imóvel(is) que são seus." },
  coanfitriao: {
    label: "Co-Anfitrião",
    desc: "Você administra imóveis de terceiros — a comissão de gestão em Financeiro é a referência para a sua nota fiscal de serviço.",
  },
  ambos: {
    label: "Proprietário + Co-Anfitrião",
    desc: "Você tem imóvel(is) próprio(s) e também administra imóveis de terceiros.",
  },
};

export default async function PerfilPage() {
  const sessao = await requireUser();
  const p = sessao.usuario; // GET /me já resolvido por requireUser (cache da requisição)
  const perfilAtuacao =
    sessao.isProprietario && sessao.isCoanfitriao ? "ambos" : sessao.isCoanfitriao ? "coanfitriao" : "proprietario";
  const atuacao = sessao.isAdmin
    ? { label: "Equipe Anfitrião", desc: "Acesso de administração do portal." }
    : ATUACAO[perfilAtuacao];

  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        title="Perfil"
        description="Mantenha seus dados cadastrais atualizados. Plano, perfil de atuação e status fiscal são definidos pela equipe da Anfitrião."
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card as="section">
          <CardHeader title="Dados cadastrais" />
          <PerfilForm
            perfil={{
              nome: p?.nome ?? "",
              tipo: p?.tipo === "PJ" ? "PJ" : "PF",
              documento: fmtDocumento(p?.documento),
              telefone: p?.telefone ?? "",
              endereco: p?.endereco ?? "",
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card as="section">
            <CardHeader title="Seu cadastro na Anfitrião" as="h2" />
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Perfil de atuação</dt>
                <dd className="mt-1">
                  <Badge tone="gold">{atuacao.label}</Badge>
                  <p className="mt-1.5 text-ink-soft">{atuacao.desc}</p>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Plano</dt>
                <dd className="font-medium text-ink">{p?.plano || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-xs uppercase tracking-wide text-ink-soft">Status fiscal</dt>
                <dd>
                  <StatusFiscalBadge status={p?.status_fiscal} />
                </dd>
              </div>
            </dl>
            <p className="mt-4 border-t border-line pt-4 text-xs text-ink-soft">
              Algo incorreto aqui? Fale com o seu contador para ajustar.
            </p>
          </Card>

          <Card as="section">
            <CardHeader title="Acesso e segurança" />
            <p className="flex items-center gap-2 text-sm text-ink">
              <Mail className="h-4 w-4 text-ink-soft" aria-hidden />
              <span className="truncate">{sessao.email}</span>
            </p>
            <p className="mt-2 flex items-start gap-2 text-xs text-ink-soft">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />O e-mail de acesso só pode ser alterado pela
              equipe, por segurança.
            </p>
            <SenhaForm />
          </Card>
        </div>
      </div>
    </>
  );
}
