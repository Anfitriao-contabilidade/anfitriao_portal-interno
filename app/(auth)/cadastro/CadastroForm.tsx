"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { ActionForm, useFormState } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { signUp } from "../actions";

function Aceite() {
  const state = useFormState();
  const erro = state.fieldErrors?.aceite;
  return (
    <div>
      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="aceite"
          required
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? "aceite-erro" : undefined}
          className="mt-0.5 h-4 w-4 rounded border-line text-ocean"
        />
        <span>
          Li e aceito a{" "}
          <Link href="/privacidade" target="_blank" className="font-medium text-ocean underline-offset-2 hover:underline">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {erro && (
        <p id="aceite-erro" role="alert" className="mt-1 text-xs font-medium text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}

export function CadastroForm() {
  const [show, setShow] = useState(false);
  return (
    <ActionForm action={signUp} className="mt-8 space-y-4" aria-label="Criar conta no portal">
      <InputField label="Nome completo / Razão social" name="nome" autoComplete="name" required maxLength={160} />
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
      <SelectField label="Como você atua?" name="perfil_atuacao" required defaultValue="">
        <option value="" disabled>
          Selecione…
        </option>
        <option value="proprietario">Proprietário — administro meu(s) imóvel(is)</option>
        <option value="coanfitriao">Co-Anfitrião — administro imóveis de terceiros</option>
        <option value="ambos">Os dois</option>
      </SelectField>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="Tipo de pessoa" name="tipo" defaultValue="PF" required>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </SelectField>
        <InputField label="CPF / CNPJ" name="documento" inputMode="numeric" maxLength={18} optional />
      </div>
      <InputField label="Telefone" name="telefone" type="tel" autoComplete="tel" inputMode="tel" maxLength={25} optional placeholder="(11) 99999-9999" />
      <div className="relative">
        <InputField
          label="Senha"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
          hint="Mínimo de 10 caracteres, com letras e números."
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
      <InputField label="Confirme a senha" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" required maxLength={128} />
      <Aceite />
      <SubmitButton className="w-full" pendingLabel="Enviando…">
        <UserPlus className="h-4 w-4" aria-hidden />
        Criar conta
      </SubmitButton>
    </ActionForm>
  );
}
