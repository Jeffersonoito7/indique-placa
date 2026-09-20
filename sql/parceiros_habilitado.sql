ALTER TABLE associacoes ADD COLUMN IF NOT EXISTS parceiros_habilitado boolean DEFAULT false;
ALTER TABLE gestores ADD COLUMN IF NOT EXISTS parceiros_habilitado boolean DEFAULT false;
ALTER TABLE consultores ADD COLUMN IF NOT EXISTS parceiros_habilitado boolean DEFAULT false;
