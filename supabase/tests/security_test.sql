-- Testes de segurança do banco (RLS + triggers da 0008).
--
-- Como rodar (NUNCA em produção — use um projeto Supabase de teste ou um
-- Postgres local):
--   1. Postgres local: rode antes 00_stub_postgres_local.sql. Num projeto
--      Supabase de TESTE, pule esse passo (auth já existe).
--   2. Aplique supabase/migrations/0001..0008 em ordem.
--   3. Rode o bloco "TESTES". Cada linha "deve FALHAR" precisa terminar em ERROR;
--      as demais em sucesso. Resultado esperado validado em 2026-09-22 (17/17).
--
-- ================================ TESTES ================================
\set ON_ERROR_STOP 0
insert into auth.users (id,email) values
 ('00000000-0000-0000-0000-00000000000a','a@x.com'),
 ('00000000-0000-0000-0000-00000000000b','b@x.com'),
 ('00000000-0000-0000-0000-0000000000ad','adm@x.com');
update public.profiles set papel='admin' where id='00000000-0000-0000-0000-0000000000ad';
insert into public.imoveis (id, owner_id, nome) values ('10000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000b','Imovel B');

-- ===== como cliente A =====
set role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}',false);
\echo T1 escalar para admin (deve FALHAR)
update public.profiles set papel='admin' where id=auth.uid();
\echo T2 mudar status_fiscal (deve FALHAR)
update public.profiles set status_fiscal='regular', plano='Premium' where id=auth.uid();
\echo T3 editar nome/documento (deve funcionar: UPDATE 1)
update public.profiles set nome='Cliente A', documento='12345678000195' where id=auth.uid();
\echo T3b documento com pontuação (deve FALHAR constraint)
update public.profiles set documento='123.456' where id=auth.uid();
\echo T4 ler perfil de B (deve retornar 0)
select count(*) as perfis_de_b from public.profiles where id='00000000-0000-0000-0000-00000000000b';
\echo T5 criar imovel em nome de B (deve FALHAR)
insert into public.imoveis (owner_id, nome) values ('00000000-0000-0000-0000-00000000000b','Hack');
\echo T6 criar imovel próprio (ok)
insert into public.imoveis (id, owner_id, nome, taxa_gestao_pct) values ('10000000-0000-0000-0000-00000000000a', auth.uid(),'Imovel A', 18);
\echo T7 transferir imovel para B (deve FALHAR - with check)
update public.imoveis set owner_id='00000000-0000-0000-0000-00000000000b' where id='10000000-0000-0000-0000-00000000000a';
\echo T8 taxa 150% (deve FALHAR constraint)
update public.imoveis set taxa_gestao_pct=150 where id='10000000-0000-0000-0000-00000000000a';
\echo T9 lancar obrigacao fiscal (deve FALHAR)
insert into public.obrigacoes_fiscais (owner_id, tipo, vencimento) values (auth.uid(),'DAS','2026-10-20');
\echo T10 estoque em imovel de B (deve FALHAR)
insert into public.estoque_itens (imovel_id, grupo, tipo) values ('10000000-0000-0000-0000-00000000000b','x','y');
\echo T11 ler audit_log (deve retornar 0)
select count(*) as audit_visivel from public.audit_log;
\echo T12 apagar audit_log (deve FALHAR permissão)
delete from public.audit_log;
\echo T13 inserir perfil (deve FALHAR)
insert into public.profiles (id, nome) values (gen_random_uuid(),'x');
\echo T14 chamar handle_new_user via RPC (deve FALHAR)
select public.handle_new_user();

-- ===== como admin =====
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000ad","role":"authenticated"}',false);
\echo T15 admin altera status_fiscal de A (ok)
update public.profiles set status_fiscal='pendencia' where id='00000000-0000-0000-0000-00000000000a';
\echo T16 admin lança e marca obrigação paga (carimbo)
insert into public.obrigacoes_fiscais (id, owner_id, tipo, vencimento, valor) values ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-00000000000a','DAS','2026-10-20', 99.9);
update public.obrigacoes_fiscais set status='pago' where id='20000000-0000-0000-0000-000000000001';
select status, pago_em is not null as tem_pago_em, confirmado_por from public.obrigacoes_fiscais;
\echo T17 trilha de auditoria (admin enxerga)
select tabela, acao, campos_alterados, ator from public.audit_log order by id;
reset role;
