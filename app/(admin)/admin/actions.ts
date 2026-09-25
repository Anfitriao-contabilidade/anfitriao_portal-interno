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
    const r = await api<{ imposto: string; cnae_compativel: boolean | null }>("/fiscal/simular", {
      method: "POST",
      body: {
        perfil: String(formData.get("perfil") || "pj_simples"),
        receita: receita.toFixed(2),
        rbt12: formData.get("rbt12") ? Number(String(formData.get("rbt12")).replace(",", ".")).toFixed(2) : null,
        atividade_mei: String(formData.get("atividade_mei") || "servico"),
        cnae: String(formData.get("cnae") || "") || null,
      },
    });
    const cnae = r.cnae_compativel == null ? "" : r.cnae_compativel ? " CNAE compatível com hospedagem." : " CNAE fora da lista de hospedagem.";
    return ok(`Imposto estimado: R$ ${r.imposto}.${cnae} Estimativa para apoio interno, não é apuração oficial.`);
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
