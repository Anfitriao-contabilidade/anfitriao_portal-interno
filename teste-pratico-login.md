# Teste prático de login — S S S Trevisan Consultoria e Assessoria

O Portal do Cliente (`anfitriao-portal-cliente.zip`) até agora só existe como **código-fonte** — nunca foi publicado em lugar nenhum, então ainda **não existe um link real para logar**. Criar contas em serviços de terceiros (Supabase, Vercel) é algo que só você pode fazer — eu não crio contas em nome de ninguém. Mas o caminho abaixo é rápido (uns 10 minutos) e no final você loga de verdade, no seu computador, com os dados fictícios da S S S Trevisan já populados no painel.

## Login de teste (depois de seguir os passos abaixo)

- **E-mail**: `contato@ssstrevisan.com.br`
- **Senha**: `Trevisan@Teste2026`

(Fictícios — não é um e-mail real, é só o usuário de teste que você vai criar no Supabase.)

## Passo a passo

### 1. Criar o projeto no Supabase (gratuito)

1. Crie uma conta/projeto em https://supabase.com (se ainda não tiver).
2. Em **SQL Editor**, cole e rode o conteúdo de `supabase/migrations/0001_init.sql` e, em seguida, `0002_nfse.sql` (ambos dentro do zip do Portal do Cliente).
3. Em **Authentication → Providers**, deixe **Email** habilitado (padrão).
4. Em **Authentication → URL Configuration**, desative **"Enable email confirmations"** — assim o usuário de teste já entra direto, sem precisar clicar em link de confirmação por e-mail.
5. Em **Settings → API**, copie a **Project URL** e a **anon public key**.

### 2. Configurar o projeto localmente

No seu computador, dentro da pasta extraída do zip:

```
cp .env.example .env.local
```

Edite `.env.local` e preencha com os valores do passo anterior:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

(Pode deixar as variáveis do Focus NFe em branco por enquanto — não são necessárias para este teste.)

### 3. Criar o usuário de teste

Em **Authentication → Users → Add user**, no painel do Supabase:

- **Email**: `contato@ssstrevisan.com.br`
- **Password**: `Trevisan@Teste2026`
- Se aparecer a opção **"Auto Confirm User"**, marque-a (evita depender do passo 1.4).

Isso já cria automaticamente a linha correspondente em `profiles` (via trigger).

### 4. Popular os dados fictícios da empresa

De volta ao **SQL Editor** do Supabase, cole e rode o conteúdo de `teste-pratico-login.sql` (anexo). Ele:

- Completa o cadastro da empresa (nome, CNPJ fictício, plano).
- Cria 2 imóveis de teste.
- Lança reservas deste mês e do mês passado (para o comparativo "▲/▼ % vs. mês anterior" aparecer).
- Lança despesas — inclusive uma **sem imóvel vinculado** (honorários), para testar o novo bloco de despesas gerais do negócio.
- Cria uma obrigação fiscal pendente.

### 5. Rodar e logar

```
npm install
npm run dev
```

Abra **http://localhost:3000** — vai redirecionar para `/login`. Entre com o e-mail e senha do passo 3 e você já cai na Home com o bloco **"Saúde financeira — set/26"** populado com os números de teste.

## Se quiser um link público de verdade (não só local)

Depois de validar localmente, o próximo passo é publicar na Vercel (import do repositório Git + as mesmas variáveis de ambiente do `.env.local`) — aí sim você tem um link público de verdade para acessar de qualquer lugar. Isso já está detalhado na seção "Publicar" do README do projeto; me avisa quando quiser que eu ajude com esse passo.
