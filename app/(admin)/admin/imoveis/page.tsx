import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { listarImoveis, listarUsuarios, nomeDoResponsavel } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImovelForm } from "@/app/(cliente)/imoveis/ImovelForm";
import { adicionarImovel } from "@/app/(cliente)/imoveis/actions";

export const metadata: Metadata = { title: "Imóveis" };

export default async function ImoveisAdminPage() {
  const [imoveis, usuarios] = await Promise.all([listarImoveis(), listarUsuarios()]);
  const nomes = new Map(usuarios.map((u) => [u.id, u.nome]));
  const proprietarios = usuarios.filter((u) => u.ativo && u.papeis.includes("proprietario"));

  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        title="Imóveis"
        description="Cadastre um imóvel para um proprietário que já tem conta, ou para um proprietário externo."
      />
      <Card className="mb-6" id="novo-imovel">
        <CardHeader title="Novo imóvel" />
        <ImovelForm
          action={adicionarImovel}
          submitLabel="Cadastrar imóvel"
          terceiro="opcional"
          proprietarios={proprietarios.map((u) => ({ id: u.id, nome: u.nome }))}
        />
      </Card>
      {imoveis.length === 0 ? (
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="Nenhum imóvel na carteira" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {imoveis.map((im) => (
            <li key={im.id} className="rounded-card border border-line bg-raised px-4 py-3">
              <p className="font-medium text-ink">{im.nome}</p>
              <p className="mt-1 text-sm text-ink-soft">{nomeDoResponsavel(im, nomes)}</p>
              <p className="mt-1 font-mono text-xs text-ink-soft">{im.cidade ? `${im.cidade}${im.uf ? `/${im.uf}` : ""}` : "Endereço não informado"}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
