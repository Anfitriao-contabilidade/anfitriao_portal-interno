import { Card, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDelete } from "@/components/forms/ConfirmDelete";
import type { ActionState } from "@/lib/actions";
import type { CertificadoStatus } from "@/lib/tipos";
import { CertificadoDetalhes } from "./CertificadoDetalhes";
import { CertificadoUploadForm } from "./CertificadoUploadForm";

type Acao = (state: ActionState, formData: FormData) => Promise<ActionState>;

/** Card "Certificados Digitais" — usado no Perfil (titular) e no painel da equipe. */
export function CertificadoSecao({
  status,
  indisponivel,
  enviar,
  excluir,
  uid,
  visaoEquipe = false,
}: {
  status: CertificadoStatus | null;
  /** Mensagem quando a API não pôde responder (ex.: cofre de chaves não configurado). */
  indisponivel?: string | null;
  enviar: Acao;
  excluir: Acao;
  uid?: string;
  visaoEquipe?: boolean;
}) {
  const temCertificado = !!status?.certificado;
  return (
    <Card as="section" id="certificado">
      <CardHeader
        title="Certificados Digitais"
        description="Certificado A1 (.pfx/.p12) usado pela Anfitrião para emitir notas fiscais e em outras operações fiscais em seu nome."
      />
      {indisponivel || !status ? (
        <Alert tone="warning" role="status">
          {indisponivel ?? "Não foi possível consultar o certificado agora."}
        </Alert>
      ) : (
        <div className="space-y-5">
          <CertificadoDetalhes status={status} visaoEquipe={visaoEquipe} />
          <div className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <CertificadoUploadForm action={enviar} temCertificado={temCertificado} uid={uid} />
            </div>
            {temCertificado && (
              <ConfirmDelete
                action={excluir}
                id={uid ?? "me"}
                label="Excluir certificado"
                confirmLabel="Excluir definitivamente"
                description="O arquivo criptografado será destruído e a emissão fiscal ficará bloqueada até um novo envio."
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
