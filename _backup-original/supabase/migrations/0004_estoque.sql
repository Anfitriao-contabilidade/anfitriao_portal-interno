-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Estoque por imóvel: o que cada apartamento tem (enxoval, cozinha, sala,
-- banheiro, materiais de limpeza etc.), com quantidade, nome/marca e um valor
-- de referência (patrimonial). Espelha a aba "Estoque" adicionada no Painel
-- Interno da equipe (rascunho do usuário: Clientes → Imóveis → Estoque).
--
-- Decisões desta rodada (usuário, via perguntas de escopo):
--   - Aba própria no menu (não embutida no cadastro do imóvel).
--   - O campo "Valor" é só informativo — não entra em DRE, repasse ou
--     comissão; por isso não há nenhuma trigger/coluna derivada aqui.
--   - Grupo e Tipo são texto livre (o cliente/equipe pode criar novos
--     grupos e tipos) — por isso não há tabelas de categoria separadas,
--     só uma coluna text em cada. A lista "semente" (Enxoval, Cozinha,
--     Sala, Banheiro, Materiais de limpeza) vive só no front-end.
--
-- Diferente de reservas/lançamentos/obrigações fiscais (escrita só da
-- equipe), o estoque é mais parecido com o cadastro de imóveis: quem lança
-- a própria mobília é o cliente (ou a equipe, no Painel Interno) — por
-- isso a policy de escrita segue o mesmo padrão de "imoveis" (dono ou
-- admin), não o padrão "write_admin" usado nas tabelas financeiras.
--
-- Como aplicar: supabase db push  (ou colar no SQL Editor do painel do Supabase)

create table public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid not null references public.imoveis(id) on delete cascade,
  grupo text not null,
  tipo text not null,
  quantidade integer not null default 1,
  nome_marca text,
  valor numeric(12,2),                 -- informativo — não entra em cálculo financeiro nenhum
  criado_em timestamptz not null default now()
);

comment on table public.estoque_itens is
  'Patrimônio/estoque de cada imóvel (enxoval, cozinha, sala, banheiro, materiais de limpeza etc.). O valor é só de referência — não é usado em DRE, repasse ou split de comissão.';

alter table public.estoque_itens enable row level security;

-- estoque_itens: mesmo padrão de "imoveis" — o dono do imóvel gerencia o
-- próprio estoque; a equipe (admin) gerencia o de qualquer cliente.
create policy "estoque_select_owner_or_admin" on public.estoque_itens
  for select using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = estoque_itens.imovel_id and i.owner_id = auth.uid()
    )
  );
create policy "estoque_insert_owner_or_admin" on public.estoque_itens
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = estoque_itens.imovel_id and i.owner_id = auth.uid()
    )
  );
create policy "estoque_update_owner_or_admin" on public.estoque_itens
  for update using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = estoque_itens.imovel_id and i.owner_id = auth.uid()
    )
  );
create policy "estoque_delete_owner_or_admin" on public.estoque_itens
  for delete using (
    public.is_admin() or exists (
      select 1 from public.imoveis i where i.id = estoque_itens.imovel_id and i.owner_id = auth.uid()
    )
  );

create index estoque_itens_imovel_id_idx on public.estoque_itens(imovel_id);
