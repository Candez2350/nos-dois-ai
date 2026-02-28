-- ============================================================
-- Migração: schema app-first (sem dependência de WhatsApp)
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- 1. USERS: papel no casal (partner_1 ou partner_2)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('partner_1', 'partner_2'));

COMMENT ON COLUMN public.users.role IS 'Papel no casal: partner_1 ou partner_2 (app).';

-- 2. COUPLES: referência direta aos dois usuários do casal
ALTER TABLE public.couples
ADD COLUMN IF NOT EXISTS partner_1_id uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS partner_2_id uuid REFERENCES public.users(id);

COMMENT ON COLUMN public.couples.partner_1_id IS 'User que é o Parceiro 1 (app).';
COMMENT ON COLUMN public.couples.partner_2_id IS 'User que é o Parceiro 2 (app).';

-- 3. TRANSACTIONS: quem pagou por user id (principal no app)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS payer_user_id uuid REFERENCES public.users(id);

COMMENT ON COLUMN public.transactions.payer_user_id IS 'User que pagou (app). Se preenchido, preferir a payer_wa_number para relatórios.';

-- payer_wa_number passa a ser opcional (app pode gravar só payer_user_id)
ALTER TABLE public.transactions
ALTER COLUMN payer_wa_number DROP NOT NULL;

-- 4. Índices para consultas por casal e por período
CREATE INDEX IF NOT EXISTS idx_transactions_payer_user_id
ON public.transactions (payer_user_id) WHERE payer_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_couple_expense_date
ON public.transactions (couple_id, expense_date);

CREATE INDEX IF NOT EXISTS idx_users_couple_role
ON public.users (couple_id, role) WHERE role IS NOT NULL;
