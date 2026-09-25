import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search, UserCheck, Users } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, apiPagina } from "@/lib/api";
import { listarImoveis, listarUsuarios } from "@/lib/data";
import { fmtData, fmtDocumento } from "@/lib/format";
import type { Checklist, Imovel, Papel } from "@/lib/tipos";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Forbidden } from "@/components/ui/Forbidden";
import { NotaChecklistBadge, StatusFiscalBadge } from "@/components/domain/badges";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ClienteForm } from "./ClienteForm";
import { AprovacaoForm } from "./AprovacaoForm";

export const metadata: Metadata = { title: "Clientes" };

const ATUACAO: Record<string, string> = { proprietario: "Proprietário", coanfitriao: "Co-Anfitrião", ambos: "Proprietário + Co-Anfitrião" };
type Filtro = "todos" | "propria" | "terceiros";

function perfilDe(papeis: Papel[]) {
  const p = papeis.includes("proprietario");
  const c = papeis.includes("coanfitriao");
  return p && c ? "ambos" : c ? "coanfitriao" : "proprietario";
}

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ atuacao?: string; q?: string; cadastro?: string }> }) {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;

  const sp = await searchParams;
  const filtro: Filtro = sp.atuacao === "propria" || sp.atuacao === "terceiros" ? sp.atuacao : "todos";
  const busca = typeof sp.q === "string" ? sp.q.trim().slice(0, 80).toLowerCase() : "";

  const [usuarios, imoveis, checklists] = await apiPagina(() =>
    Promise.all([listarUsuarios(), listarImoveis(), api<Checklist[]>("/checklist")])
  );

  // "Clientes" = contas que não são da equipe. Pendentes de aprovação ficam num bloco à parte.
  const naoEquipe = usuarios.filter((u) => !u.papeis.includes("admin"));
  const pendentes = naoEquipe.filter((u) => u.situacao_cadastro === "pendente");
  const todos = naoEquipe
    .filter((u) => u.situacao_cadastro !== "pendente")
    .map((u) => ({ ...u, perfil_atuacao: perfilDe(u.papeis) }));
  const checklistPorImovel = new Map(checklists.map((c) => [c.imovel_id, c]));
  const imoveisPorCliente = new Map<string, Imovel[]>();
  imoveis.forEach((im) => {
    for (const dono of [im.proprietario_id, ...im.coanfitriao_ids].filter(Boolean) as string[]) {
      imoveisPorCliente.set(dono, [...(imoveisPorCliente.get(dono) ?? []), im]);
    }
  });

  const contaPropria = (p: string | null) => (p ?? "proprietario") !== "coanfitriao";
  const terceiros = (p: string | null) => p === "coanfitriao" || p === "ambos";

  const filtrados = todos.filter((c) => {
    if (filtro === "propria" && !contaPropria(c.perfil_atuacao)) return false;
    if (filtro === "terceiros" && !terceiros(c.perfil_atuacao)) return false;
    if (busca && !`${c.nome} ${c.documento ?? ""}`.toLowerCase().includes(busca)) return false;
    return true;
  });

  const chips: { key: Filtro; label: string; n: number }[] = [
    { key: "todos", label: "Todos", n: todos.length },
    { key: "propria", label: "Conta própria", n: todos.filter((c) => contaPropria(c.perfil_atuacao)).length },
    { key: "terceiros", label: "Administra p/ terceiros", n: todos.filter((c) => terceiros(c.perfil_atuacao)).length },
  ];

  return (
    <>
      <PageHeader eyebrow="Equipe" title="Clientes" description="Carteira de clientes da Anfitrião. CNAE, sócios e documentos completos continuam no Painel Interno." />

      {sp.cadastro === "aprovado" && (
        <Alert tone="success" role="status" className="mb-6">
          Cadastro aprovado — o cliente já pode entrar no portal.
        </Alert>
      )}
      {sp.cadastro === "recusado" && (
        <Alert tone="info" role="status" className="mb-6">
          Cadastro recusado. A pessoa verá o aviso ao tentar entrar.
        </Alert>
      )}

      {pendentes.length > 0 && (
        <Card as="section" className="mb-6 border-gold/40">
          <CardHeader
            title={`Cadastros aguardando aprovação (${pendentes.length})`}
            description="Contas criadas pelo cadastro aberto do portal. O acesso só é liberado depois da aprovação."
          />
          <ul className="divide-y divide-line">
            {pendentes.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-ink">
                    <UserCheck className="h-4 w-4 text-gold" aria-hidden /> {u.nome}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {u.email}
                    {u.email_verificado ? " (e-mail confirmado)" : " (e-mail não confirmado)"}
                    {u.documento ? ` · ${u.tipo} ${fmtDocumento(u.documento)}` : ` · ${u.tipo}`}
                    {u.telefone ? ` · ${u.telefone}` : ""}
                  </p>
                  <p className="font-mono text-xs text-ink-soft">Cadastro em {fmtData(u.criado_em)}</p>
                </div>
                <AprovacaoForm id={u.id} perfil={perfilDe(u.papeis)} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtrar por atuação" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {chips.map((c) => (
            <Link
              key={c.key}
              href={{ pathname: "/admin/clientes", query: { atuacao: c.key, ...(busca ? { q: busca } : {}) } }}
              aria-current={filtro === c.key ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
                filtro === c.key ? "border-ocean bg-ocean text-white" : "border-line bg-white text-ink-soft hover:border-ocean/30 hover:text-ocean"
              )}
            >
              {c.label}
              <span className={cn("font-mono text-xs", filtro === c.key ? "text-white/80" : "text-ink-soft")}>{c.n}</span>
            </Link>
          ))}
        </nav>
        <form role="search" className="relative w-full lg:w-72" action="/admin/clientes">
          <input type="hidden" name="atuacao" value={filtro} />
          <label htmlFor="busca-cliente" className="sr-only">Buscar cliente</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            id="busca-cliente"
            name="q"
            type="search"
            defaultValue={busca}
            maxLength={80}
            placeholder="Buscar por nome ou documento"
            className="block min-h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
          />
        </form>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icon={<Users className="h-5 w-5" />} title="Nenhum cliente encontrado" description="Ajuste o filtro ou a busca." />
      ) : (
        <ul className="space-y-3">
          {filtrados.map((c) => {
            const ims = imoveisPorCliente.get(c.id) ?? [];
            return (
              <li key={c.id} className="rounded-2xl border border-line bg-white shadow-card">
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-ink">{c.nome}</p>
                    <p className="text-sm text-ink-soft">
                      {c.tipo}
                      {c.documento ? ` · ${fmtDocumento(c.documento)}` : ""}
                      {c.telefone ? ` · ${c.telefone}` : ""}
                    </p>
                    {ims.length === 0 ? (
                      <p className="mt-2 text-xs text-ink-soft">Nenhum imóvel cadastrado</p>
                    ) : (
                      <ul className="mt-3 flex flex-col gap-1.5">
                        {ims.map((im) => {
                          const ck = checklistPorImovel.get(im.id);
                          return (
                            <li key={im.id} className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-ink">
                                {im.nome}
                                {im.proprietario_id !== c.id && <span className="text-ink-soft"> (co-anfitrião)</span>}
                              </span>
                              <NotaChecklistBadge nota={ck?.nota ?? 0} avaliado={(ck?.itens.length ?? 0) > 0} />
                              <Link href={`/checklist#imovel-${im.id}`} className="font-medium text-ocean hover:underline">
                                Checklist
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {!c.ativo && <Badge tone="danger">{c.situacao_cadastro === "recusado" ? "Recusado" : "Inativo"}</Badge>}
                    <Badge tone="gold">{ATUACAO[c.perfil_atuacao ?? "proprietario"] ?? "Proprietário"}</Badge>
                    <StatusFiscalBadge status={c.status_fiscal} />
                  </div>
                </div>
                <details className="group border-t border-line">
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between px-5 text-sm font-medium text-ocean hover:bg-paper/60 sm:px-6">
                    Editar cadastro
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-line p-5 sm:p-6">
                    <ClienteForm
                      c={{
                        id: c.id,
                        nome: c.nome ?? "",
                        tipo: c.tipo ?? "PF",
                        documento: fmtDocumento(c.documento),
                        telefone: c.telefone ?? "",
                        endereco: c.endereco ?? "",
                        plano: c.plano ?? "",
                        status_fiscal: c.status_fiscal ?? "regular",
                        perfil_atuacao: c.perfil_atuacao ?? "proprietario",
                        ativo: c.ativo,
                      }}
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
