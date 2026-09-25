import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { fmtDocumento } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PerfilForm } from "@/app/(cliente)/perfil/PerfilForm";
import { SenhaForm } from "@/app/(cliente)/perfil/SenhaForm";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilAdminPage() {
  const sessao = await requireUser();
  const p = sessao.usuario;

  return (
    <>
      <PageHeader
        eyebrow="Equipe"
        title="Meu perfil"
        description="Seus dados cadastrais e a senha de acesso. Papel de admin, plano e status fiscal não se alteram por aqui."
      />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card as="section">
          <CardHeader title="Dados cadastrais" />
          <PerfilForm
            perfil={{
              nome: p.nome ?? "",
              tipo: p.tipo === "PJ" ? "PJ" : "PF",
              documento: fmtDocumento(p.documento),
              telefone: p.telefone ?? "",
              endereco: p.endereco ?? "",
            }}
          />
        </Card>
        <Card as="section">
          <CardHeader title="Acesso" />
          <p className="flex items-center gap-2 text-sm text-ink">
            <Mail className="h-4 w-4 text-ink-soft" aria-hidden />
            <span className="truncate">{sessao.email}</span>
          </p>
          <p className="mt-3">
            <Badge tone="gold">Equipe Anfitrião</Badge>
          </p>
          <p className="mt-2 flex items-start gap-2 text-xs text-ink-soft">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            O e-mail de acesso não muda neste formulário.
          </p>
          <SenhaForm />
        </Card>
      </div>
    </>
  );
}
