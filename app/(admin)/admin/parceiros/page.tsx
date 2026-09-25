import type { Metadata } from "next";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { NovoParceiroForm, ParceiroForm } from "./ParceiroForm";

export const metadata: Metadata = { title: "Parceiros" };

type Parceiro = {
  id: string;
  nome: string;
  especialidade: string;
  telefone: string | null;
  email: string | null;
  observacao: string | null;
  ativo: boolean;
};

const FILTROS = [
  { value: "", label: "Todos" },
  { value: "limpeza", label: "Limpeza" },
  { value: "lavanderia", label: "Lavanderia" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outro", label: "Outro" },
];

const ROTULO: Record<string, string> = {
  limpeza: "Limpeza",
  lavanderia: "Lavanderia",
  manutencao: "Manutenção",
  outro: "Outro",
};

export default async function ParceirosPage({ searchParams }: { searchParams: Promise<{ especialidade?: string }> }) {
  const sp = await searchParams;
  const especialidade = FILTROS.some((f) => f.value === sp.especialidade) ? (sp.especialidade ?? "") : "";
  const itens = await api<Parceiro[]>("/parceiros", { query: { especialidade: especialidade || undefined } });

  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        title="Parceiros"
        description="Prestadores de serviço da operação. Este cadastro não cria login no portal."
      />
      <Card className="mb-6">
        <CardHeader title="Novo parceiro" />
        <NovoParceiroForm />
      </Card>
      <FilterChips
        ariaLabel="Filtrar por especialidade"
        active={especialidade}
        items={FILTROS.map((f) => ({
          value: f.value,
          label: f.label,
          href: f.value ? `/admin/parceiros?especialidade=${f.value}` : "/admin/parceiros",
        }))}
      />
      {itens.length === 0 ? (
        <EmptyState title="Nenhum parceiro neste filtro" />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {itens.map((p) => (
            <li key={p.id}>
              <details className="rounded-card border border-line bg-raised px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span>
                    <span className="block font-medium text-ink">{p.nome}</span>
                    <span className="block text-xs text-ink-soft">{p.telefone || p.email || "Sem contato"}</span>
                  </span>
                  <span className="flex gap-2">
                    <Badge tone="info">{ROTULO[p.especialidade] ?? p.especialidade}</Badge>
                    <Badge tone={p.ativo ? "success" : "neutral"}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
                  </span>
                </summary>
                <div className="mt-4 border-t border-line pt-4">
                  <ParceiroForm
                    p={{
                      id: p.id,
                      nome: p.nome,
                      especialidade: p.especialidade,
                      telefone: p.telefone ?? "",
                      email: p.email ?? "",
                      observacao: p.observacao ?? "",
                      ativo: p.ativo,
                    }}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
