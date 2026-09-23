-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Adiciona o "Perfil" do cliente (Proprietário / Co-Anfitrião / Os dois),
-- espelhando o campo já existente no cadastro de cliente do Painel Interno
-- da equipe. Serve para:
--   1) mostrar ao cliente, no próprio Portal, se ele é dono dos imóveis
--      cadastrados ou se administra imóveis de terceiros (Co-Anfitrião);
--   2) decidir se o "Split de comissão" da Home/Financeiro deve mostrar o
--      aviso de nota fiscal única de Co-Anfitrião, ou o texto neutro de
--      Proprietário — sem isso, o Portal mostrava o aviso de Co-Anfitrião
--      para QUALQUER cliente com comissão de gestão > 0, o que é impreciso.
--
-- Como aplicar: supabase db push  (ou colar no SQL Editor do painel do Supabase)

create type public.perfil_atuacao as enum ('proprietario', 'coanfitriao', 'ambos');

alter table public.profiles
  add column perfil_atuacao public.perfil_atuacao not null default 'proprietario';

comment on column public.profiles.perfil_atuacao is
  'Proprietário = só administra os próprios imóveis. Co-Anfitrião = administra imóveis de terceiros (a taxa_gestao_pct de cada imóvel é a comissão dele). Ambos = tem imóvel(is) próprio(s) e também administra de terceiros. Definido pela equipe da Anfitrião no cadastro do cliente (Painel Interno); o cliente só visualiza no Portal.';

-- Observação: este campo é independente de "papel" (cliente/admin, controla
-- acesso) e de "naturezaAtividade"/CNAE do Painel Interno (classificação
-- fiscal mais granular usada lá para compatibilidade de CNAE). Aqui, no
-- Portal do Cliente, só precisamos da versão simplificada para a mensagem
-- de split de comissão e para o cliente entender seu próprio cadastro.
