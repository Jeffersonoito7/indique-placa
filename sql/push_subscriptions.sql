create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  consultor_id uuid references consultores(id) on delete cascade,
  subscription jsonb not null,
  criado_em timestamptz default now()
);
create index on push_subscriptions(consultor_id);
