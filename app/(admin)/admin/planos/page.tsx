import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NovoPlanoForm, PlanoForm, SecaoForm, type Plano, type Secao } from "./PlanoForm";

export const metadata = { title: "Planos" };

function brl(valor: string) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return valor;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PlanosPage() {
  const [secao, planos] = await Promise.all([api<Secao>("/planos/secao"), api<Plano[]>("/planos")]);

  return (
    <>
      <PageHeader
        eyebrow="Operação & financeiro"
        title="Planos de pagamento"
        description="O que aparecer aqui é o que a landing mostra. O botão do plano continua levando ao contato."
      />
      <Card className="mb-6">
        <CardHeader title="Textos da seção" description="Título, subtítulo e a nota abaixo dos cartões." />
        <SecaoForm secao={secao} />
      </Card>
      <Card className="mb-6">
        <CardHeader title="Novo plano" />
        <NovoPlanoForm />
      </Card>
      {planos.length === 0 ? (
        <EmptyState title="Nenhum plano" description="Crie o primeiro cartão da landing." />
      ) : (
        <ul className="flex flex-col gap-3">
          {planos.map((plano) => (
            <li key={plano.id}>
              <details className="rounded-card border border-line bg-raised px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span>
                    <span className="block font-medium text-ink">
                      {plano.nivel} · {plano.titulo}
                    </span>
                    <span className="block text-xs text-ink-soft">
                      {brl(plano.preco_atual)}/mês
                      {plano.tag_oferta ? ` · ${plano.tag_oferta} ${brl(plano.preco_oficial)}` : ""}
                    </span>
                  </span>
                  {plano.mais_escolhido && <Badge tone="warning">Mais escolhido</Badge>}
                </summary>
                <div className="mt-4 border-t border-line pt-4">
                  <PlanoForm plano={plano} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
