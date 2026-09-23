-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Seed: cadastra no Portal o MESMO cliente e imóvel de exemplo que já existe
-- no Painel Interno da equipe ("S S S Trevisan Consultoria e Assessoria" /
-- imóvel "AP 402 - CRISTO") — pedido do usuário: "Cadastre a mesma empresa e
-- imóvel teste no portal do cliente".
--
-- Contexto desse cliente (copiado das notas do cadastro no Painel Interno):
-- é um cadastro de EXEMPLO/DEMONSTRAÇÃO, usado para ilustrar o aviso (não
-- bloqueio) de incompatibilidade de CNAE — o CNPJ é real (Trevisan
-- Consultoria, CNAE 69.20-6-02, consultoria/auditoria contábil e tributária),
-- cadastrado com a natureza "recebe hóspedes" só para mostrar o alerta.
--
-- Por que este script existe e o que ele NÃO faz:
-- O Portal do Cliente não tem tela de "criar conta" pública (só a equipe cria
-- contas — ver GUIA-TESTE-LOCAL.md, Passo 6) e a criação do usuário de login
-- (auth.users) só pode ser feita pelo painel do Supabase ou pela Admin API —
-- não existe um jeito de fazer isso só com SQL. Este script portanto NÃO cria
-- o usuário de login: ele apenas PREENCHE o cadastro (profiles) e cria o
-- imóvel depois que o usuário de login já existe.
--
-- Como usar:
--   1) Supabase → Authentication → Users → Add user
--      E-mail: adm.trevisancontabil@gmail.com   (pode usar qualquer senha)
--      (isso dispara o trigger handle_new_user(), que já cria uma linha
--      básica em public.profiles automaticamente — este script completa o
--      resto dos campos nessa linha)
--   2) Supabase → SQL Editor → New query → cole este arquivo inteiro → Run
--      (pode rodar mais de uma vez sem duplicar o imóvel)
--
-- Depois disso, entre em http://localhost:3000 com esse e-mail: o cliente
-- "S S S Trevisan Consultoria e Assessoria" aparece com o imóvel "AP 402 -
-- CRISTO" já cadastrado, com a mesma nota de checklist zerada para começar
-- a marcar os itens de prontidão pelo Portal.
--
-- Requer a migration 0006_imovel_detalhes.sql já aplicada (adiciona
-- tipo/condição/metragem/quartos/salas/banheiros e endereço estruturado à
-- tabela imoveis) — sem ela, o passo 2 abaixo falha porque essas colunas
-- ainda não existem.

-- ---------------------------------------------------------------------------
-- 1) Completa o cadastro (profiles) do cliente de teste
-- ---------------------------------------------------------------------------
update public.profiles p
set
  nome            = 'S S S Trevisan Consultoria e Assessoria',
  tipo            = 'PJ',
  documento       = '66595824000160',  -- só dígitos (constraint da 0008)
  telefone        = null,
  plano           = 'Básico',
  status_fiscal   = 'regular',
  perfil_atuacao  = 'proprietario',
  atualizado_em   = now()
from auth.users u
where p.id = u.id
  and u.email = 'adm.trevisancontabil@gmail.com';

-- avisa se o usuário de login ainda não foi criado (Passo 1 acima)
do $$
begin
  if not exists (
    select 1 from auth.users where email = 'adm.trevisancontabil@gmail.com'
  ) then
    raise notice 'Usuário adm.trevisancontabil@gmail.com ainda não existe em auth.users — crie primeiro em Authentication > Users > Add user, depois rode este script de novo.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) Cadastra o imóvel "AP 402 - CRISTO" (mesmos dados do Painel Interno,
--    incluindo tipo/condição/metragem/quartos/salas/banheiros e endereço
--    estruturado — migration 0006_imovel_detalhes.sql)
-- ---------------------------------------------------------------------------

-- 2a) se o imóvel já existia de uma execução anterior deste script (feita
--     antes da migration 0006), atualiza os campos novos nele em vez de
--     duplicar
update public.imoveis i
set
  endereco  = 'R. Antônio Pádua Vasconcelos, 84 - Cristo Redentor - João Pessoa/PB - CEP 58071400',
  taxa_gestao_pct = 1.00,
  plataformas = array['airbnb']::text[],
  tipo      = 'Apartamento',
  condicao  = 'Novo',
  metragem  = 60,
  quartos   = 2,
  salas     = 1,
  banheiros = 2,
  cep       = '58071400',
  rua       = 'R. Antônio Pádua Vasconcelos',
  numero    = '84',
  bairro    = 'Cristo Redentor',
  cidade    = 'João Pessoa',
  uf        = 'PB'
from auth.users u
where i.owner_id = u.id
  and u.email = 'adm.trevisancontabil@gmail.com'
  and i.nome = 'AP 402 - CRISTO';

-- 2b) se ainda não existir (primeira execução), insere já com todos os campos
insert into public.imoveis (
  owner_id, nome, endereco, taxa_gestao_pct, plataformas,
  tipo, condicao, metragem, quartos, salas, banheiros,
  cep, rua, numero, bairro, cidade, uf
)
select
  u.id,
  'AP 402 - CRISTO',
  'R. Antônio Pádua Vasconcelos, 84 - Cristo Redentor - João Pessoa/PB - CEP 58071400',
  1.00,
  array['airbnb']::text[],
  'Apartamento', 'Novo', 60, 2, 1, 2,
  '58071400', 'R. Antônio Pádua Vasconcelos', '84', 'Cristo Redentor', 'João Pessoa', 'PB'
from auth.users u
where u.email = 'adm.trevisancontabil@gmail.com'
  and not exists (
    select 1 from public.imoveis i
    where i.owner_id = u.id and i.nome = 'AP 402 - CRISTO'
  );

-- ---------------------------------------------------------------------------
-- Conferência rápida (rode separado, se quiser ver o resultado)
-- ---------------------------------------------------------------------------
-- select p.nome, p.documento, p.tipo, p.plano, p.status_fiscal,
--        i.nome as imovel, i.taxa_gestao_pct, i.tipo as imovel_tipo,
--        i.metragem, i.quartos, i.salas, i.banheiros
-- from public.profiles p
-- join public.imoveis i on i.owner_id = p.id
-- join auth.users u on u.id = p.id
-- where u.email = 'adm.trevisancontabil@gmail.com';
