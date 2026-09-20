-- C8: consultor padrao passa a ser POR ASSOCIACAO.
-- Antes vinha da tabela global `configuracoes` (uma linha para a plataforma
-- inteira), entao o lead de um consultor bloqueado da associacao A podia ser
-- entregue ao consultor padrao da associacao B.
-- Aplicado em producao em 2026-09-20 via migration consultor_padrao_por_associacao.

ALTER TABLE associacoes
  ADD COLUMN IF NOT EXISTS consultor_padrao_id uuid REFERENCES consultores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_associacoes_consultor_padrao
  ON associacoes(consultor_padrao_id);

UPDATE associacoes a
SET consultor_padrao_id = cfg.consultor_padrao_id
FROM (SELECT consultor_padrao_id FROM configuracoes WHERE consultor_padrao_id IS NOT NULL LIMIT 1) cfg
JOIN consultores c ON c.id = cfg.consultor_padrao_id
WHERE a.id = c.associacao_id
  AND a.consultor_padrao_id IS NULL;
