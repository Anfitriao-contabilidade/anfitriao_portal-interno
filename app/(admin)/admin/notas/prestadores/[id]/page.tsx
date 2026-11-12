import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, ApiError, apiPagina } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { fmtData, fmtDataHora, fmtDocumento } from "@/lib/format";
import type { ConfiguracaoNfse, Prestador } from "@/lib/nfse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Forbidden } from "@/components/ui/Forbidden";
import { AutorizacaoForm, ConvenioButton, EditarPrestadorForm, RevogarAutorizacaoButton } from "../PrestadorForms";

export const metadata: Metadata = { title: "Prestador NFS-e" };

const DOC: Record<string, string> = {
  procuracao: "Procuração",
  contrato_prestacao_servicos: "Contrato de prestação de serviços",
  termo_autorizacao: "Termo de autorização",
};

export default async function PrestadorPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();
  let p: Prestador;
  let cfg: ConfiguracaoNfse;
  try {
    [p, cfg] = await apiPagina(() => Promise.all([api<Prestador>(`/nfse/prestadores/${id}`), api<ConfiguracaoNfse>("/nfse/configuracao")]));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const nomes = new Map((await listarUsuarios()).map((u) => [u.id, u.nome]));
  const configurar = cfg.permissoes.includes("nfse.configurar");
  const cert = p.certificado;
  const aut = p.autorizacao;

  return (
    <>
      <Link href="/admin/notas/prestadores" prefetch={false} className="mb-3 inline-flex items-center gap-1 text-sm text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Prestadores
      </Link>
      <PageHeader
        eyebrow={p.tipo === "propria" ? "Nossa empresa" : `Cliente: ${nomes.get(p.usuario_uid ?? "") ?? p.usuario_uid}`}
        title={p.razao_social}
        description={`${fmtDocumento(p.documento)} · município ${p.municipio_nome ?? ""} (${p.codigo_municipio})`}
        actions={p.apto_para_emissao ? <Badge tone="success" dot>Apto para emitir</Badge> : <Badge tone="warning" dot>Com pendências</Badge>}
      />
      {p.pendencias.length > 0 && (
        <Alert tone="warning" title="Pendências para emissão" className="mb-6">
          <ul className="list-disc pl-4">
            {p.pendencias.map((x) => (
              <li key={x.campo + x.mensagem}>{x.mensagem}</li>
            ))}
          </ul>
        </Alert>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card as="section">
          <CardHeader title="Dados fiscais" />
          {configurar ? <EditarPrestadorForm p={p} op={cfg.opcoes} /> : <Alert tone="info">Sua conta não tem a permissão nfse.configurar.</Alert>}
        </Card>
        <div className="space-y-6">
          <Card as="section">
            <CardHeader
              title="Certificado digital A1"
              description="Usado para assinar a DPS e na conexão (TLS mútuo). Deve ser do mesmo CPF/CNPJ do prestador."
              action={
                cert && (
                  <ButtonLink href={`/admin/certificados/${cert.titular_uid}`} variant="secondary" size="sm" prefetch={false}>
                    Gerenciar
                  </ButtonLink>
                )
              }
            />
            {cert?.cadastrado ? (
              <dl className="space-y-1 text-sm">
                <p className={`flex items-center gap-2 font-medium ${cert.apto_para_emissao ? "text-ok" : "text-danger"}`}>
                  {cert.apto_para_emissao ? <ShieldCheck className="h-4 w-4" aria-hidden /> : <ShieldAlert className="h-4 w-4" aria-hidden />}
                  {cert.apto_para_emissao ? "Apto para emissão" : cert.motivo}
                </p>
                <p>Titular: {cert.titular_nome}</p>
                <p>CPF/CNPJ confere com o prestador: {cert.titular_documento_confere ? "sim" : "não"}</p>
                <p>Válido até: {fmtData(cert.valido_ate)}</p>
                <p>Última verificação: {fmtDataHora(cert.ultima_verificacao_em)}</p>
              </dl>
            ) : (
              <Alert tone="warning">{cert?.motivo ?? "Nenhum certificado cadastrado."}</Alert>
            )}
          </Card>
          {p.tipo === "cliente" && (
            <Card as="section">
              <CardHeader title="Autorização de emissão" description="Documento em que o cliente autoriza a Anfitrião a emitir NFS-e em nome dele." />
              {aut && aut.situacao !== "ausente" && (
                <div className="mb-4 space-y-1 text-sm">
                  <Badge tone={aut.situacao === "vigente" ? "success" : "warning"} dot>
                    {aut.situacao}
                  </Badge>
                  <p>
                    {DOC[aut.tipo_documento ?? ""] ?? aut.tipo_documento} · {aut.referencia}
                  </p>
                  <p>
                    Vigência: {fmtData(aut.valido_de)} {aut.valido_ate ? `a ${fmtData(aut.valido_ate)}` : "(sem término)"}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Registrada por {nomes.get(aut.registrada_por ?? "") ?? aut.registrada_por} em {fmtDataHora(aut.registrada_em)}
                  </p>
                  {aut.situacao === "vigente" && configurar && <RevogarAutorizacaoButton id={p.id} />}
                </div>
              )}
              {configurar && (aut?.situacao !== "vigente" ? <AutorizacaoForm id={p.id} /> : null)}
              <p className="mt-3 text-xs text-ink-soft">
                Além desta autorização interna, o Sistema Nacional exige que o certificado usado seja do próprio prestador. Procurações eletrônicas
                para terceiros não são usadas por esta integração.
              </p>
            </Card>
          )}
          {configurar && (
            <Card as="section">
              <CardHeader title="Município no Sistema Nacional" description="Consulta informativa aos parâmetros municipais (usa o certificado do prestador)." />
              <ConvenioButton id={p.id} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
