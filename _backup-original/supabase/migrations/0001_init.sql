-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Schema inicial: perfis, imóveis, reservas, lançamentos financeiros e obrigações fiscais.
-- Isolamento de dados por cliente via Row Level Security (RLS).
--
-- Como aplicar: supabase db push  (ou colar no SQL Editor do painel do Supabase)

-- ---------------------------------------------------------------------------
-- 1. Perfis (um por usuário autenticado; espelha auth.users)
-- ---------------------------------------------------------------------------
create type public.tipo_pessoa as enum ('PF', 'PJ');
create type public.status_fiscal as enum ('regular', 'em_verificacao', 'pendencia');
create type public.papel_usuario as enum ('cliente', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  papel public.papel_usuario not null default 'cliente',
  nome text not null,
  tipo public.tipo_pessoa not null default 'PF',
  documento text,                      -- CPF ou CNPJ
  telefone text,
  endereco text,
  plano text,                          -- Básico / Padrão / Experts Essencial (espelha o painel interno)
  status_fiscal public.status_fiscal not null default 'regular',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.profiles is 'Dados cadastrais do cliente (ou membro da equipe, papel=admin). id = auth.users.id.';

-- ---------------------------------------------------------------------------
-- 2. Imóveis
-- ---------------------------------------------------------------------------
create table public.imoveis (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  nome text not null,
  endereco text,
  taxa_gestao_pct numeric(5,2) not null default 18.00,   -- % cobrado sobre as reservas
  plataformas text[] not null default '{}',              -- ex.: {airbnb,booking}
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Reservas (Channel Manager — lançamento manual/simulado nesta fase)
-- ---------------------------------------------------------------------------
create type public.plataforma_reserva as enum ('airbnb', 'booking', 'direta', 'outra');

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  hospede text,
  plataforma public.plataforma_reserva not null default 'airbnb',
  checkin date not null,
  checkout date not null,
  valor_bruto numeric(12,2) not null default 0,
  criado_em timestamptz not null default now(),
  constraint checkout_apos_checkin check (checkout > checkin)
);

-- ---------------------------------------------------------------------------
-- 4. Lançamentos financeiros (despesas/receitas avulsas por imóvel)
-- ---------------------------------------------------------------------------
create type public.tipo_lancamento as enum ('receita', 'despesa');
create type public.status_lancamento as enum ('pendente', 'confirmado');

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  imovel_id uuid references public.imoveis(id) on delete set null,
  tipo public.tipo_lancamento not null,
  categoria text not null,
  valor numeric(12,2) not null,
  data date not null default current_date,
  status public.status_lancamento not null default 'confirmado',
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Obrigações fiscais / impostos
-- ---------------------------------------------------------------------------
create type public.status_obrigacao as enum ('pendente', 'pago');

create table public.obrigacoes_fiscais (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null,                 -- DAS, DAS-MEI, NFS-e, IRPF, Simples Nacional, Honorários, Outro
  descricao text,
  competencia text,                   -- 'YYYY-MM'
  vencimento date not null,
  valor numeric(12,2),
  status public.status_obrigacao not null default 'pendente',
  pago_em timestamptz,
  confirmado_por uuid references public.profiles(id),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Função utilitária: o usuário autenticado é admin (equipe Anfitrião)?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and papel = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.imoveis enable row level security;
alter table public.reservas enable row level security;
alter table public.lancamentos enable row level security;
alter table public.obrigacoes_fiscais enable row level security;

-- profiles: cada cliente vê/edita o próprio perfil; admin vê/edita todos
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin() or id = auth.uid());

-- imoveis: cliente só enxerga/edita os próprios imóveis; admin, todos
create policy "imoveis_select_own_or_admin" on public.imoveis
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "imoveis_insert_own_or_admin" on public.imoveis
  for insert with check (owner_id = auth.uid() or public.is_admin());
create policy "imoveis_update_own_or_admin" on public.imoveis
  for update using (owner_id = auth.uid() or public.is_admin());
create policy "imoveis_delete_own_or_admin" on public.imoveis
  for delete using (owner_id = auth.uid() or public.is_admin());

-- reservas: leitura para o dono do imóvel; escrita só para admin (lançado pela equipe/Channel Manager)
create policy "reservas_select_owner_or_admin" on public.reservas
  for select using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = reservas.imovel_id and i.owner_id = auth.uid()
    )
  );
create policy "reservas_write_admin" on public.reservas
  for all using (public.is_admin()) with check (public.is_admin());

-- lancamentos: leitura para o dono; escrita só para admin (equipe da contabilidade lança)
create policy "lancamentos_select_own_or_admin" on public.lancamentos
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "lancamentos_write_admin" on public.lancamentos
  for all using (public.is_admin()) with check (public.is_admin());

-- obrigacoes_fiscais: leitura para o dono; escrita só para admin
-- (decisão default: cliente NÃO marca imposto como pago sozinho — ver especificação técnica, item 4,
--  mais seguro do ponto de vista contábil; ajustar policy de update se o usuário decidir o contrário)
create policy "obrigacoes_select_own_or_admin" on public.obrigacoes_fiscais
  for select using (owner_id = auth.uid() or public.is_admin());
create policy "obrigacoes_write_admin" on public.obrigacoes_fiscais
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Trigger: cria automaticamente uma linha em profiles quando um usuário se
-- autentica pela primeira vez (evita depender só de inserção manual pela equipe).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, tipo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'PF')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
