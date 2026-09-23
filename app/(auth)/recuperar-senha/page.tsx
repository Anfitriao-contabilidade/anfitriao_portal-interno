import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ResetRequestForm } from "./ResetRequestForm";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para o login
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Recuperar senha</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Informe o e-mail da sua conta. Enviaremos um link seguro, válido por tempo limitado, para você criar uma nova
        senha.
      </p>
      <ResetRequestForm />
    </>
  );
}
