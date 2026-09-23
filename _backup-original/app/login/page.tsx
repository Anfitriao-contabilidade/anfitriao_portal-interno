import { signIn } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm rounded-2xl border border-ocean/10 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-ocean">Anfitrião</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Portal do Cliente — Gestão &amp; Contabilidade
        </p>

        <form action={signIn} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm focus:border-ocean focus:outline-none"
              placeholder="voce@exemplo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-ocean/20 px-3 py-2 text-sm focus:border-ocean focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {searchParams?.erro && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {searchParams.erro}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-ocean py-2.5 text-sm font-medium text-white hover:bg-ocean-deep"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-xs text-ink-soft">
          Sua conta é criada pela equipe da Anfitrião. Problemas para entrar? Fale com
          seu contador.
        </p>
      </div>
    </div>
  );
}
