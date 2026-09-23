# Portal do Cliente — Anfitrião Gestão e Contabilidade

Aplicação real (Next.js + Supabase) que implementa o escopo descrito em
`especificacao-tecnica-painel-cliente.md`: cada cliente entra com login próprio
e vê **só os próprios dados** — perfil, imóveis, rentabilidade/faturamento e
situação fiscal.

Isso é diferente do Painel Interno (o Artifact do Claude usado pela equipe hoje):
aqui existe banco de dados real (Postgres/Supabase) com autenticação e isolamento
de dados por linha (RLS) — o que um Artifact não consegue oferecer.

## O que já está pronto

- **Login** com e-mail/senha (Supabase Auth).
- **Home**: indicador "Regular / Em verificação / Pendência fiscal" calculado a
  partir das obrigações vencidas + status definido pela equipe, e (2026-09-12)
  um resumo de **saúde financeira do mês** (faturamento, despesas, repasse
  líquido, ocupação média e variação vs. o mês anterior) consolidando todos os
  imóveis do cliente — antes só existia esse tipo de número na aba
  Rentabilidade, imóvel por imóvel.
- **Perfil**: cliente edita os próprios dados (nome, tipo PF/PJ, documento,
  telefone, endereço). Plano e status fiscal são só leitura (controlados pela
  equipe).
- **Imóveis**: cliente cadastra/remove os próprios imóveis (nome, endereço,
  taxa de gestão, plataformas).
- **Rentabilidade**: ranking dos imóveis por lucro líquido dos últimos 6 meses
  e gráfico de barras do imóvel com melhor desempenho — mesma lógica de cálculo
  (`lib/metrics.ts`) já validada no Painel Interno da equipe (repasse = valor
  bruto das reservas − comissão de gestão − despesas).
- **Impostos**: lista de obrigações fiscais com badges de vencimento (pendente
  / vence em Nd / atrasada / pago). Somente leitura para o cliente — quem marca
  como pago é a equipe da Anfitrião (ver decisão abaixo).
- **Isolamento de dados por Row Level Security**: um cliente jamais consegue ler
  ou escrever dados de outro, mesmo manipulando a URL ou a API — a trava está
  no banco, não só na tela.
- **Emissão de NFS-e (2026-09-12)**: a equipe (papel `admin`) emite notas fiscais
  reais em `/admin/notas` — para o hóspede (CNPJ do próprio cliente) ou de
  honorários (Anfitrião → cliente) — via integração com um provedor de API
  fiscal (Focus NFe, por padrão). O cliente acompanha o status das próprias
  notas em `/notas`. Ver seção **"Emissão de NFS-e"** abaixo antes de usar —
  precisa de configuração e não foi testada contra a API real (ver limitações).

## O que NÃO está incluído (de propósito, ver a especificação técnica)

- **Lançamento de reservas, faturamento e impostos**: por enquanto só a equipe
  (papel `admin`) grava essas tabelas — o cliente só visualiza. Isso ainda
  precisa de uma tela interna (fora deste projeto) ou de uma integração que
  replique os dados já existentes no Painel Interno da equipe.
- **Integração real com Airbnb/Booking**: continua exigindo certificação de
  parceiro PMS — não é um problema de código.
- **Recuperação de senha / cadastro público**: as contas de cliente devem ser
  criadas pela equipe da Anfitrião (ver "Como criar um cliente" abaixo); não há
  tela de "criar conta" para não permitir cadastro aberto.

## ⚠️ Importante: build ainda não testado ponta a ponta

Neste ambiente (sandbox do Claude), a política de rede da organização bloqueou
o acesso ao `registry.npmjs.org`, então não foi possível rodar `npm install` /
`npm run build` aqui. O código foi revisado com um checker de sintaxe
TypeScript/JSX isolado (sem erros de sintaxe encontrados), mas **rode
`npm install && npm run build` localmente ou deixe a Vercel buildar** antes de
confiar no deploy — é o primeiro passo abaixo.

## Como colocar em produção

### 1. Criar o projeto no Supabase

1. Crie uma conta/projeto em https://supabase.com (tem plano gratuito).
2. Em **SQL Editor**, cole e rode o conteúdo de
   `supabase/migrations/0001_init.sql` (cria as tabelas, os tipos e as
   políticas de RLS) e, em seguida, `0002_nfse.sql` (tabela de notas fiscais —
   só é necessária se for usar a emissão de NFS-e, mas não atrapalha deixar
   aplicada mesmo sem usar).
3. Em **Authentication → Providers**, deixe **Email** habilitado (já vem por
   padrão). Em **Authentication → URL Configuration**, desative "Enable email
   confirmations" se quiser que a equipe crie contas prontas para uso imediato
   (ou deixe ativado e envie o e-mail de confirmação ao cliente).
4. Em **Settings → API**, copie a **Project URL** e a **anon public key**.

### 2. Configurar as variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os valores do passo
anterior:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Rodar localmente (opcional, para testar antes do deploy)

```
npm install
npm run dev
```

Abra http://localhost:3000 — vai redirecionar para /login.

### 4. Criar o primeiro cliente (e o primeiro admin da equipe)

Ainda não existe tela de "criar conta" pública (decisão intencional — ver
acima). Para os primeiros usuários, crie manualmente no Supabase:

1. **Authentication → Users → Add user** → informe e-mail e senha do cliente.
   O gatilho do banco (`on_auth_user_created`) já cria a linha correspondente
   em `profiles` automaticamente.
2. Para dar acesso de **equipe** (`admin`) a alguém — por exemplo você mesmo,
   Jorgesson ou Jefferson — abra **Table Editor → profiles**, ache a linha da
   pessoa e mude a coluna `papel` de `cliente` para `admin`. Um usuário
   `admin` consegue ler/escrever os dados de todos os clientes (é quem lança
   reservas, despesas e obrigações fiscais, por enquanto direto pelo Table
   Editor do Supabase, até que exista uma tela interna dedicada).
3. Cadastre os imóveis, reservas, lançamentos e obrigações de teste pelo
   **Table Editor** do Supabase para ver as telas populadas.

### 5. Emissão de NFS-e (opcional, mas é o que automatiza a nota fiscal)

Escolhemos o **Focus NFe** como provedor padrão (é um dos seis levantados no
briefing do projeto: Focus NFe, PlugNotas, eNotas, Nuvem Fiscal, TecnoSpeed,
Notaas — qualquer um resolveria, esse já veio implementado). A integração
inteira está isolada em `lib/nfse/` atrás de uma interface (`NfseProvider`) —
trocar de provedor depois é escrever um novo arquivo que implemente a mesma
interface, sem mexer nas telas nem nas server actions.

1. **Criar conta no Focus NFe** (https://focusnfe.com.br) e, no painel deles,
   **cadastrar a empresa (prestador)** — é nessa etapa que se sobe o CNPJ e o
   **certificado digital A1** do cliente (ou da própria Anfitrião, para as
   notas de honorários). Cada empresa cadastrada lá gera o **seu próprio
   token** de API.
2. Comece pelo ambiente de **homologação** (testes, não gera nota de verdade
   na prefeitura) antes de ir para produção.
3. Preencha no `.env.local`:
   ```
   FOCUSNFE_TOKEN=token-da-empresa-no-focus-nfe
   FOCUSNFE_BASE_URL=https://homologacao.focusnfe.com.br
   # depois de validar em homologação, troque para produção:
   # FOCUSNFE_BASE_URL=https://api.focusnfe.com.br
   ```
4. Se for emitir notas de **honorários** (Anfitrião → cliente), preencha
   também os dados da própria Anfitrião como prestadora:
   ```
   ANFITRIAO_CNPJ=
   ANFITRIAO_RAZAO_SOCIAL=
   ANFITRIAO_INSCRICAO_MUNICIPAL=
   ```
5. Garanta que cada cliente que vai emitir nota para hóspede tem o campo
   **Documento (CNPJ)** preenchido em `/perfil` — é o que vira o `cpf_cnpj` do
   prestador na chamada ao Focus NFe.
6. A equipe emite em **`/admin/notas`** (só aparece no menu para usuários com
   `papel = 'admin'`); o cliente acompanha o status em **`/notas`**.

⚠️ **Isto não foi testado contra a API real do Focus NFe.** O formato do
endpoint, a autenticação e os nomes de campo em `lib/nfse/focusnfe.ts` foram
conferidos na documentação oficial (https://doc.focusnfe.com.br/) em
2026-09-12 — não é um palpite —, mas este ambiente de desenvolvimento não
consegue chamar APIs externas (mesma restrição de rede já documentada no
resto deste projeto), então nenhuma chamada real foi feita. Cada prefeitura
tem particularidades (código de serviço da LC 116/2003, alíquota, campos
obrigatórios) que só aparecem testando de verdade em homologação. **Emita
2–3 notas de teste em homologação e confira o retorno antes de liberar para
o time usar em produção.**

### 6. Publicar (Vercel, recomendado)

1. Suba este projeto para um repositório Git (GitHub, por exemplo).
2. Em https://vercel.com, importe o repositório.
3. Nas variáveis de ambiente do projeto na Vercel, adicione as variáveis do
   passo 2 (Supabase) e, se for usar a emissão de NFS-e, as do passo 5
   (Focus NFe/Anfitrião).
4. Deploy. A Vercel builda automaticamente a cada push.
5. Aponte um subdomínio (ex.: `portal.anfitriaocontabilidade.com.br`) para o
   deploy da Vercel, se quiser usar o domínio próprio.

## Estrutura do projeto

```
app/
  login/            login (Supabase Auth)
  page.tsx          Home (status fiscal)
  perfil/           dados cadastrais do cliente
  imoveis/          CRUD de imóveis do cliente
  rentabilidade/    ranking + gráfico de lucratividade
  impostos/         obrigações fiscais (leitura)
  notas/            notas fiscais do cliente (leitura + link do PDF)
  admin/notas/      emissão de NFS-e pela equipe (restrito a papel=admin)
components/         NavBar, StatusBadge, NotaFiscalBadge, BarChart, RankingTable
lib/
  supabase/         clients Supabase (server, browser, middleware)
  metrics.ts        cálculo de repasse/ocupação/ranking (porta do Painel Interno)
  admin.ts          checa se o usuário autenticado é da equipe (papel=admin)
  nfse/             integração de emissão de NFS-e (types.ts = interface do
                     provedor; focusnfe.ts = adapter do Focus NFe; index.ts =
                     provedor ativo + dados da Anfitrião como prestadora)
middleware.ts       protege rotas: redireciona para /login se não autenticado
supabase/migrations/
  0001_init.sql     schema base + RLS
  0002_nfse.sql     tabela notas_fiscais + RLS
```

## Próximos passos sugeridos

1. Testar o build (`npm install && npm run build`) e o fluxo completo com um
   cliente de teste.
2. Decidir se o cliente pode marcar imposto como pago sozinho ou se isso deve
   continuar exclusivo da equipe (hoje está travado para a equipe — ver
   `obrigacoes_write_admin` na migration; é só remover essa restrição e
   liberar update ao próprio dono, se decidirem mudar).
3. Construir uma tela interna simples (ou estender o Painel Interno existente)
   para a equipe lançar reservas/lançamentos/obrigações direto por uma UI, em
   vez de usar o Table Editor do Supabase.
4. Criar a conta no Focus NFe, cadastrar a(s) empresa(s) (CNPJ + certificado
   digital A1) e emitir algumas notas de teste em homologação (ver seção
   "Emissão de NFS-e" acima) antes de liberar `/admin/notas` para o time usar
   valendo.
5. Quando fizer sentido, avaliar a integração de reservas via o PMS que cada
   cliente já usa (ver o briefing do projeto para o levantamento já feito).
