import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Contratos" };

type Contrato = { id: string; tipo: string; competencia: string | null; texto: string };

export default async function ContratosCliente() {
  const itens = await api<Contrato[]>("/contratos");
  return (
    <>
      <PageHeader eyebrow="Documentos" title="Contratos" description="Minutas preparadas pela equipe para a sua leitura." />
      <Alert tone="warning" className="mb-6">Documento de apoio. A versão assinada é a que a equipe enviar por fora deste texto.</Alert>
      {itens.length === 0 ? (
        <EmptyState title="Nenhuma minuta" description="Quando a equipe gerar um contrato, o texto aparece aqui." />
      ) : (
        <ul className="flex flex-col gap-4">
          {itens.map((c) => (
            <li key={c.id} className="rounded-card border border-line bg-raised p-4">
              <p className="text-sm font-medium text-ink">{c.tipo}{c.competencia ? ` · ${c.competencia}` : ""}</p>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-soft">{c.texto}</pre>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
