-- Contas Meta conectadas por gestor/consultor
create table if not exists trafego_contas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null,
  usuario_tipo text not null check (usuario_tipo in ('gestor','consultor')),
  meta_access_token text not null,
  meta_ad_account_id text not null,
  meta_page_id text not null,
  meta_instagram_actor_id text,
  nome_conta text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, usuario_tipo)
);

-- Campanhas criadas
create table if not exists trafego_campanhas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references trafego_contas(id) on delete cascade,
  usuario_id uuid not null,
  usuario_tipo text not null,
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  nome text not null,
  objetivo text not null default 'OUTCOME_LEADS',
  status text not null default 'rascunho' check (status in ('rascunho','ativa','pausada','encerrada','erro')),
  orcamento_diario numeric(10,2) not null default 10,
  copy_titulo text,
  copy_corpo text,
  copy_cta text default 'LEARN_MORE',
  imagem_url text,
  publico_localizacao text,
  publico_idade_min int default 25,
  publico_idade_max int default 55,
  publico_interesses jsonb default '[]',
  meta_erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Snapshots de performance (gerado pelo cron)
create table if not exists trafego_insights (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references trafego_campanhas(id) on delete cascade,
  data_referencia date not null default current_date,
  impressoes int default 0,
  cliques int default 0,
  ctr numeric(6,4) default 0,
  cpm numeric(10,2) default 0,
  cpc numeric(10,2) default 0,
  gasto numeric(10,2) default 0,
  alcance int default 0,
  leads int default 0,
  custo_por_lead numeric(10,2),
  criado_em timestamptz not null default now(),
  unique (campanha_id, data_referencia)
);

-- Alertas gerados automaticamente
create table if not exists trafego_alertas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid not null references trafego_campanhas(id) on delete cascade,
  usuario_id uuid not null,
  usuario_tipo text not null,
  tipo text not null check (tipo in ('positivo','negativo','info')),
  titulo text not null,
  mensagem text not null,
  lido boolean not null default false,
  acao_tomada text,
  criado_em timestamptz not null default now()
);

-- Indexes
create index if not exists idx_trafego_campanhas_usuario on trafego_campanhas(usuario_id, usuario_tipo);
create index if not exists idx_trafego_alertas_usuario on trafego_alertas(usuario_id, usuario_tipo, lido);
create index if not exists idx_trafego_insights_campanha on trafego_insights(campanha_id, data_referencia desc);
