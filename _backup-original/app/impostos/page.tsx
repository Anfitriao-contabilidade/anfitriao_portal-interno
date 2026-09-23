import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { fmtBRL } from "@/lib/metrics";

function Badge({ vencimento, status }: { vencimento: string; status: string }) {
  const hoje = new Date().toISOString().slice(0, 10);
  if (status === "pago") {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-mono text-emerald-700">
        Pago
      </span>
    );
  }
  if (vencimento < hoje) {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-mono text-red-700">
        Atrasada
      </span>
    );
  }
  const dias = Math.round((Date.parse(vencimento) - Date.parse(hoje)) / 86400000);
  if (dias <= 7) {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-mono text-amber-700">
        Vence em {dias}d
      </span>
    );
  }
  return (
    <span className="rounded-full border border-ocean/20 bg-ocean/5 px-3 py-1 text-xs font-mono text-ocean">
      Pendente
    </span>
  );
}

export default async function ImpostosPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: obrigacoes } = await supabase
    .from("obrigacoes_fiscais")
    .select("*")
    .eq("owner_id", user!.id)
    .order("vencimento", { ascending: true });

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Impostos e obrigações</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Lançadas e confirmadas pela equipe da Anfitrião. Se algo já foi pago e ainda
          aparece pendente aqui, fale com seu contador.
        </p>

        <ul className="mt-6 space-y-3">
          {(obrigacoes || []).map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ocean/10 bg-white p-4"
            >
              <div>
                <p className="font-medium text-ink">
                  {o.tipo} {o.competencia ? `— ${o.competencia}` : ""}
                </p>
                <p className="text-sm text-ink-soft">{o.descricao || "sem descrição"}</p>
                <p className="mt-1 font-mono text-xs text-ink-soft">
                  Vencimento: {new Date(o.vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                  {o.valor != null ? ` · ${fmtBRL(o.valor)}` : ""}
                </p>
              </div>
              <Badge vencimento={o.vencimento} status={o.status} />
            </li>
          ))}
          {(!obrigacoes || obrigacoes.length === 0) && (
            <p className="rounded-lg border border-dashed border-ocean/20 p-6 text-sm text-ink-soft">
              Nenhuma obrigação lançada ainda.
            </p>
          )}
        </ul>
      </main>
      </div>
    </>
  );
}
