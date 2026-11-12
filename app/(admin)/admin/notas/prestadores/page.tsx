import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, apiPagina, type Pagina } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { fmtDocumento } from "@/lib/format";
import type { ConfiguracaoNfse, Prestador } from "@/lib/nfse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Forbidden } from "@/components/ui/Forbidden";
import { Alert } from "@/components/ui/Alert";
import { NovoPrestadorForm } from "./PrestadorForms";

export const metadata: Metadata = { title: "Prestadores NFS-e" };

export default async function PrestadoresPage() {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const [cfg, lista, usuarios] = await apiPagina(() =>
    Promise.all([
      api<ConfiguracaoNfse>("/nfse/configuracao"),
      api<Pagina<Prestador>>("/nfse/prestadores", { query: { limit: 200 } }),
      listarUsuarios(),
    ])
  );
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const clientes = usuarios
    .filter((u) => u.ativo && (u.papeis.includes("proprietario") || u.papeis.includes("coanfitriao")))
    .map((u) => ({ id: u.id, nome: u.nome, documento: u.documento }));
  const temPropria = lista.items.some((p) => p.tipo === "propria");
  const podeConfigurar = cfg.permissoes.includes("nfse.configurar");

  return (
    <>
      <Link href="/admin/notas" prefetch={false} className="mb-3 inline-flex items-center gap-1 text-sm text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Notas fiscais
      </Link>
      <PageHeader
        eyebrow="NFS-e Nacional"
        title="Prestadores fiscais"
        description="Quem pode aparecer como prestador nas DPS: a nossa empresa e os clientes que nos autorizaram a emitir em nome deles."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card as="section" className="p-0 sm:p-0">
          <div className="p-5 pb-0 sm:p-6 sm:pb-0">
            <CardHeader title="Cadastrados" />
          </div>
          {lista.items.length === 0 ? (
            <div className="p-5 pt-0 sm:p-6 sm:pt-0">
              <EmptyState icon={<Building2 className="h-5 w-5" />} title="Nenhum prestador" description="Comece pela própria empresa." />
            </div>
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {lista.items.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/notas/prestadores/${p.id}`} prefetch={false} className="block px-5 py-4 hover:bg-paper sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{p.razao_social}</p>
                        <p className="font-mono text-xs text-ink-soft">
                          {fmtDocumento(p.documento)} · IBGE {p.codigo_municipio} · série {p.serie_dps}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {p.tipo === "propria" ? "Nossa empresa" : `Cliente: ${nomes.get(p.usuario_uid ?? "") ?? p.usuario_uid}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {p.apto_para_emissao ? <Badge tone="success" dot>Apto</Badge> : <Badge tone="warning" dot>{p.pendencias.length} pendência(s)</Badge>}
                        {!p.ativo && <Badge tone="neutral">Inativo</Badge>}
                        {p.ambientes_habilitados.includes("producao") && <Badge tone="gold">Produção</Badge>}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card as="section">
          <CardHeader title="Novo prestador" />
          {podeConfigurar ? (
            <NovoPrestadorForm op={cfg.opcoes} clientes={clientes} temPropria={temPropria} />
          ) : (
            <Alert tone="info">Sua conta não tem a permissão nfse.configurar.</Alert>
          )}
        </Card>
      </div>
    </>
  );
}
