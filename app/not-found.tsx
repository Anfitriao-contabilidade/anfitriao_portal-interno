import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="conteudo" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ocean-50 text-ocean" aria-hidden>
        <Compass className="h-6 w-6" />
      </div>
      <p className="mt-4 font-mono text-xs uppercase tracking-[.16em] text-gold-dark">Erro 404</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-soft">O endereço pode ter mudado ou não existe mais.</p>
      <ButtonLink href="/" className="mt-6">
        Voltar para o início
      </ButtonLink>
    </main>
  );
}
