-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Novo tipo de nota fiscal: 'comissao' — a nota de serviço que o CLIENTE
-- Co-Anfitrião emite (com o CNPJ/CPF dele) referente à comissão de gestão
-- que ele cobrou dos proprietários dos imóveis que administra num mês.
--
-- É DIFERENTE do tipo 'proprietario' já existente (que é a Anfitrião emitindo
-- honorários de contabilidade PARA o cliente) — aqui é o próprio cliente
-- emitindo para os proprietários dele, mas como o valor é a soma agregada de
-- vários imóveis/proprietários num único mês (ver resumoFinanceiroMes /
-- "Split de comissão" no Painel Interno da equipe), o tomador normalmente
-- não é uma pessoa/CNPJ única — por isso este tipo é sempre criado como
-- 'rascunho' e a equipe decide manualmente como/quando emitir de fato (ver
-- app/admin/notas/actions.ts: emitirNota() não chama o provedor de NFS-e
-- quando tipo = 'comissao').
--
-- Como aplicar: supabase db push  (ou colar no SQL Editor do painel do Supabase,
-- depois de já ter aplicado 0001..0006)

alter type public.tipo_nota_fiscal add value if not exists 'comissao';

comment on type public.tipo_nota_fiscal is
  'hospede = cliente emite para o hóspede. proprietario = Anfitrião emite para o cliente (honorários). comissao = cliente Co-Anfitrião emite (rascunho apenas — revisão manual da equipe antes de qualquer emissão real) referente à comissão de gestão agregada de um mês, mesmo valor de referência mostrado em Financeiro (ver lib/metrics.ts: resumoFinanceiroMes / comissaoGestao).';
