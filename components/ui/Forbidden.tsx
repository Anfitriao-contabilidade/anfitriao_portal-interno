import { ShieldAlert } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { ButtonLink } from "./Button";

export function Forbidden() {
  return (
    <EmptyState
      icon={<ShieldAlert className="h-5 w-5" />}
      title="Acesso restrito à equipe da Anfitrião"
      description="Esta área é usada apenas pelos contadores e gestores. Se você acredita que deveria ter acesso, fale com a equipe."
      action={<ButtonLink href="/" variant="secondary">Voltar para o início</ButtonLink>}
    />
  );
}
