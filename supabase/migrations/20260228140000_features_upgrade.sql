-- ============================================================
-- Migração: Novas Funcionalidades (Recorrentes, Metas, Histórico)
-- ============================================================

-- 1. RECURRING EXPENSES (Despesas Fixas/Assinaturas)
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  day_of_month integer NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  active boolean DEFAULT true,
  payer_user_id uuid REFERENCES public.users(id), -- Quem paga geralmente
  created_at timestamptz DEFAULT now(),
  CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id)
);

-- 2. BUDGETS (Metas de Gastos por Categoria)
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  category text NOT NULL,
  monthly_limit numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_couple_category_unique UNIQUE (couple_id, category)
);

-- 3. SETTLEMENT_HISTORY (Histórico de Fechamentos para consulta)
-- A tabela settlements já existe, mas vamos garantir que tenha campos de metadados
ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS total_expenses numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS snapshot_data jsonb; -- JSON com o resumo do que foi fechado

-- 4. USER PREFERENCES / RULES (Memória da IA)
CREATE TABLE IF NOT EXISTS public.ai_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  keyword text NOT NULL, -- ex: "Boteco do Zé"
  preferred_category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT ai_preferences_pkey PRIMARY KEY (id)
);

-- 5. TRAVA DE PARCEIROS (Melhoria na tabela Users)
-- Adiciona campo para senha/pin simples se quisermos futuramente, 
-- mas principalmente garante que o role não mude facilmente.
-- (Já temos o campo 'role' e 'couple_id' na tabela users da migração anterior)

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_recurring_couple ON public.recurring_expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_budgets_couple ON public.budgets(couple_id);

