"use client";

import { Mail } from "lucide-react";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { requestPasswordReset } from "../actions";

export function ResetRequestForm() {
  return (
    <ActionForm action={requestPasswordReset} className="mt-8 space-y-4" resetOnSuccess>
      <InputField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        required
        maxLength={254}
      />
      <SubmitButton className="w-full" pendingLabel="Enviando…">
        <Mail className="h-4 w-4" aria-hidden />
        Enviar link
      </SubmitButton>
    </ActionForm>
  );
}
