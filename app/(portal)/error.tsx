"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Só o identificador vai para o console do navegador; o detalhe fica no log do servidor.
    console.error("Erro no portal", error.digest);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700" aria-hidden>
        <TriangleAlert className="h-6 w-6" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Algo não saiu como esperado</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Não conseguimos carregar esta página agora. Tente de novo — se continuar, avise a equipe da Anfitrião
        {error.digest ? (
          <>
            {" "}
            informando o código <code className="rounded bg-paper px-1 font-mono text-xs">{error.digest}</code>
          </>
        ) : null}
        .
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          Tentar novamente
        </Button>
        <ButtonLink href="/" variant="secondary">
          Ir para o início
        </ButtonLink>
      </div>
    </div>
  );
}
