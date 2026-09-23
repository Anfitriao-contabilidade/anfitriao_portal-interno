import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import NotaFiscalBadge from "@/components/NotaFiscalBadge";
import { fmtBRL } from "@/lib/metrics";

const TIPO_LABEL: Record<string, string> = {
  hospede: "Nota para hóspede",
  proprietario: "Nota de honorários (Anfitrião)",
  comissao: "Nota de comissão (Co-Anfitrião)",
};

export default async function NotasFiscaisPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notas } = await supabase
    .from("notas_fiscais")
    .select("*")
    .eq("owner_id", user!.id)
    .order("criado_em", { ascending: false });

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Notas fiscais</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Emitidas pela equipe da Anfitrião a partir do seu cadastro — inclui as notas de
          serviço para seus hóspedes, as notas de honorários da Anfitrião e, se você é
          Co-Anfitrião, o rascunho da nota de comissão de gestão (o mesmo valor de referência
          que aparece em Financeiro). Se algo estiver errado ou faltando, fale com seu contador.
        </p>

        <ul className="mt-6 space-y-3">
          {(notas || []).map((n) => (
            <li key={n.id} className="rounded-xl border border-ocean/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {TIPO_LABEL[n.tipo] || n.tipo}
                    {n.competencia ? ` — ${n.competencia}` : ""}
                  </p>
                  <p className="text-sm text-ink-soft">{n.descricao_servico}</p>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    {fmtBRL(n.valor)}
                    {n.numero ? ` · nota nº ${n.numero}` : ""}
                  </p>
                  {n.status === "erro" && n.erro_mensagem && (
                    <p className="mt-1 text-xs text-red-600">{n.erro_mensagem}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <NotaFiscalBadge status={n.status} />
                  {n.url_pdf && (
                    <a
                      href={n.url_pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-ocean hover:underline"
                    >
                      Ver PDF
                    </a>
                  )}
                </div>
              </div>
            </li>
          ))}
          {(!notas || notas.length === 0) && (
            <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
              Nenhuma nota fiscal emitida ainda.
            </p>
          )}
        </ul>
      </main>
      </div>
    </>
  );
}
