# Segurança — Portal do Cliente Anfitrião

Resumo das proteções implementadas na versão 1.0 (setembro/2026), organizado
pelas categorias do OWASP Top 10. A regra de ouro do projeto: **toda proteção
existe em mais de uma camada** — navegador → middleware → página/Server Action
→ Anfitrião API (autorização, validação, auditoria). Se uma camada falhar, a
seguinte segura.

> **Atualização 2026-09-23 — conexão com a Anfitrião API.** O portal não fala
> mais com banco de dados nem com o Supabase. Autenticação (Firebase
> Authentication), autorização, validação final, NFS-e e auditoria ficam na API
> (`anfitriao_api`, ver `docs/SEGURANCA.md` e `docs/PERMISSOES.md` lá). As
> seções abaixo foram ajustadas; o que citava RLS/migrations do Supabase agora
> vale para as regras equivalentes da API. A pasta `supabase/` é legado (só
> referência para a migração de dados).

## 1. Controle de acesso (A01)

| Camada | O que faz |
|---|---|
| `middleware.ts` | Qualquer rota fora de `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`, `/auth/*` e `/privacidade` exige o cookie de sessão. É só o primeiro portão (sem chamada de rede). |
| `lib/auth.ts` | Toda página e toda Server Action chama `requireUser()` ou `getSessaoAdmin()` — `GET /me` na API valida o cookie de sessão do Firebase (assinatura, expiração, **revogação**) e confere se a conta está ativa/aprovada. Sessão recusada → `/auth/sessao-expirada` apaga o cookie. |
| Anfitrião API | Única porta para os dados: RBAC (admin / proprietário / co-anfitrião) + propriedade do recurso, 404 para recurso de terceiro, `extra=forbid` (anti mass-assignment — o cliente não consegue alterar papéis, plano, status fiscal). |
| Cadastro público | Conta nasce **pendente** (inativa); só loga depois da aprovação de um admin em `/clientes`. O papel `admin` nunca pode ser pedido no cadastro. |
| Desativação | Admin desativa → a API revoga as sessões na hora; a próxima página do cliente cai no login. |

## 2. Falhas criptográficas / sessão (A02, A07)

- Senhas: ficam só no **Firebase Authentication** (a API valida pelo endpoint REST oficial; nada de senha no MongoDB nem nos logs).
- Sessão: *session cookie* do Firebase (padrão 72 h, `SESSAO_DURACAO_HORAS` na API), guardado no cookie `anf_sessao` — **httpOnly** (JavaScript não lê o token), **SameSite=Lax** (anti-CSRF) e **Secure** em produção. O navegador nunca recebe ID token nem refresh token.
- Logout, troca e redefinição de senha **revogam** as sessões no Firebase (valem para todos os dispositivos).
- HSTS de 2 anos + `upgrade-insecure-requests` quando servido em HTTPS.
- Login com **mensagem genérica** (“E-mail ou senha incorretos”) e recuperação de senha com resposta idêntica exista ou não o e-mail (evita enumeração de contas).
- **Limite de tentativas**: no portal, 5 por e-mail+IP e 30 por IP a cada 15 min no login, 5 cadastros/h por IP e 5 por IP na recuperação de senha; na API, cota própria dos endpoints `/auth/*` por IP (o portal repassa o IP real com o segredo `PORTAL_PROXY_SECRET`) — além dos limites do próprio Firebase.
- Política de senha: mínimo 10 caracteres, com letras e números (validada no portal e na API).
- Redefinição de senha com código de uso único do Firebase (`/auth/acao` → `/redefinir-senha`); troca de senha logado exige a senha atual.

## 3. Injeção e validação de entrada (A03)

- **Zod** valida no servidor 100% dos campos de formulário (`lib/validation.ts`): tamanho máximo, tipos, enums fechados, CEP, UF, competência `AAAA-MM`, CPF/CNPJ com **dígito verificador**, telefone, remoção de caracteres de controle.
- IDs recebidos em formulário são validados (ObjectId de 24 hex / UID do Firebase) antes de irem para a URL da API; chaves do checklist são comparadas com uma lista fechada.
- A API revalida tudo com Pydantic (`extra=forbid`, CPF/CNPJ, limites) — nenhuma consulta montada com texto do usuário.
- React escapa toda saída; links externos vindos do provedor fiscal só são exibidos se forem `https:` (bloqueia `javascript:`).

## 4. Cabeçalhos e configuração segura (A05)

- **Content-Security-Policy com nonce por requisição** e `strict-dynamic` — só executa JavaScript emitido pelo próprio Next.js; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritiva, `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy`.
- `Cache-Control: private, no-store` em páginas autenticadas (nada de dado de cliente em cache de proxy/CDN).
- `X-Robots-Tag: noindex` + `robots.txt` bloqueando tudo (portal privado).
- `X-Powered-By` removido; limite de 1 MB no corpo das Server Actions.
- Fontes servidas pelo próprio app (sem Google Fonts em runtime: nenhum IP de cliente vai para terceiros — LGPD).
- Falha fechada: sem `API_URL` válida o portal não carrega páginas autenticadas; API fora do ar → erro, nunca acesso sem autenticação.
- Variáveis validadas (`lib/env.ts`); nenhuma é `NEXT_PUBLIC_*` além da URL do site; módulos de servidor marcados com `server-only`. O token do Focus NFe e as credenciais do Firebase ficam **só na API**.
- `connect-src 'self'`: o navegador só fala com o próprio portal (a API é chamada pelo servidor do Next.js).

## 5. Componentes vulneráveis (A06)

- Next.js 15.5.26 e React 19.3 — versões atuais, com as correções de segurança das linhas anteriores (ex.: bypass de middleware CVE-2025-29927, que afetava a versão 14.2.15 usada antes). As dependências do Supabase foram removidas.
- `npm audit`: **0 vulnerabilidades** (inclui override do `postcss` embutido no Next).
- Rode `npm run audit:prod` periodicamente e mantenha o Dependabot/Renovate ligado no repositório.

## 6. Registro e monitoramento (A09)

- Trilha de **auditoria na API** (coleção `auditoria`): cadastro, login, logout, troca/redefinição de senha, aprovação/recusa de cadastro e toda alteração em perfis, imóveis, estoque, checklist, lançamentos, obrigações e notas — quem, quando, IP do usuário final, diff com dados pessoais mascarados.
- Erros técnicos vão só para o log do servidor; o usuário vê mensagem genérica (sem vazar estrutura do banco).

## 7. O que depende de configuração fora do código

- [ ] Definir `PORTAL_PROXY_SECRET` (mesmo valor no portal e na API, ≥ 32 caracteres) e `API_URL` com `https://`.
- [ ] Firebase Authentication: habilitar o provedor e-mail/senha, ativar a **proteção contra enumeração de e-mails** e configurar a URL de ação dos templates para `<portal>/auth/acao`.
- [ ] Avaliar MFA para as contas da equipe (Firebase Identity Platform).
- [ ] Backups do MongoDB (Atlas: backup contínuo).
- [ ] Revisar a política de privacidade (`/privacidade`) com o jurídico/DPO e definir retenção de dados.
- [ ] Em produção com várias instâncias, trocar o rate limit em memória (`lib/security/rate-limit.ts`) por Redis/Upstash.
- [ ] Nunca colocar credenciais do Firebase Admin ou `PORTAL_PROXY_SECRET` em variáveis `NEXT_PUBLIC_*`.
