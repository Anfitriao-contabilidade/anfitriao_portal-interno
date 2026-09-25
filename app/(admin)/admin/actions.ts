"use server";

import { revalidatePath } from "next/cache";
import { getSessaoAdmin } from "@/lib/auth";
import { api } from "@/lib/api";
import { apiFail, fail, ok, type ActionState } from "@/lib/actions";

export async function simularFiscal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail("Apenas a equipe pode simular.");
  const receita = Number(String(formData.get("receita") ?? "").replace(",", "."));
  if (!Number.isFinite(receita) || receita < 0) return fail("Informe a receita mensal.");
  try {
    const perfil = String(formData.get("perfil") || "pf_locacao");
    const r = await api<{
      perfil: string;
      imposto: string;
      cnae_compativel: boolean | null;
      detalhe: Record<string, unknown>;
    }>("/fiscal/simular", {
      method: "POST",
      body: {
        perfil,
        receita: receita.toFixed(2),
        rbt12: formData.get("rbt12") ? Number(String(formData.get("rbt12")).replace(",", ".")).toFixed(2) : null,
        atividade_mei: String(formData.get("atividade_mei") || "servico"),
        modo_deducao: String(formData.get("modo_deducao") || "simplificado"),
        cnae: String(formData.get("cnae") || "") || null,
      },
    });
    const cnae = r.cnae_compativel == null ? "" : r.cnae_compativel ? " CNAE compatível com hospedagem." : " CNAE fora da lista de hospedagem.";
    const carne = perfil === "pf_locacao" || perfil === "pf_hospedagem" || perfil === "gestor_pf";
    return {
      ...ok(
        carne
          ? `DARF estimado (Carnê-Leão): R$ ${r.imposto}.${cnae} Estimativa para apoio interno, não é apuração oficial.`
          : `Imposto estimado: R$ ${r.imposto}.${cnae} Estimativa para apoio interno, não é apuração oficial.`,
      ),
      resultado: { perfil: r.perfil, imposto: r.imposto, cnae_compativel: r.cnae_compativel, detalhe: r.detalhe },
    };
  } catch (e) {
    return apiFail("fiscal:simular", e);
  }
}

export async function salvarFechamento(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail("Apenas a equipe fecha o mês.");
  try {
    await api("/fechamentos", {
      method: "PUT",
      body: {
        cliente_id: String(formData.get("cliente_id") || ""),
        competencia: String(formData.get("competencia") || ""),
        notas_ok: formData.get("notas_ok") === "on",
        despesas_ok: formData.get("despesas_ok") === "on",
        competencia_anterior_ok: formData.get("competencia_anterior_ok") === "on",
        observacao: String(formData.get("observacao") || "") || null,
      },
    });
  } catch (e) {
    return apiFail("fechamento:salvar", e);
  }
  revalidatePath("/admin/fechamento");
  revalidatePath("/fechamento");
  return ok("Fechamento gravado.");
}

export async function calcularSplit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail("Apenas a equipe calcula o split.");
  const faturamento = Number(String(formData.get("faturamento") ?? "").replace(",", "."));
  const taxa = Number(String(formData.get("taxa") ?? "").replace(",", "."));
  if (!Number.isFinite(faturamento) || !Number.isFinite(taxa)) return fail("Informe faturamento e taxa.");
  try {
    const r = await api<{ comissao: string; proprietario: string; nota_id: string | null }>("/financeiro/split", {
      method: "POST",
      body: {
        cliente_id: String(formData.get("cliente_id") || ""),
        competencia: String(formData.get("competencia") || ""),
        faturamento: faturamento.toFixed(2),
        taxa_gestao_pct: taxa.toFixed(2),
        gerar_nota: formData.get("gerar_nota") === "on",
      },
    });
    revalidatePath("/admin/notas");
    const nota = r.nota_id ? " Rascunho de comissão criado." : "";
    return ok(`Comissão R$ ${r.comissao} · proprietário R$ ${r.proprietario}.${nota}`);
  } catch (e) {
    return apiFail("financeiro:split", e);
  }
}

export async function criarContrato(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail("Apenas a equipe gera minutas.");
  try {
    await api("/contratos", {
      method: "POST",
      body: {
        cliente_id: String(formData.get("cliente_id") || ""),
        tipo: String(formData.get("tipo") || "contabilidade"),
        competencia: String(formData.get("competencia") || "") || null,
      },
    });
  } catch (e) {
    return apiFail("contrato:criar", e);
  }
  revalidatePath("/admin/contratos");
  revalidatePath("/contratos");
  return ok("Minuta gerada. Revise o texto antes de usar.");
}

export async function criarExtrato(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await getSessaoAdmin())) return fail("Apenas a equipe lança extrato da carteira.");
  try {
    const r = await api<{ total_linhas: number }>("/extratos", {
      method: "POST",
      body: { cliente_id: String(formData.get("cliente_id") || ""), texto: String(formData.get("texto") || "") },
    });
    revalidatePath("/admin/extrato");
    revalidatePath("/extrato");
    return ok(`${r.total_linhas} linha(s) reconhecida(s).`);
  } catch (e) {
    return apiFail("extrato:criar", e);
  }
}

export type LinhaCusto = { nome: string; valor: string };

export type PrecificacaoResultado = {
  custo_fixo_mensal: string;
  custo_vazio_dia: string;
  ocupacao_pct: string;
  noites: string;
  fixo_por_diaria: string | null;
  custo_variavel_diaria: string;
  percentuais: string;
  diaria_minima: string | null;
  margem_pct: string;
  diaria_recomendada: string | null;
  custo_mensal: string;
  custo_medio_diario: string;
  motivo: string | null;
  comparacao: "acima" | "abaixo" | "igual" | null;
};

function dinheiro(valor: string) {
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null;
}

export async function calcularPrecificacao(entrada: {
  fixos: LinhaCusto[];
  variaveis: LinhaCusto[];
  percentuais: LinhaCusto[];
  ocupacao_pct: string;
  margem_pct: string;
  diaria_praticada: string;
}): Promise<{ ok: true; resultado: PrecificacaoResultado } | { ok: false; message: string }> {
  if (!(await getSessaoAdmin())) return { ok: false, message: "Apenas a equipe calcula a diária." };
  const linhas = (itens: LinhaCusto[]) =>
    itens
      .map((item) => ({ nome: item.nome.trim() || "Custo", valor: dinheiro(item.valor) }))
      .filter((item): item is { nome: string; valor: string } => item.valor != null);
  const ocupacao = dinheiro(entrada.ocupacao_pct);
  const margem = dinheiro(entrada.margem_pct);
  if (!ocupacao || !margem) return { ok: false, message: "Informe ocupação e margem." };
  const praticada = entrada.diaria_praticada.trim() ? dinheiro(entrada.diaria_praticada) : null;
  try {
    const resultado = await api<PrecificacaoResultado>("/financeiro/precificacao", {
      method: "POST",
      body: {
        fixos: linhas(entrada.fixos),
        variaveis: linhas(entrada.variaveis),
        percentuais: linhas(entrada.percentuais),
        ocupacao_pct: ocupacao,
        margem_pct: margem,
        diaria_praticada: praticada,
      },
    });
    return { ok: true, resultado };
  } catch (e) {
    const estado = apiFail("financeiro:precificacao", e);
    return { ok: false, message: estado.message ?? "Não foi possível calcular." };
  }
}
