import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shell/Logo";

export const metadata: Metadata = { title: "Política de privacidade" };

// ⚠️ Modelo-base para orientar a redação final. Precisa ser revisado pelo
// jurídico/DPO da Anfitrião antes da publicação (LGPD, Lei 13.709/2018).
export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-16">
      <Logo />
      <Link href="/login" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ocean hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Política de privacidade</h1>
      <p className="mt-2 text-sm text-ink-soft">Portal do Cliente — Anfitrião Gestão e Contabilidade</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink">
        <section>
          <h2 className="font-display text-xl font-semibold">1. Quais dados tratamos</h2>
          <p className="mt-2 text-ink-soft">
            Dados cadastrais (nome/razão social, CPF/CNPJ, e-mail, telefone, endereço), dados dos imóveis, reservas,
            lançamentos financeiros, obrigações fiscais e notas fiscais necessários à prestação dos serviços de
            gestão e contabilidade.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">2. Para que usamos</h2>
          <p className="mt-2 text-ink-soft">
            Execução do contrato de prestação de serviços contábeis e de gestão, cumprimento de obrigações legais e
            regulatórias (fiscais) e exibição das informações a você neste portal.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">3. Como protegemos</h2>
          <p className="mt-2 text-ink-soft">
            Comunicação criptografada (HTTPS), senhas armazenadas com hash pelo provedor de autenticação, isolamento
            de dados por cliente diretamente no banco de dados, registro de auditoria das alterações em dados
            sensíveis e backups regulares.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl font-semibold">4. Seus direitos</h2>
          <p className="mt-2 text-ink-soft">
            Você pode solicitar confirmação, acesso, correção, portabilidade ou eliminação dos seus dados, observados
            os prazos legais de guarda de documentos fiscais. Fale com o encarregado de dados (DPO) da Anfitrião.
          </p>
        </section>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Texto-base. A versão definitiva, com contato do encarregado, prazos de retenção e compartilhamentos, deve
          ser validada pelo jurídico antes da publicação.
        </p>
      </div>
    </div>
  );
}
