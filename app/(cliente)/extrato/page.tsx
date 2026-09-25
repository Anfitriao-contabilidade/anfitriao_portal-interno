import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/forms/ActionForm";
import { TextareaField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { enviarExtrato } from "./actions";

export const metadata = { title: "Extrato" };

type Extrato = { id: string; total_linhas: number; linhas: { data: string; descricao: string; valor: string }[] };

export default async function ExtratoCliente() {
  const itens = await api<Extrato[]>("/extratos");
  return (
    <>
      <PageHeader eyebrow="Documentos" title="Extrato" description="Envie linhas data;descrição;valor. O portal não chama modelo de linguagem." />
      <Card className="mb-6">
        <ActionForm action={enviarExtrato} className="grid gap-4">
          <TextareaField label="Linhas" name="texto" required rows={6} hint="Ex.: 2026-09-01;Hospedagem;1.250,50" />
          <SubmitButton>Enviar</SubmitButton>
        </ActionForm>
      </Card>
      {itens.length === 0 ? (
        <EmptyState title="Nenhum extrato" />
      ) : (
        itens.map((e) => (
          <Card key={e.id} className="mb-4">
            <CardHeader title={`${e.total_linhas} linha(s)`} />
            <ul className="divide-y divide-line text-sm">
              {e.linhas.slice(0, 12).map((l, i) => (
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
