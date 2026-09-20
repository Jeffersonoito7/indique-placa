-- Tabela de tickets de suporte: todos os perfis se comunicam com o master
CREATE TABLE IF NOT EXISTS suporte_tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  associacao_id uuid REFERENCES associacoes(id) ON DELETE CASCADE,
  perfil_tipo   text NOT NULL CHECK (perfil_tipo IN ('associacao','gestor','consultor','indicador')),
  perfil_id     uuid NOT NULL,
  perfil_nome   text NOT NULL,
  assunto       text NOT NULL,
  mensagem      text NOT NULL,
  status        text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','respondido','fechado')),
  resposta      text,
  respondido_em timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suporte_tickets_assoc ON suporte_tickets(associacao_id);
CREATE INDEX IF NOT EXISTS idx_suporte_tickets_perfil ON suporte_tickets(perfil_tipo, perfil_id);
CREATE INDEX IF NOT EXISTS idx_suporte_tickets_status ON suporte_tickets(status);
