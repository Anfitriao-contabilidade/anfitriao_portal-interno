import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

// Os grupos e a ordem das abas aqui espelham de propósito o menu do Painel
// Interno (uso da equipe) — pedido explícito: "as abas do sistema principal
// o Painel Interno devem ser as mesmas do Portal do Cliente", com a exceção
// de que a última linha ("Portal do Proprietário", que no Painel Interno é
// um link de saída para cá) vira "Deslogar" aqui. As abas que só fazem
// sentido para a equipe (Fechamento/Contratos/Extrato no Painel Interno
// também existem lá, mas as de contabilidade pura ficam de fora — o cliente
// só trabalha com Gestão).
const NAV_GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Visão geral",
    links: [{ href: "/", label: "Home" }],
  },
  {
    title: "Carteira",
    links: [
      { href: "/perfil", label: "Perfil" },
      { href: "/imoveis", label: "Imóveis" },
    ],
  },
  {
    title: "Operação & financeiro",
    links: [
      { href: "/financeiro", label: "Financeiro" },
      { href: "/operacao", label: "Operação" },
      { href: "/estoque", label: "Estoque" },
      { href: "/checklist", label: "Checklist de prontidão" },
      { href: "/fechamento", label: "Fechamento mensal" },
      { href: "/rentabilidade", label: "Rentabilidade" },
    ],
  },
  {
    title: "Documentos",
    links: [
      { href: "/notas", label: "Notas fiscais" },
      { href: "/contratos", label: "Contratos" },
      { href: "/extrato", label: "Extrato (IA)" },
    ],
  },
  {
    title: "Fiscal",
    links: [{ href: "/impostos", label: "Impostos" }],
  },
];

export default async function NavBar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase.from("profiles").select("papel").eq("id", user.id).single();
  const isAdmin = perfil?.papel === "admin";

  return (
    <aside
      className="border-b border-ocean/10 bg-white md:fixed md:inset-y-0 md:left-0 md:z-30 md:w-60 md:overflow-y-auto md:border-b-0 md:border-r"
      aria-label="Navegação principal"
    >
      <div className="px-5 py-4 md:py-5">
        <span className="font-display text-base font-semibold leading-tight text-ocean">
          Anfitrião <span className="text-gold">·</span> Portal do Cliente
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-3 pb-5 md:gap-5 md:pb-8">
        {/* Em telas pequenas os grupos viram uma faixa horizontal com rolagem,
            já que não há aqui um botão de menu com estado (NavBar é um
            componente de servidor) — mesma solução simples usada na demo. */}
        <div className="flex gap-5 overflow-x-auto pb-2 md:hidden">
          {NAV_GROUPS.flatMap((g) => g.links).map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap text-sm text-ink-soft hover:text-ocean">
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <Link href="/clientes" className="whitespace-nowrap text-sm font-medium text-gold hover:text-gold/80">
                Clientes
              </Link>
              <Link
                href="/admin/notas"
                className="whitespace-nowrap text-sm font-medium text-gold hover:text-gold/80"
              >
                Admin · Emitir notas
              </Link>
            </>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-md border border-ocean/20 px-3 py-1.5 text-xs font-medium text-ocean hover:bg-ocean/5"
            >
              Deslogar
            </button>
          </form>
        </div>

        <div className="hidden md:flex md:flex-col md:gap-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 px-2 font-mono text-[.66rem] uppercase tracking-wider text-ink-soft">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-md px-2 py-1.5 text-sm font-medium text-ink-soft hover:bg-ocean/5 hover:text-ocean"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div>
              <p className="mb-1.5 px-2 font-mono text-[.66rem] uppercase tracking-wider text-ink-soft">Equipe</p>
              <div className="flex flex-col gap-0.5">
                <Link
                  href="/clientes"
                  className="rounded-md px-2 py-1.5 text-sm font-medium text-gold hover:bg-gold/10"
                >
                  Clientes
                </Link>
                <Link
                  href="/admin/notas"
                  className="rounded-md px-2 py-1.5 text-sm font-medium text-gold hover:bg-gold/10"
                >
                  Admin · Emitir notas
                </Link>
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 px-2 font-mono text-[.66rem] uppercase tracking-wider text-ink-soft">Conta</p>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full rounded-md border border-ocean/20 px-3 py-1.5 text-xs font-medium text-ocean hover:bg-ocean/5"
              >
                Deslogar
              </button>
            </form>
          </div>
        </div>
      </nav>
    </aside>
  );
}
