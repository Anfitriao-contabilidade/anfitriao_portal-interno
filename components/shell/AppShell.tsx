import type { ReactNode } from "react";
import type { SessaoUsuario } from "@/lib/auth";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";
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
  const user = (
    <UserMenu
      nome={sessao.nome}
      email={sessao.email}
      isAdmin={area === "admin"}
      dark
      podeTrocar={Boolean(sessao.isAdmin || sessao.visaoSimulada)}
      visao={sessao.visaoSimulada ?? "painel"}
    />
  );

  return (
    <div className="min-h-dvh bg-paper">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ocean focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      <DesktopNav sessao={sessao} area={area} home={home} />

      <MobileNav area={area} home={home} userSlot={user} />

      <div className="nav:pl-[4.5rem]">
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
