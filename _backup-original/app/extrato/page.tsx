import NavBar from "@/components/NavBar";

// Placeholder honesto: a classificação de extrato bancário por IA existe só
// no Painel Interno da equipe e depende de infraestrutura de IA que este
// scaffold do Portal do Cliente ainda não tem. Não fingimos essa
// funcionalidade aqui até que ela realmente exista.
export default function ExtratoPage() {
  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-ink-soft">Documentos</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Extrato (IA)</h1>
        <div className="mt-6 rounded-2xl border border-dashed border-ocean/20 bg-white p-6 text-sm text-ink-soft">
          <p>
            <strong className="text-ink">Esta tela ainda não está disponível no Portal do Cliente.</strong> A
            classificação automática de extrato bancário por IA é um recurso interno da equipe da Anfitrião e
            ainda não foi trazida para o Portal.
          </p>
        </div>
      </main>
      </div>
    </>
  );
}
