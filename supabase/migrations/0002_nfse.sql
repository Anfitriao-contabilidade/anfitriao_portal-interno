-- Anfitrião Gestão e Contabilidade — Portal do Cliente
-- Extensão do schema: notas fiscais de serviço (NFS-e), rastreando o status da
-- emissão feita via um provedor de API fiscal (Focus NFe por padrão — ver
-- lib/nfse/). Não substitui nenhuma tabela existente, só adiciona.
--
-- Como aplicar: supabase db push  (ou colar no SQL Editor do painel do Supabase,
-- depois de já ter aplicado 0001_init.sql)

-- ---------------------------------------------------------------------------
-- 6. Notas fiscais de serviço (NFS-e)
-- ---------------------------------------------------------------------------
-- 'hospede'     — nota emitida pelo CLIENTE (CNPJ dele) para o hóspede, pela
--                  prestação de serviço de hospedagem/temporada. Prestador =
--                  o próprio cliente (profiles.documento); tomador = hóspede.
-- 'proprietario' — nota emitida pela ANFITRIÃO para o cliente, referente aos
--                  honorários de contabilidade/gestão cobrados dele. Prestador
--                  = Anfitrião (config fixa, ver .env.example); tomador = o
--                  cliente (profiles.documento).
-- Mesma distinção já usada no módulo "Notas Fiscais" do Painel Interno da
-- equipe (Artifact), só que aqui a emissão é real (chama o provedor de API).
create type public.tipo_nota_fiscal as enum ('hospede', 'proprietario');

-- Espelha os status que a API do Focus NFe devolve na consulta (ver
-- lib/nfse/focusnfe.ts): processando_autorizacao / autorizado / erro_autorizacao
-- / cancelado — mapeados para os valores em português abaixo.
create type public.status_nota_fiscal as enum (
  'rascunho',      -- criada no nosso banco, ainda não enviada ao provedor
  'processando',   -- enviada; provedor está autorizando de forma assíncrona
  'autorizada',    -- autorizada pela prefeitura; numero/PDF disponíveis
  'erro',          -- rejeitada/erro de validação — ver erro_mensagem
  'cancelada'
);

create table public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,  -- cliente da Anfitrião a quem a nota se refere
  imovel_id uuid references public.imoveis(id) on delete set null,
  tipo public.tipo_nota_fiscal not null,
  competencia text,                          -- 'YYYY-MM', opcional
  descricao_servico text not null,
  valor numeric(12,2) not null,

  -- Dados do tomador quando tipo = 'hospede' (quando tipo = 'proprietario', o
  -- tomador é o próprio cliente — usamos profiles.nome/documento direto, não
  -- duplicamos aqui). CPF pode ficar vazio para consumidor final, dependendo
  -- das regras do município do prestador.
  tomador_nome text,
  tomador_documento text,

  status public.status_nota_fiscal not null default 'rascunho',
  provedor text not null default 'focusnfe',
  referencia text unique,                    -- id que nós geramos e enviamos ao provedor (?ref=)
  numero text,
  codigo_verificacao text,
  url_pdf text,
  url_xml text,
  erro_mensagem text,

  solicitado_por uuid references public.profiles(id),  -- membro da equipe (admin) que disparou a emissão
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.notas_fiscais is
  'Rastreio de NFS-e emitidas via provedor fiscal externo (ver lib/nfse/). '
  'Esta tabela guarda só o status/resultado — o documento fiscal em si é '
  'emitido e mantido pela prefeitura/provedor, não por nós.';

alter table public.notas_fiscais enable row level security;

-- cliente lê as próprias notas; admin lê todas
create policy "notas_fiscais_select_own_or_admin" on public.notas_fiscais
  for select using (owner_id = auth.uid() or public.is_admin());

-- só a equipe (admin) cria/edita/cancela — é quem dispara a emissão real,
-- nunca o cliente diretamente (mesma decisão já tomada para lancamentos e
-- obrigacoes_fiscais: a equipe é quem confirma o que vira documento oficial)
create policy "notas_fiscais_write_admin" on public.notas_fiscais
  for all using (public.is_admin()) with check (public.is_admin());

create index notas_fiscais_owner_idx on public.notas_fiscais (owner_id, criado_em desc);
create index notas_fiscais_status_idx on public.notas_fiscais (status);

-- Sem trigger automática de atualizado_em (mesma convenção já usada em
-- profiles no 0001_init.sql): o código da aplicação seta esse campo
-- manualmente a cada update (ver lib/nfse/actions.ts).
