-- Adiciona colunas que existem no codigo mas nao foram criadas no banco
ALTER TABLE associacoes ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE associacoes ADD COLUMN IF NOT EXISTS paga_pelo_time boolean DEFAULT false;
ALTER TABLE associacoes ADD COLUMN IF NOT EXISTS efi_certificate_base64 text;
ALTER TABLE associacoes ADD COLUMN IF NOT EXISTS senha_hash text;
