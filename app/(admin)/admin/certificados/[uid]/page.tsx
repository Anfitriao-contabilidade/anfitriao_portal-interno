import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, ApiError, apiPagina } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { fmtData, fmtDataHora, fmtDocumento } from "@/lib/format";
import { uid as uidSchema } from "@/lib/validation";
import type { CertificadoStatus, HistoricoCertificado } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Forbidden } from "@/components/ui/Forbidden";
import { CertificadoSecao } from "@/components/domain/certificado/CertificadoSecao";
import { enviarCertificadoUsuario, excluirCertificadoUsuario } from "../actions";

export const metadata: Metadata = { title: "Certificado do usuário" };

const ACOES: Record<string, string> = {
  "certificado.cadastrar": "Cadastro",
  "certificado.substituir": "Substituição",
  "certificado.excluir": "Exclusão",
  "certificado.rejeitado": "Envio rejeitado",
  "certificado.uso": "Uso em operação fiscal",
  "certificado.uso_negado": "Uso bloqueado",
  "certificado.uso_falhou": "Falha no uso",
  "certificado.expurgar": "Material destruído (retenção)",
  "certificado.alerta.certificado_vencimento": "Alerta de vencimento",
  "certificado.alerta.certificado_revogado": "Alerta de revogação",
};

function detalhes(d: Record<string, unknown> | null) {
  if (!d) return "—";
  const partes: string[] = [];
  if (d.motivo) partes.push(`motivo: ${String(d.motivo)}`);
  if (d.finalidade) partes.push(`finalidade: ${String(d.finalidade)}`);
  if (d.versao) partes.push(`versão ${String(d.versao)}`);
  if (d.numero_serie) partes.push(`série ${String(d.numero_serie)}`);
  if (d.por_equipe === true) partes.push("pela equipe");
  if (d.marco !== undefined) partes.push(`marco ${String(d.marco)} dia(s)`);
  return partes.join(" · ") || "—";
}

export default async function CertificadoUsuarioPage({ params }: { params: Promise<{ uid: string }> }) {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const { uid: bruto } = await params;
  const parsed = uidSchema.safeParse(bruto);
  if (!parsed.success) notFound();
  const uid = parsed.data;

  let status: CertificadoStatus | null = null;
  let indisponivel: string | null = null;
  let historico: HistoricoCertificado | null = null;
  try {
    [status, historico] = await apiPagina(() =>
      Promise.all([
        api<CertificadoStatus>(`/certificados/usuarios/${uid}`),
        api<HistoricoCertificado>(`/certificados/usuarios/${uid}/historico`),
      ])
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    if (!(e instanceof ApiError) || e.status < 422) throw e;
    indisponivel = e.message;
  }

  const usuarios = await listarUsuarios();
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const titular = usuarios.find((u) => u.id === uid);

  return (
    <>
      <Link href="/admin/certificados" prefetch={false} className="mb-3 inline-flex items-center gap-1 text-sm text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Certificados digitais
      </Link>
      <PageHeader
        eyebrow="Certificado digital"
        title={titular?.nome ?? uid}
        description={
          titular ? `${titular.email}${titular.documento ? ` · ${fmtDocumento(titular.documento)}` : ""}` : undefined
        }
      />

      <CertificadoSecao
        status={status}
        indisponivel={indisponivel}
        enviar={enviarCertificadoUsuario}
        excluir={excluirCertificadoUsuario}
        uid={uid}
        visaoEquipe
      />

      {historico && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card as="section" className="overflow-x-auto">
            <CardHeader title="Versões" description="Metadados preservados para histórico; o material das versões antigas é destruído." />
            {historico.versoes.length === 0 ? (
              <EmptyState title="Nenhum certificado enviado" />
            ) : (
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line font-mono text-[.68rem] uppercase tracking-wide text-ink-soft">
                    <th className="py-2 pr-3 font-medium">Versão</th>
                    <th className="py-2 pr-3 font-medium">Enviado</th>
                    <th className="py-2 pr-3 font-medium">Válido até</th>
                    <th className="py-2 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.versoes.map((v) => (
                    <tr key={v.id} className="border-b border-line/70 align-top">
                      <td className="py-3 pr-3 font-mono text-xs">
                        v{v.versao}
                        <span className="block text-ink-soft">{v.numero_serie.slice(0, 16)}</span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-ink-soft">
                        {fmtDataHora(v.criado_em)}
                        <span className="block">
                          {v.enviado_por_equipe ? `equipe (${nomes.get(v.enviado_por ?? "") ?? v.enviado_por})` : "titular"}
                        </span>
                      </td>
                      <td className="py-3 pr-3">{fmtData(v.valido_ate)}</td>
                      <td className="py-3">
                        {v.ativo ? (
                          <Badge tone="success">Ativo</Badge>
                        ) : v.excluido_em ? (
                          <Badge tone="danger">Excluído {fmtData(v.excluido_em)}</Badge>
                        ) : v.substituido_em ? (
                          <Badge tone="neutral">Substituído {fmtData(v.substituido_em)}</Badge>
                        ) : (
                          <Badge tone="neutral">Inativo</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card as="section" className="overflow-x-auto">
            <CardHeader title="Histórico de operações" description="Trilha de auditoria (sem senhas ou dados criptográficos)." />
            {historico.eventos.length === 0 ? (
              <EmptyState title="Nenhuma operação registrada" />
            ) : (
              <ul className="space-y-3 text-sm">
                {historico.eventos.map((ev, i) => (
                  <li key={`${ev.criado_em}-${i}`} className="border-b border-line/70 pb-3 last:border-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-ink">{ACOES[ev.acao] ?? ev.acao}</span>
                      <span className="font-mono text-xs text-ink-soft">{fmtDataHora(ev.criado_em)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {ev.ator_id ? (nomes.get(ev.ator_id) ?? ev.ator_id) : "sistema"} · {detalhes(ev.detalhes)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
