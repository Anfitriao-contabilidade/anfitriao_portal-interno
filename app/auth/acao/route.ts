import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";

/**
 * Handler dos links enviados por e-mail pelo Firebase Authentication
 * (redefinição de senha e verificação de e-mail).
 *
 * Configure no Console do Firebase → Authentication → Templates → "Personalizar
 * URL de ação": https://SEU-PORTAL/auth/acao  — o Firebase acrescenta
 * ?mode=...&oobCode=... (docs/INTEGRACAO_PORTAL.md na API).
 */
const CODIGO = /^[A-Za-z0-9_-]{10,512}$/;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const mode = searchParams.get("mode");
  const codigo = searchParams.get("oobCode") ?? "";
  const para = (path: string) => NextResponse.redirect(new URL(path, origin));

  if (!CODIGO.test(codigo)) return para("/login?erro=link");

  if (mode === "resetPassword") {
    return para(`/redefinir-senha?codigo=${encodeURIComponent(codigo)}`);
  }
  if (mode === "verifyEmail") {
    try {
      await api("/auth/confirmar-email", { method: "POST", body: { codigo }, autenticado: false });
      return para("/login?verificado=1");
    } catch {
      return para("/login?erro=link");
    }
  }
  return para("/login");
}
