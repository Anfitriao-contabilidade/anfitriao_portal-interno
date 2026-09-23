import NavBar from "@/components/NavBar";

// Placeholder honesto: os contratos (locação PF→PJ, etc.) hoje são gerados
// e guardados só no Painel Interno da equipe. Mostrar isso aqui exigiria
// replicar o histórico de contratos por cliente numa tabela nova — ainda
// não existe, então a tela avisa em vez de fingir ter documentos.
export default function ContratosPage() {
  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-ink-soft">Documentos</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Contratos</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-ocean/20 bg-white p-6 text-sm text-ink-soft">
          <p>
            <strong className="text-ink">Esta tela ainda não está disponível no Portal do Cliente.</strong> Os
            contratos gerados para você hoje ficam com a equipe da Anfitrião. Peça uma cópia ao seu contador
            se precisar de algum contrato específico.
          </p>
        </div>
      </main>
      </div>
    </>
  );
}
