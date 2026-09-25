"use client";

import { KeyRound } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { changePassword } from "@/app/(auth)/actions";

export function SenhaForm() {
  return (
    <ActionForm action={changePassword} className="mt-4 space-y-3" resetOnSuccess>
      <InputField label="Senha atual" name="current" type="password" autoComplete="current-password" required maxLength={256} />
      <InputField
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={128}
        hint="Mínimo de 10 caracteres, com letras e números."
      />
      <InputField label="Confirme a nova senha" name="confirm" type="password" autoComplete="new-password" required maxLength={128} />
      <SubmitButton variant="secondary" className="w-full" pendingLabel="Salvando…">
        <KeyRound className="h-4 w-4" aria-hidden />
        Alterar senha
      </SubmitButton>
    </ActionForm>
  );
}
