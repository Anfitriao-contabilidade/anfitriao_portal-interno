-- ============================================================================
-- Seed de teste: S S S Trevisan Consultoria e Assessoria
-- ============================================================================
-- Rode isto no SQL Editor do Supabase DEPOIS de:
--   1. Ter aplicado supabase/migrations/0001_init.sql e 0002_nfse.sql
--   2. Ter criado o usuário em Authentication → Users → Add user, com o
--      e-mail contato@ssstrevisan.com.br (ver guia teste-pratico-login.md)
-- Todos os dados abaixo são fictícios, só para testar a tela — inclusive o
-- CNPJ, que não é um número real.
-- ============================================================================

-- 1) Perfil da empresa de teste (a linha em profiles já existe, criada
--    automaticamente pelo trigger on_auth_user_created quando você criou o
--    usuário — aqui só completamos os dados)
update public.profiles set
  nome = 'S S S Trevisan Consultoria e Assessoria',
  tipo = 'PJ',
  documento = '12345678000195', -- CNPJ fictício válido, só dígitos (constraint da 0008)
  telefone = '(74) 99999-0000',
  endereco = 'Rua Exemplo, 123 - Centro, Vitória da Conquista/BA',
  plano = 'Padrão',
  status_fiscal = 'regular'
where id = (select id from auth.users where email = 'contato@ssstrevisan.com.br');

-- 2) Dois imóveis de teste
insert into public.imoveis (owner_id, nome, endereco, taxa_gestao_pct, plataformas)
values
  ((select id from auth.users where email = 'contato@ssstrevisan.com.br'),
   'Flat Beira-Mar 101', 'Av. Atlântica, 500 - Ondina, Salvador/BA', 18, array['airbnb','booking']),
  ((select id from auth.users where email = 'contato@ssstrevisan.com.br'),
   'Casa Jardim das Palmeiras', 'Rua das Palmeiras, 45 - Jardim, Vitória da Conquista/BA', 20, array['airbnb']);

-- 3) Reservas deste mês e do mês passado (para o "▲/▼ X% vs mês anterior" da
--    Home aparecer com um valor de verdade em vez de ficar em branco)
insert into public.reservas (imovel_id, hospede, plataforma, checkin, checkout, valor_bruto)
values
  ((select id from public.imoveis where nome = 'Flat Beira-Mar 101'), 'Hóspede Teste 1', 'airbnb', '2026-09-03', '2026-09-08', 2100.00),
  ((select id from public.imoveis where nome = 'Flat Beira-Mar 101'), 'Hóspede Teste 2', 'airbnb', '2026-09-15', '2026-09-20', 2250.00),
  ((select id from public.imoveis where nome = 'Casa Jardim das Palmeiras'), 'Hóspede Teste 3', 'booking', '2026-09-05', '2026-09-10', 1800.00),
  ((select id from public.imoveis where nome = 'Flat Beira-Mar 101'), 'Hóspede Teste 4', 'airbnb', '2026-08-04', '2026-08-09', 1900.00),
  ((select id from public.imoveis where nome = 'Casa Jardim das Palmeiras'), 'Hóspede Teste 5', 'direta', '2026-08-12', '2026-08-16', 1500.00);

-- 4) Despesas vinculadas a imóvel + uma despesa geral do negócio (sem imóvel
--    vinculado — ex.: honorários de contabilidade), para ver o novo bloco
--    "Despesas do mês" com os dois tipos somados
insert into public.lancamentos (owner_id, imovel_id, tipo, categoria, valor, data)
values
  ((select id from auth.users where email = 'contato@ssstrevisan.com.br'),
   (select id from public.imoveis where nome = 'Flat Beira-Mar 101'), 'despesa', 'Limpeza', 180.00, '2026-09-06'),
  ((select id from auth.users where email = 'contato@ssstrevisan.com.br'),
   (select id from public.imoveis where nome = 'Casa Jardim das Palmeiras'), 'despesa', 'Manutenção', 320.00, '2026-09-10'),
  ((select id from auth.users where email = 'contato@ssstrevisan.com.br'),
   null, 'despesa', 'Honorários de contabilidade', 295.00, '2026-09-05');

-- 5) Uma obrigação fiscal pendente (aparece no card "Obrigações em aberto" da Home)
insert into public.obrigacoes_fiscais (owner_id, tipo, descricao, competencia, vencimento, valor, status)
values
  ((select id from auth.users where email = 'contato@ssstrevisan.com.br'),
   'DAS', 'DAS Simples Nacional', '2026-09', '2026-09-20', 410.00, 'pendente');
