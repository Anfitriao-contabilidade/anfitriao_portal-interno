import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import NotaFiscalBadge from "@/components/NotaFiscalBadge";
import { fmtBRL } from "@/lib/metrics";
import { getUsuarioEPapel } from "@/lib/admin";
import { reconsultarNota } from "./actions";
import EmitirNotaForm from "./EmitirNotaForm";

export default async function AdminNotasPage() {
  const { user, isAdmin } = await getUsuarioEPapel();

  if (!user) return null; // middleware já redireciona para /login

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <div className="md:pl-60">
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Esta página é restrita à equipe da Anfitrião.
          </p>
        </main>
        </div>
      </>
    );
  }

  const supabase = createClient();

  const [{ data: clientes }, { data: imoveis }, { data: notas }] = await Promise.all([
    supabase.from("profiles").select("id, nome").eq("papel", "cliente").order("nome"),
    supabase.from("imoveis").select("id, nome, owner_id").order("nome"),
    supabase
      .from("notas_fiscais")
      .select("*, profiles!notas_fiscais_owner_id_fkey(nome)")
      .order("criado_em", { ascending: false })
      .limit(50),
  ]);

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Notas fiscais — equipe</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Emite NFS-e de verdade via {process.env.FOCUSNFE_BASE_URL?.includes("homologacao") ? "Focus NFe (homologação)" : "Focus NFe"}
          . Exige <code>FOCUSNFE_TOKEN</code> configurado — ver README, seção "Emissão de NFS-e".
        </p>

        <EmitirNotaForm clientes={clientes || []} imoveis={imoveis || []} />

        <h2 className="mt-10 font-display text-lg font-semibold text-ink">Últimas notas</h2>
        <ul className="mt-4 space-y-3">
          {(notas || []).map((n: any) => (
            <li key={n.id} className="rounded-xl border border-ocean/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">
                    {n.profiles?.nome || "cliente"} ·{" "}
                    {n.tipo === "hospede" ? "hóspede" : n.tipo === "comissao" ? "comissão (Co-Anfitrião)" : "honorários"}
                  </p>
                  <p className="text-sm text-ink-soft">{n.descricao_servico}</p>
                  <p className="mt-1 font-mono text-xs text-ink-soft">
                    {fmtBRL(n.valor)}
                    {n.numero ? ` · nº ${n.numero}` : ""} · ref {n.referencia}
                  </p>
                  {n.status === "erro" && n.erro_mensagem && (
                    <p className="mt-1 text-xs text-red-600">{n.erro_mensagem}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <NotaFiscalBadge status={n.status} />
                  {n.url_pdf && (
                    <a href={n.url_pdf} target="_blank" rel="noreferrer" className="text-xs font-medium text-ocean hover:underline">
                      Ver PDF
                    </a>
                  )}
                  {n.status === "processando" && (
                    <form action={reconsultarNota}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="referencia" value={n.referencia} />
                      <button type="submit" className="text-xs font-medium text-ocean hover:underline">
                        Atualizar status
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
          {(!notas || notas.length === 0) && (
            <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
              Nenhuma nota emitida ainda.
            </p>
          )}
        </ul>
      </main>
      </div>
    </>
  );
}
