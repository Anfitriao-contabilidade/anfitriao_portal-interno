import Link from "next/link";
import type { ReactNode } from "react";
import type { SessaoUsuario } from "@/lib/auth";
import { Logo } from "./Logo";
import { NavList } from "./NavList";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import type { NavArea } from "./nav";

export function AppShell({
  sessao,
  area,
  children,
}: {
  sessao: SessaoUsuario;
  area: NavArea;
  children: ReactNode;
}) {
  const home = area === "admin" ? "/admin" : "/";
  const user = <UserMenu nome={sessao.nome} email={sessao.email} isAdmin={area === "admin"} />;

  return (
    <div className="min-h-dvh bg-paper">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ocean focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-raised nav:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Link href={home} prefetch={false} aria-label={area === "admin" ? "Painel interno" : "Portal do cliente"}>
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-1">
          <NavList area={area} />
        </div>
        <div className="shrink-0 border-t border-line p-3">{user}</div>
      </aside>

      <MobileNav area={area} home={home} userSlot={user} />

      <div className="nav:pl-[232px]">
        {area === "admin" && (
          <p className="border-b border-gold/40 bg-gold-50 px-4 py-2 text-center font-mono text-[.68rem] uppercase tracking-[.12em] text-gold-dark nav:px-8">
            Uso interno — equipe Anfitrião
          </p>
        )}
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-shell px-4 pb-28 pt-6 outline-none sm:px-6 sm:pt-8 nav:px-8 nav:pb-12 nav:pt-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
