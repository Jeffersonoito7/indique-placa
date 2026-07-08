alter table push_subscriptions add column if not exists indicador_id uuid references indicadores(id) on delete cascade;

create index if not exists push_subscriptions_indicador_id_idx on push_subscriptions(indicador_id);
