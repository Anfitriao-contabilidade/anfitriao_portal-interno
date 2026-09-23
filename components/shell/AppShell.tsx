import Link from "next/link";
import type { ReactNode } from "react";
import type { SessaoUsuario } from "@/lib/auth";
import { Logo } from "./Logo";
import { NavList } from "./NavList";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";

export function AppShell({ sessao, children }: { sessao: SessaoUsuario; children: ReactNode }) {
  const user = <UserMenu nome={sessao.nome} email={sessao.email} isAdmin={sessao.isAdmin} />;

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ocean focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center px-5">
          <Link href="/" prefetch={false} aria-label="Início — Portal do Cliente Anfitrião">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-1">
          <NavList isAdmin={sessao.isAdmin} />
        </div>
        <div className="shrink-0 border-t border-line p-3">{user}</div>
      </aside>

      <MobileNav isAdmin={sessao.isAdmin} userSlot={user} />

      <div className="lg:pl-64">
        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 outline-none sm:px-6 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
