"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { cn } from "@/lib/cn";
import { definirVisao } from "./visao-actions";

type Visao = "painel" | "proprietario" | "coanfitriao";

const VISOES: { id: Visao; label: string }[] = [
  { id: "painel", label: "Painel" },
  { id: "proprietario", label: "Proprietário" },
  { id: "coanfitriao", label: "Coanfitrião" },
];

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({
  nome,
  email,
  isAdmin,
  dark = false,
  compact = false,
  podeTrocar = false,
  visao = "painel",
}: {
  nome: string;
  email: string | null;
  isAdmin: boolean;
  dark?: boolean;
  compact?: boolean;
  podeTrocar?: boolean;
  visao?: Visao;
}) {
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const painelId = useId();

  useEffect(() => {
    if (!aberto) return;
    function fechar(e: MouseEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fechar);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  const avatar = (
    <span
      aria-hidden
      className={
        dark
          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 font-mono text-xs font-semibold text-white"
          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-100 font-mono text-xs font-semibold text-ocean"
      }
    >
      {iniciais(nome) || "?"}
    </span>
  );

  return (
    <div ref={raiz} className={dark ? "relative flex items-center gap-2 rounded-xl p-1.5" : "relative flex items-center gap-3 rounded-xl border border-line bg-paper p-2.5"}>
      {podeTrocar ? (
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={painelId}
          aria-label={`Conta de ${nome}`}
          onClick={() => setAberto((v) => !v)}
          className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}
      <div className={compact ? "sr-only" : "min-w-0 flex-1"}>
        <p className={dark ? "truncate text-sm font-medium text-white" : "truncate text-sm font-medium text-ink"} title={nome}>
          {nome}
        </p>
        <p className={dark ? "truncate text-xs text-menu-muted" : "truncate text-xs text-ink-soft"} title={email ?? undefined}>
          {isAdmin ? "Equipe Anfitrião" : email}
        </p>
      </div>
      <form action={signOut} className={compact ? "sr-only" : undefined}>
        <button
          type="submit"
          title="Sair"
          className={
            dark
              ? "flex h-9 w-9 items-center justify-center rounded-lg text-menu-muted transition-colors hover:bg-white/10 hover:text-white"
              : "flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ocean"
          }
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="sr-only">Sair</span>
        </button>
      </form>

      {podeTrocar && aberto && (
        <div
          id={painelId}
          role="menu"
          className={cn(
            "absolute z-50 w-52 rounded-xl border border-white/10 p-2 text-white shadow-pop",
            compact ? "bottom-0 left-full ml-2" : "bottom-full left-0 mb-2"
          )}
          style={{ backgroundColor: "#071e36" }}
        >
          <Link
            href="/admin/perfil"
            role="menuitem"
            onClick={() => setAberto(false)}
            className="flex min-h-9 items-center gap-2 rounded-md px-2 text-sm hover:bg-white/10"
          >
            <UserRound className="h-4 w-4" aria-hidden />
            Perfil
          </Link>
          <p className="mt-2 px-2 font-mono text-[.62rem] uppercase tracking-[.12em] text-[#c5d4e0]">Ver como</p>
          {VISOES.map((op) => (
            <form key={op.id} action={definirVisao.bind(null, op.id)}>
              <button
                type="submit"
                role="menuitemradio"
                aria-checked={visao === op.id}
                className={cn(
                  "flex min-h-8 w-full items-center rounded-md px-2 text-left text-sm",
                  visao === op.id ? "bg-[#c0560c] text-white" : "hover:bg-white/10"
                )}
              >
                {op.label}
              </button>
            </form>
          ))}
          <form action={signOut} className="mt-1 border-t border-white/10 pt-1">
            <button type="submit" role="menuitem" className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-sm hover:bg-white/10">
              <LogOut className="h-4 w-4" aria-hidden />
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
