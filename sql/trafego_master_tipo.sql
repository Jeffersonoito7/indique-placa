-- Permite usuario_tipo = 'master' na tabela trafego_contas
-- Necessario para o painel master gerenciar campanhas de trafego proprias

ALTER TABLE trafego_contas DROP CONSTRAINT IF EXISTS trafego_contas_usuario_tipo_check;
ALTER TABLE trafego_contas ADD CONSTRAINT trafego_contas_usuario_tipo_check
  CHECK (usuario_tipo IN ('gestor', 'consultor', 'associacao', 'master'));
