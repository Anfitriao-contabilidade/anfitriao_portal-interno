import { api } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { fmtBRL } from "@/lib/metrics";
import { num } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { calcularSplit } from "../actions";

export const metadata = { title: "Financeiro" };

export default async function FinanceiroAdmin({
  searchParams,
}: {
  searchParams: Promise<{ cliente_id?: string; competencia?: string }>;
}) {
  const sp = await searchParams;
  const usuarios = await listarUsuarios();
  const clientes = usuarios.filter((u) => !u.papeis.includes("admin") || u.papeis.length > 1);
  const competencia = /^\d{4}-\d{2}$/.test(sp.competencia ?? "") ? sp.competencia! : "";
  const clienteId = clientes.some((c) => c.id === sp.cliente_id) ? sp.cliente_id! : "";
  const repasse =
    clienteId && competencia
      ? await api<{ faturamento: string; comissao: string; despesas: string; repasse: string }>("/financeiro/repasse", {
          query: { cliente_id: clienteId, competencia },
        })
      : null;

  return (
    <>
      <PageHeader eyebrow="Operação & financeiro" title="Repasse e split" description="O repasse usa o resumo do mês já calculado na API. O split pode gerar um rascunho de nota de comissão." />
      <Card className="mb-6">
        <CardHeader title="Repasse do mês" />
        <form className="grid gap-4 sm:grid-cols-3" action="/admin/financeiro">
          <label className="block text-sm font-medium text-ink">
            Cliente
            <select name="cliente_id" defaultValue={clienteId} className="mt-1 block w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm">
              <option value="">Selecione</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Competência
            <input name="competencia" defaultValue={competencia} placeholder="2026-09" pattern="\d{4}-\d{2}" className="mt-1 block w-full rounded-lg border border-line bg-raised px-3 py-2.5 text-sm" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="min-h-11 rounded-lg bg-ocean px-5 text-sm font-medium text-white">Calcular</button>
          </div>
        </form>
        {repasse && (
          <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard label="Faturamento" value={fmtBRL(num(repasse.faturamento))} />
            <StatCard label="Comissão" value={fmtBRL(num(repasse.comissao))} />
            <StatCard label="Despesas" value={fmtBRL(num(repasse.despesas))} />
            <StatCard label="Repasse" highlight value={fmtBRL(num(repasse.repasse))} />
          </div>
        )}
      </Card>
      <Card>
        <CardHeader title="Split" description="Comissão = faturamento × taxa. Marque a caixa para gravar o rascunho da nota." />
        <ActionForm action={calcularSplit} className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Cliente" name="cliente_id" required>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </SelectField>
          <InputField label="Competência" name="competencia" placeholder="2026-09" required />
          <InputField label="Faturamento" name="faturamento" inputMode="decimal" required />
          <InputField label="Taxa de gestão (%)" name="taxa" inputMode="decimal" required />
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" name="gerar_nota" className="h-4 w-4" />
            Gerar rascunho de nota de comissão
          </label>
          <SubmitButton>Calcular split</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
