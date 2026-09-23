-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Checklist de prontidão do imóvel: a partir do checklist de itens
-- essenciais para apartamento de temporada (7 categorias, 83 itens), o
-- proprietário/co-anfitrião (ou a equipe) marca os itens que o imóvel tem, e
-- o sistema calcula uma nota de 0 a 10 (peso igual por categoria) mostrando
-- quão pronto o imóvel está para operar, com sugestões para os itens ainda
-- não marcados.
--
-- Decisões desta rodada (usuário, via perguntas de escopo — mesmas do
-- Painel Interno):
--   - Tanto o dono do imóvel (aqui) quanto a equipe (Painel Interno) podem
--     marcar os itens — mas cada sistema guarda sua própria marcação
--     (bancos diferentes, sem sincronização — mesma limitação do Estoque).
--   - Os itens que o checklist original descreve como opcionais contam
--     igual a todos os outros na nota — sem tratamento especial.
--   - Nota calculada no código do app (lib/checklistApto.ts), não no banco:
--     aqui só guardamos os itens marcados (jsonb), como um mapa
--     { "c<categoria>_i<item>": true }.
--
-- Como aplicar: supabase db push  (ou colar no SQL Editor do painel do Supabase)

create table public.checklist_apto (
  imovel_id uuid primary key references public.imoveis(id) on delete cascade,
  itens jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

comment on table public.checklist_apto is
  'Checklist de prontidão de cada imóvel (7 categorias, 83 itens essenciais) — itens marcados como mapa jsonb; a nota de 0 a 10 (peso igual por categoria) é calculada no app, não no banco.';

alter table public.checklist_apto enable row level security;

-- Mesmo padrão de "imoveis"/"estoque_itens": o dono do imóvel marca o
-- próprio checklist; a equipe (admin) marca o de qualquer cliente.
create policy "checklist_apto_select_owner_or_admin" on public.checklist_apto
  for select using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = checklist_apto.imovel_id and i.owner_id = auth.uid()
    )
  );
create policy "checklist_apto_insert_owner_or_admin" on public.checklist_apto
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = checklist_apto.imovel_id and i.owner_id = auth.uid()
    )
  );
create policy "checklist_apto_update_owner_or_admin" on public.checklist_apto
  for update using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = checklist_apto.imovel_id and i.owner_id = auth.uid()
    )
  );
create policy "checklist_apto_delete_owner_or_admin" on public.checklist_apto
  for delete using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = checklist_apto.imovel_id and i.owner_id = auth.uid()
    )
  );
