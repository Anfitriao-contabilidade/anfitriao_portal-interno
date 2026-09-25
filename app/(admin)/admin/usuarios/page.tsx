import type { Metadata } from "next";
import { getSessaoAdmin } from "@/lib/auth";
import { listarUsuarios } from "@/lib/data";
import { fmtDocumento } from "@/lib/format";
import type { Papel } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { NovoUsuarioForm } from "./NovoUsuarioForm";
import { UsuarioForm } from "./UsuarioForm";

export const metadata: Metadata = { title: "Usuários" };

const FILTROS = [
  { value: "", label: "Todos" },
  { value: "proprietario", label: "Proprietários" },
  { value: "coanfitriao", label: "Coanfitriões" },
  { value: "admin", label: "Colaboradores" },
];

function papelDe(papeis: Papel[]) {
  if (papeis.includes("admin")) return "admin";
  if (papeis.includes("proprietario") && papeis.includes("coanfitriao")) return "ambos";
  if (papeis.includes("coanfitriao")) return "coanfitriao";
  return "proprietario";
}

const ROTULO: Record<string, string> = {
  admin: "Colaborador",
  ambos: "Proprietário + coanfitrião",
  coanfitriao: "Coanfitrião",
  proprietario: "Proprietário",
};

export default async function UsuariosPage({ searchParams }: { searchParams: Promise<{ papel?: string; q?: string }> }) {
  const admin = await getSessaoAdmin();
  const sp = await searchParams;
  const papel = FILTROS.some((f) => f.value === sp.papel) ? (sp.papel ?? "") : "";
  const busca = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const usuarios = admin ? await listarUsuarios({ ...(papel ? { papel } : {}), ...(busca ? { busca } : {}) }) : [];

  return (
    <>
      <PageHeader
        eyebrow="Equipe"
        title="Usuários"
        description="Crie clientes e colaboradores. A senha não fica no painel: o sistema devolve um link para a pessoa definir a dela."
      />
      <Card className="mb-6">
        <CardHeader title="Novo usuário" />
        <NovoUsuarioForm />
      </Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          ariaLabel="Filtrar por papel"
          active={papel}
          items={FILTROS.map((f) => ({
            value: f.value,
            label: f.label,
            href: f.value ? `/admin/usuarios?papel=${f.value}` : "/admin/usuarios",
          }))}
        />
        <form action="/admin/usuarios" className="flex gap-2">
          {papel && <input type="hidden" name="papel" value={papel} />}
          <input name="q" defaultValue={busca} placeholder="Nome ou e-mail" className="min-h-9 rounded-lg border border-line bg-raised px-3 text-sm" />
          <button type="submit" className="min-h-9 rounded-lg bg-ocean px-3 text-sm font-medium text-white">Buscar</button>
        </form>
      </div>
      {usuarios.length === 0 ? (
        <EmptyState title="Nenhum usuário neste filtro" />
      ) : (
        <ul className="flex flex-col gap-3">
          {usuarios.map((u) => {
            const papelAtual = papelDe(u.papeis);
            return (
              <li key={u.id}>
                <details className="rounded-card border border-line bg-raised px-4 py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{u.nome}</span>
                      <span className="block truncate text-xs text-ink-soft">{u.email}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={papelAtual === "admin" ? "gold" : "info"}>{ROTULO[papelAtual]}</Badge>
                      <Badge tone={u.ativo ? "success" : "danger"}>{u.ativo ? "Ativo" : "Inativo"}</Badge>
                    </span>
                  </summary>
                  <div className="mt-4 border-t border-line pt-4">
                    <UsuarioForm
                      u={{
                        id: u.id,
                        nome: u.nome,
                        tipo: u.tipo,
                        documento: fmtDocumento(u.documento),
                        telefone: u.telefone ?? "",
                        endereco: u.endereco ?? "",
                        plano: u.plano ?? "",
                        status_fiscal: u.status_fiscal,
                        papel: papelAtual,
                        ativo: u.ativo,
                        eu: u.id === admin?.id,
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
