-- Indices para alto trafego — rodar no Supabase SQL Editor
-- Todos usam IF NOT EXISTS: seguro rodar mesmo que ja exista

-- indicacoes (tabela mais acessada)
CREATE INDEX IF NOT EXISTS indicacoes_consultor_id_idx        ON indicacoes (consultor_id);
CREATE INDEX IF NOT EXISTS indicacoes_associacao_id_idx       ON indicacoes (associacao_id);
CREATE INDEX IF NOT EXISTS indicacoes_indicador_id_idx        ON indicacoes (indicador_id);
CREATE INDEX IF NOT EXISTS indicacoes_status_idx              ON indicacoes (status);
CREATE INDEX IF NOT EXISTS indicacoes_criado_em_idx           ON indicacoes (criado_em DESC);
CREATE INDEX IF NOT EXISTS indicacoes_consultor_status_idx    ON indicacoes (consultor_id, status);
CREATE INDEX IF NOT EXISTS indicacoes_consultor_criado_idx    ON indicacoes (consultor_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS indicacoes_placa_idx               ON indicacoes (placa);

-- consultores
CREATE INDEX IF NOT EXISTS consultores_associacao_id_idx ON consultores (associacao_id);
CREATE INDEX IF NOT EXISTS consultores_gestor_id_idx     ON consultores (gestor_id);
CREATE INDEX IF NOT EXISTS consultores_cidade_idx        ON consultores (cidade);
CREATE INDEX IF NOT EXISTS consultores_email_idx         ON consultores (email);

-- indicadores
CREATE INDEX IF NOT EXISTS indicadores_consultor_id_idx  ON indicadores (consultor_id);
CREATE INDEX IF NOT EXISTS indicadores_associacao_id_idx ON indicadores (associacao_id);
CREATE INDEX IF NOT EXISTS indicadores_email_idx         ON indicadores (email);

-- gestores
CREATE INDEX IF NOT EXISTS gestores_associacao_id_idx ON gestores (associacao_id);
CREATE INDEX IF NOT EXISTS gestores_email_idx         ON gestores (email);

-- associacoes
CREATE INDEX IF NOT EXISTS associacoes_email_idx  ON associacoes (email);
CREATE INDEX IF NOT EXISTS associacoes_status_idx ON associacoes (status);

-- otp_tokens (partial index — so os nao usados importam para lookup)
CREATE INDEX IF NOT EXISTS otp_tokens_lookup_idx ON otp_tokens (email, tipo, codigo) WHERE usado = false;
CREATE INDEX IF NOT EXISTS otp_tokens_expira_idx ON otp_tokens (expira_em) WHERE usado = false;

-- push_subscriptions
CREATE INDEX IF NOT EXISTS push_subs_consultor_idx  ON push_subscriptions (consultor_id);
CREATE INDEX IF NOT EXISTS push_subs_indicador_idx  ON push_subscriptions (indicador_id);

-- suporte_tickets
CREATE INDEX IF NOT EXISTS suporte_tickets_assoc_idx    ON suporte_tickets (associacao_id);
CREATE INDEX IF NOT EXISTS suporte_tickets_status_idx   ON suporte_tickets (status);
CREATE INDEX IF NOT EXISTS suporte_tickets_criado_idx   ON suporte_tickets (criado_em DESC);
