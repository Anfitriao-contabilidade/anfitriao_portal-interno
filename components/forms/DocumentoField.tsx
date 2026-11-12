"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { InputField } from "./Field";
import { useFormState } from "./ActionForm";
import { erroDocumento, mascaraDocumento } from "@/lib/documentos";

type Props = Omit<ComponentProps<typeof InputField>, "name" | "label" | "value" | "defaultValue" | "onChange" | "type" | "ref" | "erroLocal"> & {
  label?: string;
  name?: string;
  defaultValue?: string | null;
  /** PF → só CPF; PJ → só CNPJ; omitido → aceita os dois (pelo tamanho). */
  tipo?: "PF" | "PJ" | null;
  /** Limpa o campo quando o formulário é enviado com sucesso (ActionForm com resetOnSuccess). */
  resetOnSuccess?: boolean;
};

/**
 * Campo de CPF/CNPJ com máscara enquanto digita e validação do dígito
 * verificador. O erro aparece ao sair do campo; enquanto inválido, o envio do
 * formulário é bloqueado pelo navegador. O servidor revalida tudo.
 */
export function DocumentoField({ label = "CPF / CNPJ", name = "documento", defaultValue, tipo, resetOnSuccess, ...props }: Props) {
  const inicial = mascaraDocumento(defaultValue ?? "", tipo);
  const [valor, setValor] = useState(inicial);
  const [tocado, setTocado] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const state = useFormState();

  // Troca PF/PJ: reaplica a máscara do tipo escolhido.
  useEffect(() => {
    setValor((v) => mascaraDocumento(v, tipo));
  }, [tipo]);

  useEffect(() => {
    if (resetOnSuccess && state.ok) {
      setValor(inicial);
      setTocado(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ts]);

  const erro = erroDocumento(valor, tipo);
  useEffect(() => {
    ref.current?.setCustomValidity(erro ?? "");
  }, [erro]);

  return (
    <InputField
      {...props}
      ref={ref}
      label={label}
      name={name}
      value={valor}
      onChange={(e) => {
        setValor(mascaraDocumento(e.target.value, tipo));
        setTocado(false);
      }}
      onBlur={() => setTocado(true)}
      inputMode="numeric"
      autoComplete="off"
      maxLength={18}
      placeholder={props.placeholder ?? (tipo === "PJ" ? "00.000.000/0000-00" : tipo === "PF" ? "000.000.000-00" : undefined)}
      erroLocal={tocado && erro ? erro : undefined}
    />
  );
}
