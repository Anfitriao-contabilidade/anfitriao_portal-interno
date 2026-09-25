"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { VISAO_COOKIE, type VisaoCliente } from "@/lib/visao";

export async function definirVisao(visao: "painel" | VisaoCliente) {
  const sessao = await requireUser();
  if (!sessao.isAdmin) redirect("/");
  const jar = await cookies();
  if (visao === "painel") {
    jar.set(VISAO_COOKIE, "", { path: "/", maxAge: 0 });
    redirect("/admin");
  }
  jar.set(VISAO_COOKIE, visao, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/");
}
