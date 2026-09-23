import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shell/Logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ocean-deep text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-ocean opacity-60 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[24rem] w-[24rem] rounded-full bg-gold opacity-20 blur-3xl"
        />
        <div className="relative">
          <span className="font-display text-2xl font-semibold">Anfitrião</span>
          <span className="ml-2 font-mono text-xs uppercase tracking-[.18em] text-white/60">Gestão &amp; Contabilidade</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-4xl font-semibold leading-tight">
            Seus imóveis, seus números e sua situação fiscal — <span className="text-gold">num só lugar.</span>
          </p>
          <p className="mt-4 text-white/75">
            Acompanhe faturamento, repasses, notas fiscais e obrigações com a mesma clareza que a sua equipe de
            contabilidade enxerga.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Conexão criptografada. Seus dados são isolados e visíveis só para você e sua equipe contábil.
        </p>
      </aside>

      <main id="conteudo" className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <footer className="text-center text-xs text-ink-soft">
          <Link href="/privacidade" className="underline-offset-2 hover:underline">
            Política de privacidade
          </Link>
          <span aria-hidden> · </span>© {new Date().getFullYear()} Anfitrião Gestão e Contabilidade
        </footer>
      </main>
    </div>
  );
}
