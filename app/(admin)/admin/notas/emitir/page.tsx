import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { api, ApiError, apiPagina, type Pagina } from "@/lib/api";
import { listarUsuarios } from "@/lib/data";
import { EDITAVEIS, type ConfiguracaoNfse, type NotaNfse, type Prestador, type Tomador } from "@/lib/nfse";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Forbidden } from "@/components/ui/Forbidden";
import { AssistenteNfse } from "./AssistenteNfse";

export const metadata: Metadata = { title: "Emitir NFS-e" };

export default async function EmitirNfsePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const { id } = await searchParams;
  if (id && !/^[a-f0-9]{24}$/.test(id)) notFound();

  const [cfg, prestadores, usuarios] = await apiPagina(() =>
    Promise.all([
      api<ConfiguracaoNfse>("/nfse/configuracao"),
      api<Pagina<Prestador>>("/nfse/prestadores", { query: { limit: 200 } }),
      listarUsuarios(),
    ])
  );
  let nota: NotaNfse | null = null;
  let tomadores: Tomador[] = [];
  if (id) {
    try {
      nota = await api<NotaNfse>(`/nfse/notas/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) notFound();
      throw e;
    }
    if (!EDITAVEIS.includes(nota.status)) {
      return (
        <>
          <Link href={`/admin/notas/${id}`} prefetch={false} className="mb-3 inline-flex items-center gap-1 text-sm text-ocean hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar à nota
          </Link>
          <Alert tone="warning" title="Esta nota não pode mais ser editada">
            Situação atual: {nota.status.replace(/_/g, " ")}.
          </Alert>
        </>
      );
    }
    if (nota.prestador_id) {
      tomadores = (await api<Pagina<Tomador>>(`/nfse/prestadores/${nota.prestador_id}/tomadores`, { query: { limit: 100 } })).items;
    }
  }
  const clientes = usuarios
    .filter((u) => u.ativo && (u.papeis.includes("proprietario") || u.papeis.includes("coanfitriao")))
    .map((u) => ({ id: u.id, nome: u.nome, documento: u.documento, email: u.email }));

  return (
    <>
      <Link href="/admin/notas" prefetch={false} className="mb-3 inline-flex items-center gap-1 text-sm text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Notas fiscais
      </Link>
      <PageHeader
        eyebrow="NFS-e Nacional"
        title={nota ? "Continuar emissão" : "Emitir NFS-e"}
        description="Preencha as etapas; o rascunho é salvo a cada avanço. Nada é enviado à Sefin antes da revisão e da sua confirmação."
      />
      <AssistenteNfse cfg={cfg} prestadores={prestadores.items} clientes={clientes} notaInicial={nota} tomadoresIniciais={tomadores} />
    </>
  );
}
