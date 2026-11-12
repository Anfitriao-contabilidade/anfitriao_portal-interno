import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, FilePlus2, FileText, PlugZap, Search } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, apiPagina, num, type Pagina } from "@/lib/api";
import { listarImoveis, listarUsuarios } from "@/lib/data";
import { fmtBRL } from "@/lib/metrics";
import { fmtData, fmtDocumento } from "@/lib/format";
import { AMBIENTE_LABEL, STATUS_LABEL, type ConfiguracaoNfse, type Indicadores, type NotaNfse, type Prestador } from "@/lib/nfse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Forbidden } from "@/components/ui/Forbidden";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { controlClass } from "@/components/forms/Field";
import { NotaStatusBadge } from "@/components/domain/badges";
import { EmitirNotaForm } from "./EmitirNotaForm";

export const metadata: Metadata = { title: "Notas fiscais" };

const POR_PAGINA = 20;
type Busca = { prestador?: string; status?: string; ambiente?: string; de?: string; ate?: string; q?: string; pagina?: string };

const limpo = (v: string | undefined, re: RegExp) => (v && re.test(v) ? v : undefined);

function href(atual: Busca, muda: Busca) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...atual, ...muda })) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/admin/notas?${s}` : "/admin/notas";
}

export default async function AdminNotasPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const sp = await searchParams;
  const filtros: Busca = {
    prestador: limpo(sp.prestador, /^[a-f0-9]{24}$/),
    status: limpo(sp.status, /^[a-z_]{3,30}$/),
    ambiente: limpo(sp.ambiente, /^(homologacao|producao)$/),
    de: limpo(sp.de, /^\d{4}-\d{2}-\d{2}$/),
    ate: limpo(sp.ate, /^\d{4}-\d{2}-\d{2}$/),
    q: sp.q?.trim().slice(0, 60) || undefined,
  };
  const pagina = Math.max(1, Math.min(5000, Number.parseInt(sp.pagina ?? "1", 10) || 1));
  const query = {
    prestador_id: filtros.prestador,
    status: filtros.status,
    ambiente: filtros.ambiente,
    de: filtros.de,
    ate: filtros.ate,
    busca: filtros.q,
  };

  const [cfg, ind, lista, prestadores, usuarios, imoveisApi] = await apiPagina(() =>
    Promise.all([
      api<ConfiguracaoNfse>("/nfse/configuracao"),
      api<Indicadores>("/nfse/indicadores", { query: { ...query, status: undefined } }),
      api<Pagina<NotaNfse>>("/nfse/notas", { query: { ...query, limit: POR_PAGINA, offset: (pagina - 1) * POR_PAGINA } }),
      api<Pagina<Prestador>>("/nfse/prestadores", { query: { limit: 200 } }),
      listarUsuarios(),
      listarImoveis(),
    ])
  );
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const totalPaginas = Math.max(1, Math.ceil(lista.total / POR_PAGINA));
  const podeEmitir = cfg.permissoes.includes("nfse.emitir");
  const clientes = usuarios.filter((u) => !u.papeis.includes("admin") && u.ativo).map((u) => ({ id: u.id, nome: u.nome }));
  const imoveis = imoveisApi.map((im) => ({
    id: im.id,
    nome: im.nome,
    donos: [im.proprietario_id, ...im.coanfitriao_ids].filter(Boolean) as string[],
  }));

  return (
    <>
      <PageHeader
        eyebrow="Equipe · NFS-e Nacional"
        title="Notas fiscais"
        description="Emissão pelo Sistema Nacional NFS-e com o certificado A1 de cada prestador: a nossa empresa ou um cliente que nos autorizou."
        actions={
          <>
            <ButtonLink href="/admin/sefin" variant="secondary" prefetch={false}>
              <PlugZap className="h-4 w-4" aria-hidden /> Integração SEFIN
            </ButtonLink>
            <ButtonLink href="/admin/notas/prestadores" variant="secondary" prefetch={false}>
              <Building2 className="h-4 w-4" aria-hidden /> Prestadores
            </ButtonLink>
            {podeEmitir && (
              <ButtonLink href="/admin/notas/emitir" prefetch={false}>
                <FilePlus2 className="h-4 w-4" aria-hidden /> Emitir NFS-e
              </ButtonLink>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-3">
        <Alert tone={cfg.ambiente === "producao" ? "warning" : "info"} title={`Ambiente: ${AMBIENTE_LABEL[cfg.ambiente]}`}>
          {cfg.ambiente === "producao"
            ? "As transmissões geram documentos fiscais oficiais."
            : "Produção Restrita: as notas geradas aqui não têm valor fiscal."}{" "}
          {!cfg.habilitado && <strong>Transmissão desabilitada (NFSE_ENABLED=false).</strong>}
          {!podeEmitir && " Sua conta pode consultar, mas não emitir (peça a permissão nfse.emitir)."}
        </Alert>
      </div>

      <section aria-label="Indicadores" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={ind.total} />
        <StatCard label="Autorizadas" value={ind.autorizadas} tone={ind.autorizadas ? "positive" : "default"} />
        <StatCard label="Rejeitadas" value={ind.rejeitadas} tone={ind.rejeitadas ? "negative" : "default"} />
        <StatCard label="Pendentes" value={ind.pendentes} hint="Rascunho, pronta, em envio ou falha" />
        <StatCard
          label="Situação desconhecida"
          value={ind.desconhecidas}
          tone={ind.desconhecidas ? "negative" : "default"}
          icon={ind.desconhecidas ? <AlertTriangle className="h-4 w-4" /> : undefined}
          hint={ind.desconhecidas ? "Consulte antes de qualquer reenvio" : undefined}
        />
        <StatCard label="Canceladas" value={ind.canceladas} />
      </section>

      <Card as="section" className="mb-6">
        <form method="get" action="/admin/notas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6" role="search" aria-label="Filtrar notas">
          <label className="text-sm lg:col-span-2">
            <span className="mb-1 block font-medium text-ink">Buscar</span>
            <input name="q" defaultValue={filtros.q} placeholder="Número, chave de acesso, Id da DPS ou CPF/CNPJ" className={controlClass} maxLength={60} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink">Prestador</span>
            <select name="prestador" defaultValue={filtros.prestador ?? ""} className={controlClass}>
              <option value="">Todos</option>
              {prestadores.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.tipo === "propria" ? "★ " : ""}
                  {p.razao_social}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink">Status</span>
            <select name="status" defaultValue={filtros.status ?? ""} className={controlClass}>
              <option value="">Todos</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink">Ambiente</span>
            <select name="ambiente" defaultValue={filtros.ambiente ?? ""} className={controlClass}>
              <option value="">Todos</option>
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label>
              <span className="mb-1 block font-medium text-ink">De</span>
              <input type="date" name="de" defaultValue={filtros.de} className={controlClass} />
            </label>
            <label>
              <span className="mb-1 block font-medium text-ink">Até</span>
              <input type="date" name="ate" defaultValue={filtros.ate} className={controlClass} />
            </label>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <button type="submit" className={buttonClass("secondary", "md")}>
              <Search className="h-4 w-4" aria-hidden /> Filtrar
            </button>
            <Link href="/admin/notas" prefetch={false} className="text-sm text-ocean hover:underline">
              Limpar filtros
            </Link>
          </div>
        </form>
      </Card>

      <Card as="section" className="p-0 sm:p-0">
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <CardHeader title="Notas" description={`${lista.total} nota(s) · página ${pagina} de ${totalPaginas}`} />
        </div>
        {lista.items.length === 0 ? (
          <div className="p-5 pt-0 sm:p-6 sm:pt-0">
            <EmptyState icon={<FileText className="h-5 w-5" />} title="Nenhuma nota encontrada" description="Ajuste os filtros ou emita uma nova NFS-e." />
          </div>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {lista.items.map((n) => {
              const prest = (n.prestador?.razao_social as string | undefined) ?? (n.fluxo ? "—" : "Anfitrião (Focus NFe)");
              const tom = (n.tomador?.nome as string | undefined) ?? (n.cliente_id ? nomes.get(n.cliente_id) : undefined) ?? "—";
              const numero = n.nfse?.numero ?? n.numero;
              return (
                <li key={n.id}>
                  <Link href={n.provedor === "nfse_nacional" ? `/admin/notas/${n.id}` : "#legado"} prefetch={false} className="block px-5 py-4 hover:bg-paper sm:px-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {prest} <span className="font-normal text-ink-soft">→ {tom}</span>
                        </p>
                        <p className="line-clamp-1 text-sm text-ink-soft">{n.descricao_servico || "Sem descrição"}</p>
                        <p className="mt-1 font-mono text-xs text-ink-soft">
                          {fmtBRL(num(n.valor))} · {fmtData(n.data_competencia ?? n.criado_em)}
                          {numero ? ` · nº ${numero}` : ""}
                          {n.dps?.id ? ` · ${n.dps.id.slice(-20)}` : ""}
                          {n.tomador?.documento ? ` · ${fmtDocumento(String(n.tomador.documento))}` : ""}
                        </p>
                        {(n.status === "rejeitada" || n.status === "situacao_desconhecida" || n.status === "falha_comunicacao") && n.erro_mensagem && (
                          <p className="mt-1 line-clamp-2 text-xs text-danger">{n.erro_mensagem}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
                        <NotaStatusBadge status={n.status} />
                        {n.ambiente && <Badge tone={n.ambiente === "producao" ? "gold" : "neutral"}>{AMBIENTE_LABEL[n.ambiente]}</Badge>}
                        {n.provedor !== "nfse_nacional" && <Badge tone="neutral">Focus NFe</Badge>}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {totalPaginas > 1 && (
          <nav aria-label="Paginação" className="flex items-center justify-between border-t border-line px-5 py-3 text-sm sm:px-6">
            {pagina > 1 ? (
              <Link href={href(filtros, { pagina: String(pagina - 1) })} prefetch={false} className="inline-flex items-center gap-1 text-ocean hover:underline">
                <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
              </Link>
            ) : (
              <span />
            )}
            {pagina < totalPaginas && (
              <Link href={href(filtros, { pagina: String(pagina + 1) })} prefetch={false} className="inline-flex items-center gap-1 text-ocean hover:underline">
                Próxima <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </nav>
        )}
      </Card>

      <details id="legado" className="mt-6 rounded-card border border-line bg-raised p-5 shadow-card sm:p-6">
        <summary className="cursor-pointer font-display text-lg font-semibold text-ink">Emissão via Focus NFe (legado)</summary>
        <p className="mt-2 text-sm text-ink-soft">
          Mantido para notas antigas e rascunhos de comissão. Novas notas devem ser emitidas pelo Sistema Nacional (botão “Emitir NFS-e”).
        </p>
        <div className="mt-4">
          <EmitirNotaForm clientes={clientes} imoveis={imoveis} />
        </div>
      </details>
    </>
  );
}
