-- M02: cria colunas _enc para credenciais sensíveis
-- Executar no Supabase SQL Editor (service_role não tem permissão DDL)

ALTER TABLE associacoes
  ADD COLUMN IF NOT EXISTS efi_client_id_enc text,
  ADD COLUMN IF NOT EXISTS efi_client_secret_enc text,
  ADD COLUMN IF NOT EXISTS efi_pix_key_enc text,
  ADD COLUMN IF NOT EXISTS efi_certificate_base64_enc text;

ALTER TABLE trafego_contas
  ADD COLUMN IF NOT EXISTS meta_access_token_enc text,
  ADD COLUMN IF NOT EXISTS openai_api_key_enc text;
