import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ActionForm } from "@/components/forms/ActionForm";
import { InputField, SelectField } from "@/components/forms/Field";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { simularFiscal } from "../actions";

export const metadata = { title: "Fiscal" };

const PERFIS = [
  ["pf_locacao", "PF locação"],
  ["pf_hospedagem", "PF hospedagem"],
  ["gestor_pf", "Gestor PF"],
  ["pj_simples", "PJ Simples"],
  ["gestor_pj", "Gestor PJ"],
  ["mei", "MEI"],
  ["pj_presumido", "PJ lucro presumido"],
  ["nao_residente", "Não residente"],
];

export default function FiscalPage() {
  return (
    <>
      <PageHeader eyebrow="Carteira" title="Simulador fiscal" description="Estimativa mensal para a equipe. Não grava apuração e não substitui a obrigação oficial." />
      <Card>
        <ActionForm action={simularFiscal} className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Perfil" name="perfil" required>
            {PERFIS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </SelectField>
          <InputField label="Receita mensal" name="receita" inputMode="decimal" required />
          <InputField label="RBT12" name="rbt12" inputMode="decimal" optional hint="Só para Simples. Em branco, usa receita × 12." />
          <InputField label="CNAE" name="cnae" optional hint="Conferência de hospedagem (5510-8/01 e afins)." />
          <SelectField label="Atividade MEI" name="atividade_mei">
            <option value="servico">Serviço</option>
            <option value="comercio">Comércio</option>
            <option value="ambos">Ambos</option>
          </SelectField>
          <div className="sm:col-span-2">
            <SubmitButton>Simular</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
