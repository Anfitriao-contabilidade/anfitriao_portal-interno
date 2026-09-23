import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ nome, email, isAdmin }: { nome: string; email: string | null; isAdmin: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-paper p-2.5">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ocean-100 font-mono text-xs font-semibold text-ocean"
      >
        {iniciais(nome) || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink" title={nome}>
          {nome}
        </p>
        <p className="truncate text-xs text-ink-soft" title={email ?? undefined}>
          {isAdmin ? "Equipe Anfitrião" : email}
        </p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          title="Sair"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ocean"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="sr-only">Sair</span>
        </button>
      </form>
    </div>
  );
}
