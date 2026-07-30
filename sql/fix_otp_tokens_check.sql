-- Expande o CHECK da coluna tipo para incluir associacao e master
ALTER TABLE otp_tokens
  DROP CONSTRAINT IF EXISTS otp_tokens_tipo_check;

ALTER TABLE otp_tokens
  ADD CONSTRAINT otp_tokens_tipo_check
  CHECK (tipo IN ('consultor', 'gestor', 'indicador', 'associacao', 'master'));
