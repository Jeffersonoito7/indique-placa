CREATE TABLE IF NOT EXISTS associacoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  email text,
  fone text,
  cidade text,
  estado text,
  logo_url text,
  status text DEFAULT 'ativo',
  plano text DEFAULT 'trial',
  plano_ativo_ate timestamptz,
  cobranca_ativa boolean DEFAULT false,
  valor_mensalidade_associacao numeric(10,2) DEFAULT 0,
  valor_mensalidade_gestor numeric(10,2) DEFAULT 0,
  valor_mensalidade_consultor_pro numeric(10,2) DEFAULT 0,
  efi_client_id text,
  efi_client_secret text,
  efi_pix_key text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE gestores ADD COLUMN IF NOT EXISTS associacao_id uuid REFERENCES associacoes(id) ON DELETE SET NULL;
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS associacao_id uuid REFERENCES associacoes(id) ON DELETE SET NULL;
ALTER TABLE indicadores ADD COLUMN IF NOT EXISTS associacao_id uuid REFERENCES associacoes(id) ON DELETE SET NULL;
ALTER TABLE indicacoes ADD COLUMN IF NOT EXISTS associacao_id uuid REFERENCES associacoes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS lead_transferencias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  indicacao_id uuid REFERENCES indicacoes(id) ON DELETE CASCADE,
  consultor_origem_id uuid,
  consultor_destino_id uuid,
  motivo text,
  transferido_por uuid,
  transferido_por_tipo text,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cobrancas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  associacao_id uuid REFERENCES associacoes(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL,
  usuario_tipo text NOT NULL,
  valor numeric(10,2) NOT NULL,
  status text DEFAULT 'pendente',
  vencimento date,
  pago_em timestamptz,
  txid text,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gestores_associacao_id ON gestores(associacao_id);
CREATE INDEX IF NOT EXISTS idx_consultores_associacao_id ON consultores(associacao_id);
CREATE INDEX IF NOT EXISTS idx_indicadores_associacao_id ON indicadores(associacao_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_associacao_id ON indicacoes(associacao_id);
CREATE INDEX IF NOT EXISTS idx_lead_transferencias_indicacao ON lead_transferencias(indicacao_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_associacao ON cobrancas(associacao_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_usuario ON cobrancas(usuario_id);
