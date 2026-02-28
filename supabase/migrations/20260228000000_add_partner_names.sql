-- Nomes dos parceiros para uso no app (dashboard, fechamento)
ALTER TABLE couples
ADD COLUMN IF NOT EXISTS partner_1_name text,
ADD COLUMN IF NOT EXISTS partner_2_name text;

COMMENT ON COLUMN couples.partner_1_name IS 'Nome do parceiro 1 (app ou WhatsApp)';
COMMENT ON COLUMN couples.partner_2_name IS 'Nome do parceiro 2 (app ou WhatsApp)';
