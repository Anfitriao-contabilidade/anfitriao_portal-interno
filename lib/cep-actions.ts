"use server";

import { getSessao } from "@/lib/auth";

export type CepResultado =
  | { ok: true; cep: string; logradouro: string; bairro: string; cidade: string; uf: string; ibge: string }
  | { ok: false; message: string };

/**
 * Consulta o CEP (ViaCEP) pelo servidor — o navegador só fala com o próprio
 * portal (CSP connect-src 'self'). Campos que o CEP não traz voltam vazios:
 * o formulário os deixa em branco para a pessoa completar.
 */
export async function buscarCep(entrada: string): Promise<CepResultado> {
  const cep = String(entrada ?? "").replace(/\D/g, "");
  if (cep.length !== 8) return { ok: false, message: "CEP deve ter 8 dígitos." };
  if (!(await getSessao())) return { ok: false, message: "Sessão expirada. Entre novamente." };

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`ViaCEP HTTP ${res.status}`);
    const j = (await res.json()) as Record<string, unknown>;
    if (j.erro) return { ok: false, message: "CEP não encontrado. Preencha o endereço manualmente." };
    const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    return {
      ok: true,
      cep,
      logradouro: s(j.logradouro),
      bairro: s(j.bairro),
      cidade: s(j.localidade),
      uf: s(j.uf).toUpperCase(),
      ibge: /^\d{7}$/.test(s(j.ibge)) ? s(j.ibge) : "",
    };
  } catch (e) {
    console.error("[action:buscarCep]", e);
    return { ok: false, message: "Não foi possível consultar o CEP agora. Preencha o endereço manualmente." };
  }
}
