/**
 * CPF/CNPJ e CEP: máscaras de digitação e validação com dígito verificador.
 * Sem dependências — pode ser usado no navegador e no servidor.
 */

export function soDigitos(s: string) {
  return s.replace(/\D/g, "");
}

export function cpfValido(raw: string) {
  const c = soDigitos(raw);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

export function cnpjValido(raw: string) {
  const c = soDigitos(raw);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (len: number) => {
    const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = pesos.reduce((s, p, i) => s + Number(c[i]) * p, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}

/** Máscara progressiva: até 11 dígitos vira CPF (000.000.000-00); acima, CNPJ (00.000.000/0000-00). */
export function mascaraDocumento(valor: string, tipo?: "PF" | "PJ" | null) {
  const max = tipo === "PF" ? 11 : tipo === "PJ" ? 14 : 14;
  const d = soDigitos(valor).slice(0, max);
  if (d.length <= 11 && tipo !== "PJ") {
    let o = d.slice(0, 3);
    if (d.length > 3) o += `.${d.slice(3, 6)}`;
    if (d.length > 6) o += `.${d.slice(6, 9)}`;
    if (d.length > 9) o += `-${d.slice(9, 11)}`;
    return o;
  }
  let o = d.slice(0, 2);
  if (d.length > 2) o += `.${d.slice(2, 5)}`;
  if (d.length > 5) o += `.${d.slice(5, 8)}`;
  if (d.length > 8) o += `/${d.slice(8, 12)}`;
  if (d.length > 12) o += `-${d.slice(12, 14)}`;
  return o;
}

/**
 * Mensagem de erro do CPF/CNPJ digitado, ou null se estiver válido (ou vazio —
 * obrigatoriedade é do atributo `required`). `tipo` restringe a CPF (PF) ou CNPJ (PJ).
 */
export function erroDocumento(valor: string, tipo?: "PF" | "PJ" | null): string | null {
  const d = soDigitos(valor);
  if (!d) return null;
  if (tipo === "PF") return cpfValido(d) ? null : d.length < 11 ? "CPF incompleto" : "CPF inválido";
  if (tipo === "PJ") return cnpjValido(d) ? null : d.length < 14 ? "CNPJ incompleto" : "CNPJ inválido";
  if (d.length === 11) return cpfValido(d) ? null : "CPF inválido";
  if (d.length === 14) return cnpjValido(d) ? null : "CNPJ inválido";
  return d.length < 11 ? "CPF incompleto" : "CPF/CNPJ incompleto";
}

/** 00000-000 */
export function mascaraCep(valor: string) {
  const d = soDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function mascaraIbge(valor: string) {
  return soDigitos(valor).slice(0, 7);
}
