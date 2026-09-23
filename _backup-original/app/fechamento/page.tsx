import NavBar from "@/components/NavBar";

// Placeholder honesto: o Painel Interno da equipe já tem um checklist de
// fechamento mensal (armazenado só lá, no Artifact db). Portar isso para cá
// exige desenhar uma tabela nova (fechamentos_mensais) e decidir o que o
// cliente pode ver/confirmar — ainda não foi feito, então esta tela não
// finge ter dados reais.
export default function FechamentoPage() {
  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-ink-soft">Fechamento mensal</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Fechamento mensal</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-ocean/20 bg-white p-6 text-sm text-ink-soft">
          <p>
            <strong className="text-ink">Esta tela ainda não está disponível no Portal do Cliente.</strong> O
            checklist de fechamento mensal (documentos entregues, pendências, confirmação do mês) hoje existe
            só no Painel Interno da equipe. Fale com seu contador se precisar do status do fechamento do mês.
          </p>
        </div>
      </main>
      </div>
    </>
  );
}
