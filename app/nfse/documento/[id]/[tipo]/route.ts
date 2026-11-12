import { NextResponse, type NextRequest } from "next/server";
import { api, ApiError } from "@/lib/api";

/**
 * Download de documentos da NFS-e Nacional (XML, DANFSe, DPS assinada, evento).
 * A API decide quem pode baixar (equipe, ou o cliente dono de uma nota final) e devolve um
 * link assinado de curta duração do Storage privado; aqui só redirecionamos para ele.
 */
const TIPOS = new Set(["xml", "danfse", "dps", "evento"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; tipo: string }> }) {
  const { id, tipo } = await params;
  if (!/^[a-f0-9]{24}$/.test(id) || !TIPOS.has(tipo)) return new NextResponse("Documento inválido.", { status: 400 });
  try {
    const link = await api<{ url: string }>(`/nfse/notas/${id}/documentos/${tipo}`);
    const url = new URL(link.url);
    if (url.protocol !== "https:") return new NextResponse("Link inválido.", { status: 502 });
    return NextResponse.redirect(url, { status: 303 });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return NextResponse.redirect(new URL("/auth/sessao-expirada", request.nextUrl.origin));
    }
    const msg = e instanceof ApiError && e.status < 500 ? e.message : "Documento indisponível no momento.";
    return new NextResponse(msg, { status: e instanceof ApiError ? e.status : 502, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}
