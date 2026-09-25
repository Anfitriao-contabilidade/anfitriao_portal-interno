import { api } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/forms/ActionForm";
import { SelectField, TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { criarExtrato } from "../actions";

export const metadata = { title: "Extrato" };

type Extrato = { id: string; cliente_id: string; total_linhas: number; linhas: { data: string; descricao: string; valor: string }[] };

export default async function ExtratoAdmin() {
  const [usuarios, itens] = await Promise.all([listarUsuarios(), api<Extrato[]>("/extratos")]);
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const clientes = usuarios.filter((u) => u.papeis.some((p) => p !== "admin"));

  return (
    <>
      <PageHeader eyebrow="Documentos" title="Extrato" description="Cole linhas no formato data;descrição;valor. O reconhecimento é determinístico, sem IA no navegador." />
      <Card className="mb-6">
        <ActionForm action={criarExtrato} className="grid gap-4">
          <SelectField label="Cliente" name="cliente_id" required>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </SelectField>
          <TextareaField label="Linhas" name="texto" required rows={6} hint="Ex.: 2026-09-01;Hospedagem;1.250,50" />
          <SubmitButton>Lançar</SubmitButton>
        </ActionForm>
      </Card>
      {itens.length === 0 ? (
        <EmptyState title="Nenhum extrato" />
      ) : (
        itens.map((e) => (
          <Card key={e.id} className="mb-4">
            <CardHeader title={nomes.get(e.cliente_id) ?? e.cliente_id} description={`${e.total_linhas} linha(s)`} />
            <ul className="divide-y divide-line text-sm">
              {e.linhas.slice(0, 8).map((l, i) => (
                <li key={`${e.id}-${i}`} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{l.data} · {l.descricao}</span>
                  <span className="font-mono text-xs">{l.valor}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))
      )}
    </>
  );
}
