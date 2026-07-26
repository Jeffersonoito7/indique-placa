-- Adiciona campo para deduplicacao de alertas de vencimento de plano
alter table consultores
  add column if not exists alerta_vencimento_enviado_em timestamptz;
