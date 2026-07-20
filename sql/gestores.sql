-- Tabela de gestores
CREATE TABLE IF NOT EXISTS gestores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  senha_hash text NOT NULL,
  fone text,
  ativo boolean DEFAULT true,
  plano text DEFAULT 'free', -- free | pro
  plano_ativo_ate timestamptz,
  criado_em timestamptz DEFAULT now()
);

-- Vincular consultores ao gestor
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES gestores(id) ON DELETE SET NULL;
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS plano text DEFAULT 'free'; -- free | pro
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS plano_ativo_ate timestamptz;

-- Indices
CREATE INDEX IF NOT EXISTS idx_consultores_gestor_id ON consultores(gestor_id);
