-- Rate limit persistido no banco — substitui Map em memoria
-- Funciona em serverless multi-instancia (Vercel)

create table if not exists rate_limit_store (
  key text primary key,
  count int not null default 1,
  reset_at timestamptz not null
);

-- Funcao atomica: upsert + check em uma unica operacao
create or replace function rate_limit_check(
  p_key text,
  p_limite int,
  p_window_ms bigint
) returns jsonb language plpgsql as $$
declare
  v_now timestamptz := now();
  v_count int;
  v_reset_at timestamptz;
begin
  insert into rate_limit_store(key, count, reset_at)
  values (
    p_key,
    1,
    v_now + make_interval(secs => p_window_ms::float / 1000)
  )
  on conflict (key) do update
    set
      count = case
        when rate_limit_store.reset_at <= v_now then 1
        else rate_limit_store.count + 1
      end,
      reset_at = case
        when rate_limit_store.reset_at <= v_now
        then v_now + make_interval(secs => p_window_ms::float / 1000)
        else rate_limit_store.reset_at
      end;

  select count, reset_at into v_count, v_reset_at
  from rate_limit_store where key = p_key;

  if v_count > p_limite then
    return jsonb_build_object(
      'allowed', false,
      'retry_after', greatest(0, ceil(extract(epoch from (v_reset_at - v_now))))::int
    );
  end if;

  return jsonb_build_object('allowed', true, 'retry_after', 0);
end;
$$;
