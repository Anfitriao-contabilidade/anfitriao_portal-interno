import { api } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField, TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { salvarFechamento } from "../actions";

export const metadata = { title: "Fechamento mensal" };

type Fechamento = {
  id: string;
  cliente_id: string;
  competencia: string;
  notas_ok: boolean;
  despesas_ok: boolean;
  competencia_anterior_ok: boolean;
  concluido: boolean;
};

export default async function FechamentoAdmin() {
  const [usuarios, itens] = await Promise.all([
    listarUsuarios(),
    api<Fechamento[]>("/fechamentos"),
  ]);
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const clientes = usuarios.filter((u) => u.papeis.some((p) => p !== "admin"));

  return (
    <>
      <PageHeader eyebrow="Operação & financeiro" title="Fechamento mensal" description="Três confirmações fecham a competência: notas, despesas e o mês anterior." />
      <Card className="mb-6">
        <CardHeader title="Registrar" />
        <ActionForm action={salvarFechamento} className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Cliente" name="cliente_id" required>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </SelectField>
          <InputField label="Competência" name="competencia" placeholder="2026-09" required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notas_ok" /> Notas conferidas</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="despesas_ok" /> Despesas conferidas</label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="competencia_anterior_ok" /> Competência anterior encerrada</label>
          <TextareaField label="Observação" name="observacao" optional className="sm:col-span-2" rows={2} />
          <SubmitButton>Salvar</SubmitButton>
        </ActionForm>
      </Card>
      {itens.length === 0 ? (
        <EmptyState title="Nenhum fechamento" description="Os meses confirmados aparecem aqui e na visão do cliente." />
      ) : (
        <ul className="flex flex-col gap-3">
          {itens.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-raised px-4 py-3">
              <div>
                <p className="font-medium text-ink">{nomes.get(f.cliente_id) ?? f.cliente_id}</p>
                <p className="font-mono text-xs text-ink-soft">{f.competencia}</p>
              </div>
              <Badge tone={f.concluido ? "success" : "warning"}>{f.concluido ? "Concluído" : "Em aberto"}</Badge>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
