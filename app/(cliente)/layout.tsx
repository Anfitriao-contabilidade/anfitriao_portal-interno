import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth";
import { lerVisaoCliente } from "@/lib/visao";

// Todas as páginas do portal dependem da sessão: nunca pré-renderizar/cachear.
export const dynamic = "force-dynamic";

// Sem loading.tsx neste grupo de propósito: com Next 15.5, um Suspense de
// rota + revalidatePath() dentro de Server Action fazia a resposta da action
// (mensagem de sucesso) se perder em ~25% dos envios (medido em teste E2E).
// O feedback de navegação fica por conta do indicador no menu (LinkPending).

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const sessao = await requireUser();
  const visao = sessao.isAdmin ? await lerVisaoCliente() : null;
  if (!sessao.isProprietario && !sessao.isCoanfitriao && !visao) redirect("/admin");
  const exibida = visao
    ? {
        ...sessao,
        isAdmin: false,
        isProprietario: visao === "proprietario",
        isCoanfitriao: visao === "coanfitriao",
        visaoSimulada: visao,
      }
    : sessao;
  return (
    <AppShell sessao={exibida} area="cliente">
      {children}
    </AppShell>
  );
}
