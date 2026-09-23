"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { signIn } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const [show, setShow] = useState(false);
  return (
    <ActionForm action={signIn} className="mt-8 space-y-4" aria-label="Entrar no portal">
      {next && <input type="hidden" name="next" value={next} />}
      <InputField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        maxLength={254}
        placeholder="voce@exemplo.com"
      />
      <div className="relative">
        <InputField
          label="Senha"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="current-password"
          required
          maxLength={256}
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-1 top-[1.85rem] flex h-10 w-10 items-center justify-center rounded-md text-ink-soft hover:text-ocean"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      <div className="flex justify-end">
        <Link href="/recuperar-senha" className="text-sm font-medium text-ocean underline-offset-2 hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <SubmitButton className="w-full" pendingLabel="Entrando…">
        <LogIn className="h-4 w-4" aria-hidden />
        Entrar
      </SubmitButton>
    </ActionForm>
  );
}
