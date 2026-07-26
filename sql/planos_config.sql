-- Configuracoes de plano por tipo de usuario
-- Rodar no Supabase SQL Editor

-- ============================================================
-- ASSOCIACAO
-- ============================================================
CREATE TABLE IF NOT EXISTS planos_config_associacao (
  plano text PRIMARY KEY, -- trial | bronze | prata | ouro
  max_consultores integer,
  max_gestores integer,
  max_indicadores integer,
  campanha_whatsapp boolean NOT NULL DEFAULT false,
  exportar_csv boolean NOT NULL DEFAULT false,
  bi_avancado boolean NOT NULL DEFAULT false,
  webhook_integracao boolean NOT NULL DEFAULT false,
  logo_personalizada boolean NOT NULL DEFAULT false,
  suporte_prioritario boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz DEFAULT now()
);

INSERT INTO planos_config_associacao (plano, max_consultores, max_gestores, max_indicadores, campanha_whatsapp, exportar_csv, bi_avancado, webhook_integracao, logo_personalizada, suporte_prioritario)
VALUES
  ('trial', 5,    1,    50,   false, false, false, false, false, false),
  ('bronze', 20,  2,    200,  false, true,  false, false, false, false),
  ('prata',  100, 5,    1000, true,  true,  true,  false, true,  false),
  ('ouro',   null,null, null, true,  true,  true,  true,  true,  true)
ON CONFLICT (plano) DO NOTHING;

-- ============================================================
-- CONSULTOR
-- ============================================================
CREATE TABLE IF NOT EXISTS planos_config_consultor (
  plano text PRIMARY KEY, -- free | pro
  max_indicadores integer,
  campanha_whatsapp boolean NOT NULL DEFAULT false,
  exportar_csv boolean NOT NULL DEFAULT false,
  metas_bonus boolean NOT NULL DEFAULT false,
  link_captura_proprio boolean NOT NULL DEFAULT false,
  ranking_visivel boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz DEFAULT now()
);

INSERT INTO planos_config_consultor (plano, max_indicadores, campanha_whatsapp, exportar_csv, metas_bonus, link_captura_proprio, ranking_visivel)
VALUES
  ('free', 50,  false, false, false, false, true),
  ('pro',  null, true, true,  true,  true,  true)
ON CONFLICT (plano) DO NOTHING;

-- ============================================================
-- GESTOR
-- ============================================================
CREATE TABLE IF NOT EXISTS planos_config_gestor (
  plano text PRIMARY KEY, -- free | pro
  max_consultores integer,
  relatorios_equipe boolean NOT NULL DEFAULT false,
  exportar_csv boolean NOT NULL DEFAULT false,
  link_captura_proprio boolean NOT NULL DEFAULT false,
  atualizado_em timestamptz DEFAULT now()
);

INSERT INTO planos_config_gestor (plano, max_consultores, relatorios_equipe, exportar_csv, link_captura_proprio)
VALUES
  ('free', 20,  true,  false, false),
  ('pro',  null, true,  true,  true)
ON CONFLICT (plano) DO NOTHING;
