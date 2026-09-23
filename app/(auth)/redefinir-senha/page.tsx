import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = { title: "Nova senha" };

/**
 * Destino do link de redefinição enviado pelo Firebase (via /auth/acao, ou
 * direto com ?codigo= / ?oobCode=). Não exige login: o código de uso único
 * do e-mail é a prova de posse da conta, conferida pela API.
 */
export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; oobCode?: string }>;
}) {
  const sp = await searchParams;
  const bruto = sp.codigo ?? sp.oobCode ?? "";
  const codigo = /^[A-Za-z0-9_-]{10,512}$/.test(bruto) ? bruto : null;

  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para o login
      </Link>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Criar nova senha</h1>
      {codigo ? (
        <>
          <p className="mt-2 text-sm text-ink-soft">
            Use pelo menos 10 caracteres, com letras e números. Evite reaproveitar senhas de outros sites.
          </p>
          <NewPasswordForm codigo={codigo} />
        </>
      ) : (
        <Alert tone="warning" className="mt-6" role="alert">
          Link inválido ou incompleto. Solicite um novo em{" "}
          <Link href="/recuperar-senha" className="font-medium underline">
            Esqueci minha senha
          </Link>
          .
        </Alert>
      )}
    </>
  );
}
