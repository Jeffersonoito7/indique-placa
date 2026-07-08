-- Indices para escala na tabela indicacoes
create index if not exists indicacoes_consultor_id_idx on indicacoes(consultor_id);
create index if not exists indicacoes_indicador_id_idx on indicacoes(indicador_id);
create index if not exists indicacoes_status_idx on indicacoes(status);
create index if not exists indicacoes_placa_idx on indicacoes(placa);
create index if not exists indicacoes_criado_em_idx on indicacoes(criado_em desc);
-- Indice composto para a query mais comum: leads de um consultor por status
create index if not exists indicacoes_consultor_status_idx on indicacoes(consultor_id, status);
-- Indice composto para historico do indicador fechados
create index if not exists indicacoes_indicador_status_idx on indicacoes(indicador_id, status);

-- Indices para push_subscriptions
create index if not exists push_subscriptions_consultor_id_idx on push_subscriptions(consultor_id);
create index if not exists push_subscriptions_indicador_id_idx on push_subscriptions(indicador_id);
