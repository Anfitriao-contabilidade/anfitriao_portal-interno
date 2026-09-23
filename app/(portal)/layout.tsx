import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth";

// Todas as páginas do portal dependem da sessão: nunca pré-renderizar/cachear.
export const dynamic = "force-dynamic";

// Sem loading.tsx neste grupo de propósito: com Next 15.5, um Suspense de
// rota + revalidatePath() dentro de Server Action fazia a resposta da action
// (mensagem de sucesso) se perder em ~25% dos envios (medido em teste E2E).
// O feedback de navegação fica por conta do indicador no menu (LinkPending).

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const sessao = await requireUser();
  return <AppShell sessao={sessao}>{children}</AppShell>;
}
