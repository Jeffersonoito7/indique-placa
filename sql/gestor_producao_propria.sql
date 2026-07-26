-- Adiciona suporte a producao propria do gestor nas tabelas indicacoes e indicadores
-- Rodar no Supabase SQL Editor

-- Gestor pode ter leads proprios (sem consultor vinculado)
ALTER TABLE indicacoes ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES gestores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_indicacoes_gestor_id ON indicacoes(gestor_id);

-- Gestor pode ter indicadores proprios (sem consultor vinculado)
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES gestores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_indicadores_gestor_id ON indicadores(gestor_id);

-- Metas do gestor (reusa tabela metas, gestor_id nullable)
ALTER TABLE metas ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES gestores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_metas_gestor_id ON metas(gestor_id);
