-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Adiciona ao cadastro de imóvel os mesmos campos que o Painel Interno da
-- equipe já tem: tipo, estado de conservação, metragem, quartos, salas,
-- banheiros, e endereço ESTRUTURADO (CEP, rua, número, bairro, cidade, UF)
-- em vez de só um campo de texto livre.
--
-- "endereco" (texto livre) continua existindo, como resumo textual derivado
-- dos campos estruturados — mantido por compatibilidade com quem já lê esse
-- campo único (o registro salvo no seed de teste, por exemplo). Imóveis
-- cadastrados antes desta migration ficam com os campos novos em branco;
-- o próprio "endereco" antigo continua exibido normalmente até serem
-- editados com os detalhes novos.
--
-- Como aplicar: supabase db push  (ou colar no SQL Editor do painel do Supabase)

create type public.tipo_imovel as enum ('Apartamento', 'Studio/Flat', 'Casa', 'Outro');
create type public.condicao_imovel as enum ('Novo', 'Semi-novo', 'Usado');

alter table public.imoveis
  add column tipo public.tipo_imovel,
  add column condicao public.condicao_imovel,
  add column metragem numeric(8,2),
  add column quartos smallint,
  add column salas smallint,
  add column banheiros smallint,
  add column cep text,
  add column rua text,
  add column numero text,
  add column bairro text,
  add column cidade text,
  add column uf text;

comment on column public.imoveis.tipo is 'Tipo do imóvel — mesma lista do Painel Interno (Apartamento/Studio-Flat/Casa/Outro).';
comment on column public.imoveis.condicao is 'Estado de conservação — mesma lista do Painel Interno (Novo/Semi-novo/Usado).';
comment on column public.imoveis.cep is 'Endereço estruturado (sem busca automática por CEP — preenchimento manual, mesma limitação do Painel Interno).';
