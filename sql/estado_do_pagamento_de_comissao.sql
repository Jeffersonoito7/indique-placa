-- C5: estado do pagamento de comissao.
-- Aplicado em producao em 2026-09-20 (migration estado_do_pagamento_de_comissao).
--
-- Antes, `comissao_paga` virava true ANTES de o PIX sair, e a recusa da Efi so
-- gerava console.error: comissao recusada ficava "paga" para sempre sem dinheiro
-- ter saido. Migrado com ZERO comissoes pagas na base, entao nao houve estado
-- errado para reconciliar.
--
-- `comissao_paga` continua existindo e passa a ser DERIVADA do estado por
-- trigger, para nenhuma tela do 1.0 quebrar e para ninguem conseguir marcar pago
-- por fora da maquina de estados.

ALTER TABLE indicacoes
  ADD COLUMN IF NOT EXISTS pix_status text NOT NULL DEFAULT 'pendente'
    CHECK (pix_status IN ('pendente','reservado','enviado','confirmado','falhou','manual')),
  ADD COLUMN IF NOT EXISTS pix_id_envio text,
  ADD COLUMN IF NOT EXISTS pix_erro text,
  ADD COLUMN IF NOT EXISTS pix_observacao text,
  ADD COLUMN IF NOT EXISTS pix_atualizado_em timestamptz;

CREATE INDEX IF NOT EXISTS idx_indicacoes_pix_atencao
  ON indicacoes (pix_status) WHERE pix_status IN ('falhou','reservado');

UPDATE indicacoes
SET pix_status = 'manual',
    pix_observacao = 'Estado anterior a migracao: marcado como pago no modelo antigo',
    pix_atualizado_em = coalesce(comissao_paga_em, now())
WHERE comissao_paga IS TRUE AND pix_status = 'pendente';

CREATE OR REPLACE FUNCTION sincronizar_comissao_paga() RETURNS trigger AS $$
BEGIN
  NEW.comissao_paga := NEW.pix_status IN ('confirmado','manual');
  IF NEW.pix_status IS DISTINCT FROM OLD.pix_status THEN
    NEW.pix_atualizado_em := now();
    IF NEW.comissao_paga AND NEW.comissao_paga_em IS NULL THEN
      NEW.comissao_paga_em := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_comissao_paga ON indicacoes;
CREATE TRIGGER trg_sincronizar_comissao_paga
  BEFORE UPDATE ON indicacoes
  FOR EACH ROW EXECUTE FUNCTION sincronizar_comissao_paga();
