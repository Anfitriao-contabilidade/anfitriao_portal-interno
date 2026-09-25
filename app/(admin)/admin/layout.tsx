import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const sessao = await requireUser();
  if (!sessao.isAdmin) redirect("/");
  return (
    <AppShell sessao={sessao} area="admin">
      {children}
    </AppShell>
  );
}
