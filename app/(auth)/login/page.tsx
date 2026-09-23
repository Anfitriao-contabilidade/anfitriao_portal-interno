import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    erro?: string;
    saiu?: string;
    expirou?: string;
    cadastro?: string;
    senha?: string;
    verificado?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="font-display text-3xl font-semibold text-ink">Bem-vindo de volta</h1>
      <p className="mt-2 text-sm text-ink-soft">Entre com o seu e-mail e senha.</p>

      {sp.cadastro && (
        <Alert tone="success" className="mt-6" role="status" title="Cadastro recebido!">
          A equipe da Anfitrião vai analisar seus dados e liberar o acesso. Você poderá entrar assim que a conta for
          aprovada. Enviamos também um e-mail para confirmar o seu endereço.
        </Alert>
      )}
      {sp.senha && (
        <Alert tone="success" className="mt-6" role="status">
          Senha redefinida. Entre com a nova senha.
        </Alert>
      )}
      {sp.verificado && (
        <Alert tone="success" className="mt-6" role="status">
          E-mail confirmado. Obrigado!
        </Alert>
      )}
      {sp.expirou && (
        <Alert tone="warning" className="mt-6" role="status">
          Sua sessão expirou ou foi encerrada. Entre novamente.
        </Alert>
      )}

      {sp.saiu && (
        <Alert tone="success" className="mt-6" role="status">
          Você saiu da sua conta com segurança.
        </Alert>
      )}
      {sp.erro === "link" && (
        <Alert tone="warning" className="mt-6" role="alert">
          O link expirou ou já foi usado. Solicite um novo em &ldquo;Esqueci minha senha&rdquo;.
        </Alert>
      )}

      <LoginForm next={typeof sp.next === "string" ? sp.next : undefined} />

      <p className="mt-8 rounded-xl border border-line bg-white p-4 text-sm leading-relaxed text-ink-soft">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-ocean underline-offset-2 hover:underline">
          Cadastre-se
        </Link>
        . Novos cadastros são liberados após a aprovação da equipe da Anfitrião.
      </p>
    </>
  );
}
