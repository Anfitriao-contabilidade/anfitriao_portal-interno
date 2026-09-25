import "server-only";
import { cookies } from "next/headers";

export const VISAO_COOKIE = "anf_visao";
export type VisaoCliente = "proprietario" | "coanfitriao";

export async function lerVisaoCliente(): Promise<VisaoCliente | null> {
  const valor = (await cookies()).get(VISAO_COOKIE)?.value;
  return valor === "proprietario" || valor === "coanfitriao" ? valor : null;
}
