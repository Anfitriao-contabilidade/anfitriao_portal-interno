# Portal do Cliente — Anfitrião Gestão e Contabilidade

Aplicação Next.js que implementa o escopo descrito em
`especificacao-tecnica-painel-cliente.md`: cada cliente entra com login próprio
e vê **só os próprios dados** — perfil, imóveis, rentabilidade/faturamento e
situação fiscal.

> **Desde 2026-09-23 o portal é um front-end da [Anfitrião API](../anfitriao_api)**
> (FastAPI + MongoDB + Firebase). O portal não acessa banco nem Supabase: login,
> cadastro, dados, métricas, NFS-e e auditoria passam pela API, chamada **só
> pelo servidor do Next.js** (Server Components e Server Actions). A pasta
> `supabase/` e os arquivos `teste-pratico-login.*` ficaram como legado (referência
> para a migração de dados).

## Como a conexão funciona

```
Navegador ──(cookie httpOnly anf_sessao)──▶ Next.js (servidor) ──Authorization: Bearer <sessão>──▶ Anfitrião API ──▶ MongoDB
                                                                  X-Portal-Secret + X-Forwarded-For         └─▶ Firebase Auth
```

1. **Login** (`/login`): a Server Action chama `POST /auth/login`; a API confere
   e-mail/senha no Firebase Authentication, verifica se a conta está ativa e
   aprovada e devolve um *session cookie* do Firebase. O portal guarda esse valor
   no cookie `anf_sessao` (httpOnly, SameSite=Lax, Secure em produção).
2. **Cada página** chama a API com `Authorization: Bearer <sessão>` (`lib/api.ts`);
   a API valida assinatura, expiração e revogação. Sessão recusada →
   `/auth/sessao-expirada` apaga o cookie e volta ao login.
3. **Cadastro** (`/cadastro`): aberto ao público, mas a conta nasce **pendente** —
   a equipe aprova ou recusa em **Clientes** (bloco "Cadastros aguardando
   aprovação"). Só depois disso o login é liberado.
4. **Senha**: "Esqueci minha senha" → e-mail do Firebase → `/auth/acao` →
   `/redefinir-senha`. Logado, a troca é feita em **Perfil** (exige a senha atual).
   Logout, troca e redefinição encerram as sessões em todos os dispositivos.

## Funcionalidades

- **Login, cadastro com aprovação, recuperação e troca de senha** (Firebase Auth via API).
- **Início**: status fiscal (Regular / Em verificação / Pendência) + saúde financeira
  do mês e variação vs. mês anterior — `GET /metricas/painel`.
- **Perfil**: dados cadastrais (`GET/PATCH /me`); plano, papéis e status fiscal são
  definidos pela equipe. Troca de senha.
- **Imóveis**: próprios e, para Co-Anfitriões, imóveis de terceiros (proprietário
  sem conta). O proprietário vincula/remove co-anfitriões pelo e-mail. A taxa de
  gestão só é alterada pelo proprietário/equipe.
- **Financeiro, Operação (reservas), Rentabilidade, Impostos, Notas fiscais**:
  leitura, com números calculados na API (mesma fórmula de `lib/metrics.ts`).
- **Estoque e Checklist de prontidão**: por imóvel (nota calculada na API).
- **Equipe (admin)**: Clientes (aprovação de cadastros, edição, ativar/desativar
  acesso) e Emitir notas (NFS-e via Focus NFe, configurado na API).

## Como colocar em produção

1. **Suba a Anfitrião API** (ver `anfitriao_api/README.md` e
   `anfitriao_api/docs/INTEGRACAO_PORTAL.md`) com `FIREBASE_WEB_API_KEY`,
   `PORTAL_URL` e `PORTAL_PROXY_SECRET` configurados.
2. **Crie o primeiro admin** na API: `poetry run python -m scripts.criar_admin ...`.
3. **Variáveis do portal** (`.env.local` ou painel da hospedagem) — ver `.env.example`:
   `API_URL`, `PORTAL_PROXY_SECRET` (mesmo valor da API) e `NEXT_PUBLIC_SITE_URL`.
4. **Firebase Console → Authentication → Templates**: personalize a URL de ação
   para `https://SEU-PORTAL/auth/acao` (links de redefinição de senha e de
   verificação de e-mail passam a abrir no portal).
5. `npm ci && npm run build && npm start` (ou deploy na Vercel/Dokploy com as
   mesmas variáveis).

Para testar tudo na sua máquina, siga o **[GUIA-TESTE-LOCAL.md](GUIA-TESTE-LOCAL.md)**.

## Estrutura do projeto

```
app/
  (auth)/             login, cadastro, recuperar-senha, redefinir-senha + actions de autenticação
  auth/acao/          recebe os links de e-mail do Firebase (resetPassword / verifyEmail)
  auth/sessao-expirada/  apaga o cookie local quando a API recusa a sessão
  (portal)/           área logada — layout com menu lateral (desktop) e gaveta + barra inferior (celular)
    page.tsx          Início (status fiscal, saúde financeira, próximos vencimentos)
    perfil/ imoveis/ financeiro/ operacao/ estoque/ checklist/ rentabilidade/
    impostos/ notas/ contratos/ extrato/ fechamento/
    clientes/         clientes + aprovação de cadastros (equipe)
    admin/notas/      emissão de NFS-e (equipe)
  privacidade/        texto-base da política de privacidade (LGPD — revisar com o jurídico)
components/           design system, formulários acessíveis, shell e componentes de domínio
lib/
  api.ts              cliente HTTP da Anfitrião API (só servidor)
  api-error.ts        ApiError (código/mensagem da API)
  session.ts          cookie de sessão httpOnly
  auth.ts             sessão + papéis (requireUser / getSessaoAdmin) via GET /me
  tipos.ts            tipos das respostas da API
  data.ts             helpers de listagem compartilhados
  validation.ts       esquemas Zod de todas as entradas (CPF/CNPJ com dígito verificador)
  metrics.ts          formatação e tipos (os cálculos agora vêm da API)
  security/           CSP com nonce, controle de rotas, rate limit, validação de URLs
middleware.ts         controle de acesso por rota, CSP e no-store
supabase/             LEGADO — schema antigo, útil só para a migração de dados
```

## Próximos passos sugeridos

1. Migrar os dados do Supabase para o MongoDB/Firebase (roteiro em
   `anfitriao_api/docs/INTEGRACAO_PORTAL.md`) e conferir os números do Financeiro.
2. Configurar o Firebase (provedor e-mail/senha, proteção contra enumeração,
   URL de ação dos templates) e testar os e-mails reais.
3. Trocar o rate limit em memória (portal e API) por Redis se houver várias instâncias.
4. Tela interna para a equipe lançar reservas/lançamentos/obrigações (a API já
   tem os endpoints `POST /reservas`, `/lancamentos`, `/obrigacoes`).
5. Upload/download de arquivos (a API já tem `/arquivos` com URL assinada) —
   ainda sem tela no portal.
