-- Limpeza periodica de registros expirados
-- Rodar no Supabase: Database > Extensions > habilitar "pg_cron"
-- Depois executar este arquivo no SQL Editor

-- Habilita extensao pg_cron (so precisa uma vez)
create extension if not exists pg_cron;

-- Remove OTPs expirados ou usados com mais de 1 hora
-- (mantem os recentes para fins de debug minimo)
select cron.schedule(
  'limpar-otp-expirados',
  '0 * * * *',  -- toda hora
  $$
    delete from otp_tokens
    where usado = true
       or expira_em < now() - interval '1 hour';
  $$
);

-- Remove entradas expiradas do rate limit com mais de 2 horas
select cron.schedule(
  'limpar-rate-limit-expirado',
  '15 * * * *',  -- todo xx:15
  $$
    delete from rate_limit_store
    where reset_at < now() - interval '2 hours';
  $$
);

-- Para verificar os crons cadastrados:
-- select * from cron.job;

-- Para remover um cron (se necessario):
-- select cron.unschedule('limpar-otp-expirados');
-- select cron.unschedule('limpar-rate-limit-expirado');
