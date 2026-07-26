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

-- Config WhatsApp do gestor (mesma estrutura do consultor)
CREATE TABLE IF NOT EXISTS gestor_whatsapp_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gestor_id uuid NOT NULL REFERENCES gestores(id) ON DELETE CASCADE,
  mensagem_prospecto text DEFAULT 'Ola {nome_lead}, sou {nome_gestor} e soube que voce tem um veiculo. Gostaria de te apresentar nossa protecao veicular. Posso te ligar?',
  mensagem_indicacao text DEFAULT 'Ola! Sou consultor de protecao veicular. Voce conhece alguem com carro, moto ou caminhao que gostaria de proteger? Indique e ganhe dinheiro!',
  horarios text[] DEFAULT ARRAY['manha','tarde'],
  limite_diario integer DEFAULT 30,
  intervalo_min integer DEFAULT 30,
  intervalo_max integer DEFAULT 90,
  modo_envio text DEFAULT 'manual',
  ativo_prospecto boolean DEFAULT false,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(gestor_id)
);
CREATE INDEX IF NOT EXISTS idx_gestor_whatsapp_config_gestor_id ON gestor_whatsapp_config(gestor_id);
