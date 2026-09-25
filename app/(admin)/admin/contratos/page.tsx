import { api } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { criarContrato } from "../actions";

export const metadata = { title: "Contratos" };

type Contrato = { id: string; cliente_id: string; tipo: string; competencia: string | null; texto: string };

export default async function ContratosAdmin() {
  const [usuarios, itens] = await Promise.all([listarUsuarios(), api<Contrato[]>("/contratos")]);
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const clientes = usuarios.filter((u) => u.papeis.some((p) => p !== "admin"));

  return (
    <>
      <PageHeader eyebrow="Documentos" title="Contratos" description="Minuta determinística para revisão. Não há envio a modelo de linguagem." />
      <Alert tone="warning" className="mb-6">Texto de apoio interno. Não substitui revisão jurídica nem assinatura.</Alert>
      <Card className="mb-6">
        <CardHeader title="Nova minuta" />
        <ActionForm action={criarContrato} className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Cliente" name="cliente_id" required>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </SelectField>
          <SelectField label="Tipo" name="tipo" required>
            <option value="contabilidade">Contabilidade</option>
            <option value="gestao">Gestão</option>
            <option value="loc_pf_pj">Locação PF para PJ</option>
          </SelectField>
          <InputField label="Competência" name="competencia" placeholder="2026-09" optional />
          <div className="sm:col-span-2"><SubmitButton>Gerar minuta</SubmitButton></div>
        </ActionForm>
      </Card>
      {itens.length === 0 ? (
        <EmptyState title="Nenhuma minuta" />
      ) : (
        <ul className="flex flex-col gap-4">
          {itens.map((c) => (
            <li key={c.id} className="rounded-card border border-line bg-raised p-4">
              <p className="text-sm font-medium text-ink">{nomes.get(c.cliente_id) ?? c.cliente_id} · {c.tipo}</p>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-soft">{c.texto}</pre>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
