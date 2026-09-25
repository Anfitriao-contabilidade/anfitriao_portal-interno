"use client";

import Link from "next/link";
import { useState } from "react";
import type { SessaoUsuario } from "@/lib/auth";
import { Logo } from "./Logo";
import { NavList } from "./NavList";
import { UserMenu } from "./UserMenu";
import type { NavArea } from "./nav";

const RECOLHIDO = "4.5rem";
const ABERTO = "16.5rem";

export function DesktopNav({ sessao, area, home }: { sessao: SessaoUsuario; area: NavArea; home: string }) {
  const [sobre, setSobre] = useState(false);
  const [foco, setFoco] = useState(false);
  const aberto = sobre || foco;

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 hidden flex-col text-white shadow-pop transition-[width] duration-200 ease-out motion-reduce:transition-none nav:flex"
      style={{ width: aberto ? ABERTO : RECOLHIDO, backgroundColor: "#071e36" }}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      onFocusCapture={() => setFoco(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFoco(false);
      }}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-3" style={{ backgroundColor: "#071e36" }}>
        <Link href={home} prefetch={false} aria-label={area === "admin" ? "Painel interno" : "Portal do cliente"} className="min-w-0">
          <Logo compact={!aberto} tone="light" subtitulo={area === "admin" ? "Painel interno" : "Portal do cliente"} />
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col" style={{ backgroundColor: "#071e36" }}>
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
          <NavList area={area} expanded={aberto} dark />
        </div>
        <div className="shrink-0 border-t border-white/10 p-2">
          <UserMenu
            nome={sessao.nome}
            email={sessao.email}
            isAdmin={area === "admin"}
            dark
            compact={!aberto}
            podeTrocar={Boolean(sessao.isAdmin || sessao.visaoSimulada)}
            visao={sessao.visaoSimulada ?? "painel"}
          />
        </div>
      </div>
    </aside>
  );
}
