import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getSessaoAdmin } from "@/lib/auth";
import { ApiError, apiPagina, apiTodos } from "@/lib/api";
import { fmtData, fmtDocumento } from "@/lib/format";
import { ehSituacao } from "@/lib/certificados";
import type { CertificadoUsuario, Papel } from "@/lib/tipos";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Forbidden } from "@/components/ui/Forbidden";
import { SituacaoCertificadoBadge } from "@/components/domain/certificado/CertificadoDetalhes";
import { MonitorButton } from "./MonitorButton";

export const metadata: Metadata = { title: "Certificados digitais" };

const SITUACOES = [
  { value: "", label: "Todos" },
  { value: "valido", label: "Válidos" },
  { value: "proximo_vencimento", label: "Próximos do vencimento" },
  { value: "vencido", label: "Vencidos" },
  { value: "invalido", label: "Inválidos" },
  { value: "nao_cadastrado", label: "Não cadastrados" },
];
const PAPEIS = [
  { value: "", label: "Todos os perfis" },
  { value: "proprietario", label: "Proprietários" },
  { value: "coanfitriao", label: "Anfitriões" },
];
const VENCIMENTOS = [
  { value: "", label: "Qualquer vencimento" },
  { value: "7", label: "Vence em até 7 dias" },
  { value: "30", label: "Vence em até 30 dias" },
  { value: "60", label: "Vence em até 60 dias" },
  { value: "90", label: "Vence em até 90 dias" },
];

function perfil(papeis: Papel[]) {
  if (papeis.includes("proprietario") && papeis.includes("coanfitriao")) return "Proprietário + anfitrião";
  return papeis.includes("coanfitriao") ? "Anfitrião" : "Proprietário";
}

type Busca = { situacao?: string; papel?: string; q?: string; vence?: string };

function href(atual: Busca, muda: Busca) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...atual, ...muda })) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/admin/certificados?${s}` : "/admin/certificados";
}

export default async function CertificadosAdminPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const admin = await getSessaoAdmin();
  if (!admin) return <Forbidden />;
  const sp = await searchParams;
  const filtros: Busca = {
    situacao: ehSituacao(sp.situacao) ? sp.situacao : "",
    papel: PAPEIS.some((p) => p.value === sp.papel) ? sp.papel : "",
    vence: VENCIMENTOS.some((v) => v.value === sp.vence) ? sp.vence : "",
    q: typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "",
  };

  let linhas: CertificadoUsuario[] = [];
  let erro: string | null = null;
  try {
    linhas = await apiPagina(() =>
      apiTodos<CertificadoUsuario>("/certificados", {
        situacao: filtros.situacao || undefined,
        papel: filtros.papel || undefined,
        vence_em_dias: filtros.vence || undefined,
        busca: filtros.q || undefined,
      })
    );
  } catch (e) {
    if (!(e instanceof ApiError) || e.status < 422) throw e;
    erro = e.message;
  }

  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        title="Certificados digitais"
        description="Situação dos certificados A1 de proprietários e anfitriões. Senhas e arquivos ficam criptografados e nunca são exibidos."
        actions={<MonitorButton />}
      />

      <div className="mb-4 space-y-3">
        <FilterChips
          ariaLabel="Filtrar por situação do certificado"
          active={filtros.situacao ?? ""}
          items={SITUACOES.map((s) => ({ value: s.value, label: s.label, href: href(filtros, { situacao: s.value }) }))}
        />
        <form action="/admin/certificados" className="flex flex-wrap gap-2">
          {filtros.situacao && <input type="hidden" name="situacao" value={filtros.situacao} />}
          <input
            name="q"
            defaultValue={filtros.q}
            placeholder="Nome, e-mail ou CPF/CNPJ"
            aria-label="Buscar usuário"
            className="min-h-9 min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 text-sm sm:max-w-xs"
          />
          <select name="papel" defaultValue={filtros.papel} aria-label="Perfil" className="min-h-9 rounded-lg border border-line bg-raised px-2 text-sm">
            {PAPEIS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select name="vence" defaultValue={filtros.vence} aria-label="Vencimento" className="min-h-9 rounded-lg border border-line bg-raised px-2 text-sm">
            {VENCIMENTOS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <button type="submit" className="min-h-9 rounded-lg bg-ocean px-3 text-sm font-medium text-white">
            Filtrar
          </button>
        </form>
      </div>

      {erro ? (
        <Alert tone="warning" role="status">
          {erro}
        </Alert>
      ) : linhas.length === 0 ? (
        <EmptyState title="Nenhum usuário neste filtro" />
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {linhas.map((l) => (
              <li key={l.titular_uid}>
                <Link
                  href={`/admin/certificados/${l.titular_uid}`}
                  prefetch={false}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ocean-50/50 sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{l.nome}</span>
                    <span className="block truncate text-xs text-ink-soft">
                      {l.email}
                      {l.documento ? ` · ${fmtDocumento(l.documento)}` : ""}
                    </span>
                  </span>
                  <span className="hidden shrink-0 sm:block">
                    <Badge tone="info">{perfil(l.papeis)}</Badge>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <SituacaoCertificadoBadge situacao={l.situacao} />
                    {l.certificado && (
                      <span className="font-mono text-[11px] text-ink-soft">
                        até {fmtData(l.certificado.valido_ate)} ({l.certificado.dias_restantes}d)
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
