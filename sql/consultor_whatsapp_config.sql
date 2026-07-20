CREATE TABLE IF NOT EXISTS consultor_whatsapp_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  consultor_id uuid REFERENCES consultores(id) ON DELETE CASCADE,
  mensagem_prospecto text DEFAULT 'Olá {nome_lead}, sou {nome_consultor} e soube que você tem um veículo. Gostaria de te apresentar nossa proteção veicular. Posso te ligar?',
  mensagem_indicacao text DEFAULT 'Olá! Sou consultor de proteção veicular. Você conhece alguém com carro, moto ou caminhão que gostaria de proteger? Indique e ganhe dinheiro!',
  horarios text[] DEFAULT ARRAY['manha','tarde'],
  limite_diario int DEFAULT 30,
  intervalo_min int DEFAULT 30,
  intervalo_max int DEFAULT 90,
  modo_envio text DEFAULT 'manual',
  ativo_prospecto boolean DEFAULT false,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(consultor_id)
);
