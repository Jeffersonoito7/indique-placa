-- Adiciona suporte a gestor e associacao na tabela de comissoes
ALTER TABLE comissoes_tipos ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES gestores(id) ON DELETE CASCADE;
ALTER TABLE comissoes_tipos ADD COLUMN IF NOT EXISTS associacao_id UUID REFERENCES associacoes(id) ON DELETE CASCADE;

-- Constraints de unicidade por dono
ALTER TABLE comissoes_tipos DROP CONSTRAINT IF EXISTS comissoes_tipos_gestor_tipo_unique;
ALTER TABLE comissoes_tipos ADD CONSTRAINT comissoes_tipos_gestor_tipo_unique UNIQUE (gestor_id, tipo);

ALTER TABLE comissoes_tipos DROP CONSTRAINT IF EXISTS comissoes_tipos_associacao_tipo_unique;
ALTER TABLE comissoes_tipos ADD CONSTRAINT comissoes_tipos_associacao_tipo_unique UNIQUE (associacao_id, tipo);
