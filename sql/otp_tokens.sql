-- Tabela para armazenar OTPs de recuperacao de senha
-- Substitui o Map em memoria que nao funciona em serverless multi-instancia

create table if not exists otp_tokens (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tipo text not null check (tipo in ('consultor', 'gestor', 'indicador')),
  codigo text not null,
  expira_em timestamptz not null,
  usado boolean not null default false,
  criado_em timestamptz not null default now()
);

-- Index para busca rapida por email+tipo
create index if not exists otp_tokens_email_tipo_idx on otp_tokens (email, tipo);

-- Limpeza automatica de tokens expirados (requer pg_cron ou chamada manual)
-- Alternativa: a propria aplicacao limpa ao validar
