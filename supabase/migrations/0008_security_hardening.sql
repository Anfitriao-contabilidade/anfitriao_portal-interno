-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- 0008 — Endurecimento de segurança (revisão 2026-09)
--
-- Corrige e reforça:
--   1. ESCALADA DE PRIVILÉGIO: a policy profiles_update_own_or_admin deixava o
--      próprio cliente alterar papel/plano/status_fiscal/perfil_atuacao do seu
--      perfil (ex.: virar 'admin' via API). Agora um trigger bloqueia isso.
--   2. Policies de UPDATE sem WITH CHECK (um dono podia "transferir" um imóvel
--      para outro owner_id). Recriadas com WITH CHECK.
--   3. Funções SECURITY DEFINER sem search_path fixo.
--   4. Constraints de domínio (valores negativos, UF, competência, tamanhos).
--   5. Log de auditoria imutável das alterações em dados sensíveis
--      (requisito 7 da especificação técnica: "quem marcou imposto como pago").
--   6. Carimbo automático de pago_em/confirmado_por nas obrigações fiscais.
--   7. Índices para as colunas usadas nas policies de RLS (desempenho).
--
-- Idempotente: pode ser executado mais de uma vez.
-- Como aplicar: supabase db push (ou colar no SQL Editor, depois de 0001..0007).

-- ---------------------------------------------------------------------------
-- 1. is_admin() com search_path fixo
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and papel = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Campos de profiles controlados só pela equipe
-- ---------------------------------------------------------------------------
create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Só restringe requisições de usuários logados pela API (papel "authenticated").
  -- SQL Editor / service_role / o trigger handle_new_user não são afetados.
  if coalesce(auth.role(), '') <> 'authenticated' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.papel := 'cliente';
    new.status_fiscal := 'regular';
    new.plano := null;
    new.perfil_atuacao := 'proprietario';
    return new;
  end if;

  if new.id is distinct from old.id
     or new.papel is distinct from old.papel
     or new.plano is distinct from old.plano
     or new.status_fiscal is distinct from old.status_fiscal
     or new.perfil_atuacao is distinct from old.perfil_atuacao
     or new.criado_em is distinct from old.criado_em then
    raise exception 'Campo controlado pela equipe da Anfitrião'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_campos_perfil on public.profiles;
create trigger proteger_campos_perfil
  before insert or update on public.profiles
  for each row execute function public.proteger_campos_perfil();

-- ---------------------------------------------------------------------------
-- 3. Policies com WITH CHECK
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Perfis novos são criados pelo trigger handle_new_user (SECURITY DEFINER);
-- via API, só a equipe insere.
drop policy if exists "profiles_insert_admin" on public.profiles;
create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "imoveis_update_own_or_admin" on public.imoveis;
create policy "imoveis_update_own_or_admin" on public.imoveis
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "estoque_update_owner_or_admin" on public.estoque_itens;
create policy "estoque_update_owner_or_admin" on public.estoque_itens
  for update using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = estoque_itens.imovel_id and i.owner_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = estoque_itens.imovel_id and i.owner_id = auth.uid()
    )
  );

drop policy if exists "checklist_apto_update_owner_or_admin" on public.checklist_apto;
create policy "checklist_apto_update_owner_or_admin" on public.checklist_apto
  for update using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = checklist_apto.imovel_id and i.owner_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = checklist_apto.imovel_id and i.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Constraints de domínio
-- NOT VALID: valem para toda escrita nova sem travar a migration caso exista
-- algum dado antigo fora do padrão. Depois de conferir os dados, rode
-- "alter table ... validate constraint ..." para validar o histórico.
-- ---------------------------------------------------------------------------
-- documento passa a ser guardado só com dígitos (o app já normaliza).
update public.profiles
   set documento = nullif(regexp_replace(documento, '\D', '', 'g'), '')
 where documento is not null and documento ~ '\D';

do $$
declare
  c record;
begin
  for c in
    select * from (values
      ('profiles',           'profiles_nome_tamanho',        'check (char_length(nome) between 1 and 160)'),
      ('profiles',           'profiles_documento_digitos',   'check (documento is null or documento ~ ''^[0-9]{11}$|^[0-9]{14}$'')'),
      ('imoveis',            'imoveis_taxa_faixa',           'check (taxa_gestao_pct between 0 and 100)'),
      ('imoveis',            'imoveis_nome_tamanho',         'check (char_length(nome) between 1 and 120)'),
      ('imoveis',            'imoveis_uf_formato',           'check (uf is null or uf ~ ''^[A-Z]{2}$'')'),
      ('imoveis',            'imoveis_cep_formato',          'check (cep is null or cep ~ ''^[0-9]{8}$'')'),
      ('imoveis',            'imoveis_comodos_nao_negativos','check (coalesce(quartos,0) >= 0 and coalesce(salas,0) >= 0 and coalesce(banheiros,0) >= 0 and coalesce(metragem,0) >= 0)'),
      ('imoveis',            'imoveis_plataformas_limite',   'check (coalesce(array_length(plataformas, 1), 0) <= 10)'),
      ('reservas',           'reservas_valor_nao_negativo',  'check (valor_bruto >= 0)'),
      ('lancamentos',        'lancamentos_valor_nao_negativo','check (valor >= 0)'),
      ('obrigacoes_fiscais', 'obrigacoes_valor_nao_negativo','check (valor is null or valor >= 0)'),
      ('obrigacoes_fiscais', 'obrigacoes_competencia_formato','check (competencia is null or competencia ~ ''^[0-9]{4}-(0[1-9]|1[0-2])$'')'),
      ('notas_fiscais',      'notas_valor_positivo',         'check (valor > 0)'),
      ('notas_fiscais',      'notas_competencia_formato',    'check (competencia is null or competencia ~ ''^[0-9]{4}-(0[1-9]|1[0-2])$'')'),
      ('estoque_itens',      'estoque_quantidade_positiva',  'check (quantidade >= 1)'),
      ('estoque_itens',      'estoque_valor_nao_negativo',   'check (valor is null or valor >= 0)')
    ) as t(tabela, nome, definicao)
  loop
    if not exists (select 1 from pg_constraint where conname = c.nome) then
      execute format('alter table public.%I add constraint %I %s not valid', c.tabela, c.nome, c.definicao);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Carimbo de pagamento das obrigações fiscais
-- ---------------------------------------------------------------------------
create or replace function public.carimbar_pagamento_obrigacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pago' and (tg_op = 'INSERT' or old.status is distinct from 'pago') then
    new.pago_em := coalesce(new.pago_em, now());
    new.confirmado_por := coalesce(auth.uid(), new.confirmado_por);
  elsif new.status = 'pendente' then
    new.pago_em := null;
    new.confirmado_por := null;
  end if;
  return new;
end;
$$;

drop trigger if exists carimbar_pagamento_obrigacao on public.obrigacoes_fiscais;
create trigger carimbar_pagamento_obrigacao
  before insert or update of status on public.obrigacoes_fiscais
  for each row execute function public.carimbar_pagamento_obrigacao();

-- atualizado_em automático
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists tocar_atualizado_em on public.profiles;
create trigger tocar_atualizado_em before update on public.profiles
  for each row execute function public.tocar_atualizado_em();
drop trigger if exists tocar_atualizado_em on public.notas_fiscais;
create trigger tocar_atualizado_em before update on public.notas_fiscais
  for each row execute function public.tocar_atualizado_em();
drop trigger if exists tocar_atualizado_em on public.checklist_apto;
create trigger tocar_atualizado_em before update on public.checklist_apto
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------------
-- 6. Log de auditoria (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  ocorrido_em timestamptz not null default now(),
  ator uuid,                          -- auth.uid() de quem fez a alteração (null = sistema/SQL)
  tabela text not null,
  registro_id text,
  acao text not null check (acao in ('INSERT', 'UPDATE', 'DELETE')),
  campos_alterados text[],
  dados_antigos jsonb,
  dados_novos jsonb
);

comment on table public.audit_log is
  'Trilha de auditoria imutável das alterações em dados sensíveis (LGPD / controle contábil). Escrita apenas por trigger; leitura apenas pela equipe (admin).';

create index if not exists audit_log_tabela_registro_idx on public.audit_log (tabela, registro_id, ocorrido_em desc);
create index if not exists audit_log_ator_idx on public.audit_log (ator, ocorrido_em desc);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_select_admin" on public.audit_log;
create policy "audit_log_select_admin" on public.audit_log
  for select using (public.is_admin());
-- Sem policies de insert/update/delete: via API ninguém escreve, altera ou apaga.
revoke insert, update, delete, truncate on public.audit_log from anon, authenticated;

create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  antigo jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  novo   jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  alterados text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into alterados
    from jsonb_each(novo) n
    where n.key <> 'atualizado_em' and (antigo -> n.key) is distinct from n.value;
    if alterados is null then
      return new; -- nada mudou de fato
    end if;
  end if;

  insert into public.audit_log (ator, tabela, registro_id, acao, campos_alterados, dados_antigos, dados_novos)
  values (
    auth.uid(),
    tg_table_name,
    coalesce(novo ->> 'id', antigo ->> 'id', novo ->> 'imovel_id', antigo ->> 'imovel_id'),
    tg_op,
    alterados,
    antigo,
    novo
  );
  return coalesce(new, old);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'imoveis', 'reservas', 'lancamentos', 'obrigacoes_fiscais',
    'notas_fiscais', 'estoque_itens', 'checklist_apto'
  ]
  loop
    execute format('drop trigger if exists auditoria on public.%I', t);
    execute format(
      'create trigger auditoria after insert or update or delete on public.%I
         for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Índices usados pelas policies de RLS
-- ---------------------------------------------------------------------------
create index if not exists imoveis_owner_idx on public.imoveis (owner_id);
create index if not exists reservas_imovel_checkin_idx on public.reservas (imovel_id, checkin);
create index if not exists lancamentos_owner_data_idx on public.lancamentos (owner_id, data desc);
create index if not exists obrigacoes_owner_venc_idx on public.obrigacoes_fiscais (owner_id, vencimento);

-- ---------------------------------------------------------------------------
-- 8. Funções internas não devem ser chamáveis diretamente pela API (RPC)
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.registrar_auditoria() from public, anon, authenticated;
revoke execute on function public.proteger_campos_perfil() from public, anon, authenticated;
revoke execute on function public.carimbar_pagamento_obrigacao() from public, anon, authenticated;
