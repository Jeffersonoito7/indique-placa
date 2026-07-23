-- Indices para alto trafego - rodar no Supabase SQL Editor
create index if not exists indicacoes_consultor_id_idx on indicacoes (consultor_id);
create index if not exists indicacoes_associacao_id_idx on indicacoes (associacao_id);
create index if not exists indicacoes_status_idx on indicacoes (status);
create index if not exists indicacoes_criado_em_idx on indicacoes (criado_em desc);
create index if not exists indicacoes_status_criado_idx on indicacoes (status, criado_em desc);
create index if not exists consultores_associacao_id_idx on consultores (associacao_id);
create index if not exists consultores_gestor_id_idx on consultores (gestor_id);
create index if not exists consultores_cidade_idx on consultores (cidade);
create index if not exists indicadores_consultor_id_idx on indicadores (consultor_id);
create index if not exists gestores_associacao_id_idx on gestores (associacao_id);
create index if not exists otp_tokens_expira_em_idx on otp_tokens (expira_em) where usado = false;
