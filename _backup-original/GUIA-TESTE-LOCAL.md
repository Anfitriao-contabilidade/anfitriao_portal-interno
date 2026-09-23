# Guia rápido — rodar o Portal do Cliente no seu computador para teste

Isso deixa o Portal rodando em `http://localhost:3000`, só no seu PC, para você
cadastrar clientes/imóveis de teste e navegar pelas telas de verdade (com banco
de dados real, não dados fictícios). Leva uns 15–20 minutos na primeira vez.

Eu não consigo fazer os passos de "criar conta" por você (nem na Supabase, nem
rodar comandos no seu computador) — mas deixei tudo pronto para copiar/colar.
Se travar em algum passo, volte aqui e me diga onde parou.

## Passo 1 — Criar o projeto no Supabase (banco de dados + login)

1. Acesse **https://supabase.com**, crie uma conta grátis (ou entre, se já tiver) e clique em **"New Project"**.
2. Escolha um nome (ex.: `anfitriao-portal`), uma senha para o banco (guarde
   essa senha em algum lugar seguro — não precisa dela de novo aqui, mas é boa
   prática) e a região mais próxima do Brasil disponível.
3. Aguarde uns 2 minutos até o projeto ficar pronto.

## Passo 2 — Rodar as 7 migrations (cria as tabelas)

No painel do Supabase do seu projeto → menu **SQL Editor** → **New query**.

Cole e rode, **nesta ordem, uma de cada vez** (clique em "Run" depois de colar
cada uma antes de colar a próxima), o conteúdo de cada um destes 7 arquivos —
estão dentro do `anfitriao-portal-cliente.zip` que já te mandei, na pasta
`supabase/migrations/`:

1. `0001_init.sql` — cria as tabelas principais (perfis, imóveis, reservas, lançamentos, obrigações fiscais) e as regras de segurança (RLS).
2. `0002_nfse.sql` — tabela de notas fiscais (pode deixar aplicada mesmo se não for emitir nota agora).
3. `0003_perfil_atuacao.sql` — o campo "Perfil" (Proprietário/Co-Anfitrião) que adicionamos.
4. `0004_estoque.sql` — tabela de estoque por imóvel (aba "Estoque" do menu).
5. `0005_checklist_apto.sql` — tabela do checklist de prontidão por imóvel (aba "Checklist de prontidão" do menu).
6. `0006_imovel_detalhes.sql` — tipo, estado de conservação, metragem, quartos, salas, banheiros e endereço estruturado (CEP/rua/número/bairro/cidade/UF) no cadastro de imóvel (aba "Imóveis").
7. `0007_nota_comissao.sql` — novo tipo de nota fiscal "comissão" (Co-Anfitrião), usado no rascunho gerado a partir do split de comissão em `/admin/notas`.

Se alguma delas der erro, copie a mensagem de erro e me mande.

## Passo 3 — Pegar as chaves de acesso

No mesmo painel → **Settings → API**. Copie dois valores:

- **Project URL**
- **anon public key**

## Passo 4 — Extrair o projeto e configurar

1. Extraia o `anfitriao-portal-cliente.zip` numa pasta no seu computador (ex.: `Documentos\anfitriao-portal-cliente`).
2. Dentro dessa pasta, copie o arquivo `.env.example` e renomeie a cópia para `.env.local`.
3. Abra o `.env.local` num editor de texto e preencha as duas primeiras linhas com o que você copiou no Passo 3:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole-aqui-a-anon-key
```

Pode deixar as linhas do Focus NFe (`FOCUSNFE_TOKEN` etc.) em branco por
enquanto — só são necessárias se for testar emissão de nota fiscal.

## Passo 5 — Instalar e rodar

Seu computador já tem Node.js instalado. Abra um terminal **dentro dessa
pasta** (no Explorador de Arquivos, na barra de endereço, digite `cmd` e
Enter — abre o terminal já na pasta certa) e rode, um comando de cada vez:

```
npm install
npm run dev
```

O primeiro comando demora um pouco (baixa as dependências). Quando aparecer
algo como `Local: http://localhost:3000`, abra esse endereço no navegador —
deve cair na tela de login.

## Passo 6 — Criar seu usuário admin e um cliente de teste

Ainda não existe tela de "criar conta" pública (de propósito — só a equipe
cria contas). Crie manualmente pelo Supabase:

1. No painel do Supabase → **Authentication → Users → Add user** — crie um
   usuário para **você** (seu e-mail + uma senha), e outro para um **cliente
   de teste** (pode ser um e-mail qualquer, tipo `teste@exemplo.com`).
2. Vá em **Table Editor → profiles**. Você vai ver duas linhas novas (criadas
   automaticamente). Ache a linha com o **seu** e-mail e mude a coluna `papel`
   de `cliente` para `admin` — assim você entra com acesso de equipe (vê a
   aba "Clientes", "Admin · Emitir notas" etc).
3. Volte para `http://localhost:3000`, entre com seu login de admin. Você já
   deve ver a aba **Clientes** no menu lateral (grupo "Equipe"), com o cliente
   de teste listado — dá para editar o cadastro dele por ali (nome, perfil,
   plano, status fiscal).
4. Para testar como o **cliente** vê o sistema, saia (Deslogar) e entre com o
   login do cliente de teste — cadastre um imóvel na aba Imóveis, veja a Home,
   Financeiro, etc.

**Atalho — usar o mesmo cliente de exemplo que já existe no Painel Interno:**
em vez de digitar um cadastro de teste manualmente, dá para usar o arquivo
`supabase/seed_cliente_teste.sql` (dentro do zip) para preencher automaticamente
o cadastro e o imóvel do mesmo cliente-exemplo "S S S Trevisan Consultoria e
Assessoria" / imóvel "AP 402 - CRISTO" que já existe no Painel Interno da
equipe. Passo a passo: crie o usuário de login com o e-mail
`adm.trevisancontabil@gmail.com` (Passo 1 acima, com qualquer senha), depois
cole o conteúdo de `seed_cliente_teste.sql` inteiro no SQL Editor e rode —
o script preenche nome, CNPJ, plano e demais campos do perfil e cadastra o
imóvel automaticamente (não precisa editar nada pelo Table Editor). Pode rodar
de novo sem duplicar o imóvel.

Reservas, lançamentos financeiros e obrigações fiscais ainda não têm tela de
cadastro pelo Portal (só a equipe lança, e por enquanto direto pelo **Table
Editor** do Supabase, nas tabelas `reservas`, `lancamentos` e
`obrigacoes_fiscais`) — é a limitação já registrada no `README.md` do
projeto. Cadastrar um imóvel e alguns lançamentos manualmente ali já é
suficiente para ver as telas de Financeiro/Operação/Rentabilidade populadas.

## Se algo der errado

- Erro do `npm install` ou `npm run dev`: copie a mensagem de erro completa
  e me mande — como não consigo rodar comandos no seu computador, preciso
  do texto exato do erro para ajudar a diagnosticar.
- Tela em branco ou erro ao logar: confira se `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local` estão exatamente iguais ao
  que está em Settings → API no Supabase (sem espaço extra, sem aspas).
