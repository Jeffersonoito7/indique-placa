-- Corrige race condition: deduplicacao de placa por consultor garantida no banco
-- Antes: so verificacao em codigo (check-then-insert), sujeito a duplicatas em requests simultâneas
-- Agora: constraint UNIQUE impede o segundo INSERT; codigo trata erro 23505

-- Verificar se ha duplicatas existentes antes de criar a constraint
DO $$
DECLARE
  duplicatas INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicatas
  FROM (
    SELECT consultor_id, placa, COUNT(*) as qtd
    FROM indicacoes
    WHERE consultor_id IS NOT NULL
    GROUP BY consultor_id, placa
    HAVING COUNT(*) > 1
  ) sub;

  IF duplicatas > 0 THEN
    RAISE NOTICE 'ATENCAO: % combinacoes consultor+placa duplicadas encontradas. Remover manualmente antes de rodar o ALTER TABLE.', duplicatas;
  ELSE
    -- Sem duplicatas: pode criar a constraint com segurança
    ALTER TABLE indicacoes
      ADD CONSTRAINT indicacoes_consultor_placa_unique UNIQUE (consultor_id, placa);
    RAISE NOTICE 'Constraint UNIQUE criada com sucesso.';
  END IF;
END $$;
