import { z } from "zod";
import {
  CONDICOES_IMOVEL,
  PERFIS_ATUACAO,
  STATUS_FISCAL,
  TIPOS_IMOVEL,
  TIPOS_NOTA,
  TIPOS_PESSOA,
  UFS,
} from "./constants";

export { CONDICOES_IMOVEL, PERFIS_ATUACAO, STATUS_FISCAL, TIPOS_IMOVEL, TIPOS_NOTA, TIPOS_PESSOA, UFS };

/**
 * Esquemas de validação de TODA entrada vinda de formulário. Nunca confiamos
 * no navegador (atributos required/min/max são só conveniência de UX): tudo
 * é revalidado aqui, no servidor, antes de chegar ao banco — que ainda tem
 * suas próprias constraints e RLS como última barreira.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const texto = (max: number, label = "Campo") =>
  z
    .string()
    .trim()
    .max(max, `${label}: no máximo ${max} caracteres`)
    // remove caracteres de controle (exceto quebra de linha)
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""));

const textoOpcional = (max: number, label?: string) => z.preprocess(emptyToUndef, texto(max, label).optional());

const numeroOpcional = (min: number, max: number, label: string, inteiro = false) =>
  z.preprocess(
    (v) => {
      const e = emptyToUndef(v);
      if (e === undefined) return undefined;
      return typeof e === "string" ? Number(e.replace(",", ".")) : e;
    },
    (inteiro ? z.number().int(`${label}: use um número inteiro`) : z.number())
      .refine(Number.isFinite, `${label}: número inválido`)
      .min(min, `${label}: mínimo ${min}`)
      .max(max, `${label}: máximo ${max}`)
      .optional()
  );

// IDs da API: ObjectId do MongoDB (24 hex) para registros; UID do Firebase para usuários.
export const objectId = z.string().regex(/^[a-f0-9]{24}$/, "Identificador inválido");
export const uid = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/, "Identificador inválido");

// ---------------------------------------------------------------------------
// Documentos (CPF/CNPJ com dígito verificador)
// ---------------------------------------------------------------------------
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

const documentoOpcional = z.preprocess(
  emptyToUndef,
  z
    .string()
    .trim()
    .transform(soDigitos)
    .refine((d) => cpfValido(d) || cnpjValido(d), "CPF ou CNPJ inválido")
    .optional()
);

const telefoneOpcional = z.preprocess(
  emptyToUndef,
  z
    .string()
    .trim()
    .max(25)
    .refine((t) => /^[\d\s()+-]+$/.test(t) && soDigitos(t).length >= 10 && soDigitos(t).length <= 13, {
      message: "Telefone inválido (inclua o DDD)",
    })
    .optional()
);

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase().max(254),
  password: z.string().min(1, "Informe sua senha").max(256),
  next: z.string().optional(),
});

export const recuperarSenhaSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase().max(254),
});

const senhaForte = z
  .string()
  .min(10, "A senha deve ter pelo menos 10 caracteres")
  .max(128, "A senha deve ter no máximo 128 caracteres")
  .refine((s) => /[a-zA-Z]/.test(s) && /\d/.test(s), "Use letras e números");

export const novaSenhaSchema = z
  .object({ password: senhaForte, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "As senhas não conferem", path: ["confirm"] });

export const trocarSenhaSchema = z
  .object({ current: z.string().min(1, "Informe a senha atual").max(256), password: senhaForte, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "As senhas não conferem", path: ["confirm"] })
  .refine((d) => d.password !== d.current, { message: "A nova senha precisa ser diferente da atual", path: ["password"] });

// ---------------------------------------------------------------------------
// Perfil / clientes
// ---------------------------------------------------------------------------

const perfilBase = z.object({
  nome: texto(160, "Nome").pipe(z.string().min(2, "Informe o nome ou razão social")),
  tipo: z.enum(TIPOS_PESSOA, "Tipo inválido"),
  documento: documentoOpcional,
  telefone: telefoneOpcional,
  endereco: textoOpcional(300, "Endereço"),
});

const documentoCompativel = (d: { tipo: "PF" | "PJ"; documento?: string }) =>
  !d.documento || (d.tipo === "PF" ? cpfValido(d.documento) : cnpjValido(d.documento));

export const perfilSchema = perfilBase.refine(documentoCompativel, {
  message: "Para Pessoa Física informe um CPF; para Pessoa Jurídica, um CNPJ",
  path: ["documento"],
});

export const cadastroSchema = perfilBase
  .extend({
    email: z.email("Informe um e-mail válido").trim().toLowerCase().max(254),
    password: senhaForte,
    confirm: z.string(),
    perfil_atuacao: z.enum(PERFIS_ATUACAO, "Escolha como você atua"),
    aceite: z.literal("on", { message: "É preciso aceitar a Política de Privacidade" }),
  })
  .refine((d) => d.password === d.confirm, { message: "As senhas não conferem", path: ["confirm"] })
  .refine(documentoCompativel, {
    message: "Para Pessoa Física informe um CPF; para Pessoa Jurídica, um CNPJ",
    path: ["documento"],
  });

export const clienteAdminSchema = perfilBase
  .extend({
    id: uid,
    plano: textoOpcional(60, "Plano"),
    status_fiscal: z.enum(STATUS_FISCAL, "Status fiscal inválido"),
    perfil_atuacao: z.enum(PERFIS_ATUACAO, "Perfil inválido"),
  })
  .refine(documentoCompativel, {
    message: "Para Pessoa Física informe um CPF; para Pessoa Jurídica, um CNPJ",
    path: ["documento"],
  });

// ---------------------------------------------------------------------------
// Imóveis
// ---------------------------------------------------------------------------
const enumOpcional = <T extends readonly [string, ...string[]]>(values: T, msg: string) =>
  z.preprocess(emptyToUndef, z.enum(values, msg).optional());

export const imovelSchema = z.object({
  nome: texto(120, "Nome").pipe(z.string().min(1, "Informe um nome para o imóvel")),
  taxa_gestao_pct: z.preprocess(
    (v) => (emptyToUndef(v) === undefined ? 18 : Number(String(v).replace(",", "."))),
    z.number().refine(Number.isFinite, "Taxa inválida").min(0, "Mínimo 0%").max(100, "Máximo 100%")
  ),
  plataformas: z.preprocess(
    (v) =>
      typeof v === "string"
        ? v
            .split(",")
            .map((p) => p.trim().toLowerCase())
            .filter(Boolean)
        : [],
    z
      .array(z.string().max(40, "Nome de plataforma muito longo").regex(/^[a-z0-9 .\-]+$/, "Use só letras e números"))
      .max(10, "No máximo 10 plataformas")
  ),
  cep: z.preprocess(
    (v) => (typeof v === "string" ? soDigitos(v) || undefined : undefined),
    z.string().length(8, "CEP deve ter 8 dígitos").optional()
  ),
  rua: textoOpcional(160, "Rua"),
  numero: textoOpcional(20, "Número"),
  bairro: textoOpcional(80, "Bairro"),
  cidade: textoOpcional(80, "Cidade"),
  uf: enumOpcional(UFS, "UF inválida"),
  tipo: enumOpcional(TIPOS_IMOVEL, "Tipo inválido"),
  condicao: enumOpcional(CONDICOES_IMOVEL, "Estado inválido"),
  metragem: numeroOpcional(0, 100000, "Metragem"),
  quartos: numeroOpcional(0, 50, "Quartos", true),
  salas: numeroOpcional(0, 50, "Salas", true),
  banheiros: numeroOpcional(0, 50, "Banheiros", true),
});

export type ImovelInput = z.infer<typeof imovelSchema>;

/** Proprietário sem conta na plataforma (imóvel administrado por co-anfitrião). */
export const proprietarioExternoSchema = z.object({
  prop_nome: texto(200, "Nome do proprietário").pipe(z.string().min(2, "Informe o nome do proprietário")),
  prop_documento: documentoOpcional,
  prop_email: z.preprocess(emptyToUndef, z.email("E-mail inválido").trim().toLowerCase().max(254).optional()),
  prop_telefone: telefoneOpcional,
});

// ---------------------------------------------------------------------------
// Estoque / checklist
// ---------------------------------------------------------------------------
export const estoqueItemSchema = z.object({
  imovel_id: objectId,
  grupo: texto(60, "Grupo").pipe(z.string().min(1, "Informe o grupo")),
  tipo: texto(60, "Tipo").pipe(z.string().min(1, "Informe o tipo")),
  quantidade: z.preprocess(
    (v) => (emptyToUndef(v) === undefined ? 1 : Number(v)),
    z.number().int("Use um número inteiro").min(1, "Mínimo 1").max(10000, "Máximo 10.000")
  ),
  nome_marca: textoOpcional(120, "Nome/marca"),
  valor: numeroOpcional(0, 10_000_000, "Valor"),
});

// ---------------------------------------------------------------------------
// Notas fiscais (equipe)
// ---------------------------------------------------------------------------

export const competenciaSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato AAAA-MM");

export const notaSchema = z.object({
  cliente_id: uid,
  imovel_id: z.preprocess(emptyToUndef, objectId.optional()),
  tipo: z.enum(TIPOS_NOTA, "Tipo de nota inválido"),
  descricao_servico: texto(500, "Descrição").pipe(z.string().min(3, "Descreva o serviço")),
  valor: z.preprocess(
    (v) => Number(String(v ?? "").replace(",", ".")),
    z.number().refine(Number.isFinite, "Valor inválido").gt(0, "O valor deve ser maior que zero").max(10_000_000)
  ),
  competencia: z.preprocess(emptyToUndef, competenciaSchema.optional()),
  codigo_servico: z.preprocess(
    emptyToUndef,
    z.string().trim().regex(/^\d{1,2}\.\d{2}$/, "Formato do código: 14.01").optional()
  ),
  tomador_nome: textoOpcional(160, "Nome do hóspede"),
  tomador_documento: documentoOpcional,
});
