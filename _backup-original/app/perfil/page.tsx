import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import { atualizarPerfil } from "./actions";

const PERFIL_ATUACAO_LABEL: Record<string, string> = {
  proprietario: "Proprietário",
  coanfitriao: "Co-Anfitrião",
  ambos: "Proprietário + Co-Anfitrião",
};

const PERFIL_ATUACAO_DESC: Record<string, string> = {
  proprietario: "Você administra apenas o(s) imóvel(is) que são seus.",
  coanfitriao:
    "Você administra imóveis de terceiros — a comissão de gestão mostrada em Financeiro é o valor de referência para você emitir sua nota fiscal de serviço.",
  ambos:
    "Você tem imóvel(is) próprio(s) e também administra imóveis de terceiros como Co-Anfitrião.",
};

export default async function PerfilPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <>
      <NavBar />
      <div className="md:pl-60">
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Perfil</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Mantenha seus dados cadastrais atualizados. O plano e o status fiscal são
          controlados pela equipe da Anfitrião.
        </p>

        <div className="mt-6 rounded-2xl border border-ocean/10 bg-white p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Seu perfil</p>
          <p className="mt-1 font-display text-lg font-semibold text-ocean">
            {PERFIL_ATUACAO_LABEL[profile?.perfil_atuacao] || "Proprietário"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {PERFIL_ATUACAO_DESC[profile?.perfil_atuacao] || PERFIL_ATUACAO_DESC.proprietario}
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            Esse dado é definido pela equipe da Anfitrião no seu cadastro. Se não estiver correto, fale com seu
            contador para ajustar.
          </p>
        </div>

        <form action={atualizarPerfil} className="mt-6 space-y-5 rounded-2xl border border-ocean/10 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome / Razão social</label>
              <input
                name="nome"
                defaultValue={profile?.nome || ""}
                required
                className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select
                name="tipo"
                defaultValue={profile?.tipo || "PF"}
                className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
              >
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">CPF / CNPJ</label>
              <input
                name="documento"
                defaultValue={profile?.documento || ""}
                className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <input
                name="telefone"
                defaultValue={profile?.telefone || ""}
                className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Endereço</label>
            <input
              name="endereco"
              defaultValue={profile?.endereco || ""}
              className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-4 border-t border-ocean/10 pt-4 text-sm text-ink-soft">
            <span>
              Plano: <strong className="text-ink">{profile?.plano || "—"}</strong>
            </span>
            <span>
              E-mail: <strong className="text-ink">{user?.email}</strong>
            </span>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-ocean px-5 py-2.5 text-sm font-medium text-white hover:bg-ocean-deep"
          >
            Salvar alterações
          </button>
        </form>
      </main>
      </div>
    </>
  );
}
