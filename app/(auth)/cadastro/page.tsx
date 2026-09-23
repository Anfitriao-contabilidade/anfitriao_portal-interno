import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CadastroForm } from "./CadastroForm";

export const metadata: Metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Já tenho conta
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Criar conta</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Preencha seus dados. A equipe da Anfitrião confere o cadastro e libera o acesso ao portal — você recebe a
        confirmação por e-mail.
      </p>
      <CadastroForm />
    </>
  );
}
