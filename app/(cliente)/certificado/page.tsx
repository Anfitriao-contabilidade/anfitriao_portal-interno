import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { carregarMeuCertificado } from "@/lib/certificado-servidor";
import { PageHeader } from "@/components/ui/PageHeader";
import { CertificadoSecao } from "@/components/domain/certificado/CertificadoSecao";
import { enviarMeuCertificado, excluirMeuCertificado } from "../perfil/certificado-actions";

export const metadata: Metadata = { title: "Certificado digital" };

export default async function MeuCertificadoPage() {
  await requireUser();
  const { status, indisponivel } = await carregarMeuCertificado();
  return (
    <>
      <PageHeader
        eyebrow="Carteira"
        title="Certificado digital"
        description="Adicione seu certificado A1 (.pfx ou .p12) e acompanhe a validade. Ele é usado pela Anfitrião na emissão de notas fiscais em seu nome; a senha fica criptografada e nunca é exibida."
      />
      <CertificadoSecao
        status={status}
        indisponivel={indisponivel}
        enviar={enviarMeuCertificado}
        excluir={excluirMeuCertificado}
      />
    </>
  );
}
