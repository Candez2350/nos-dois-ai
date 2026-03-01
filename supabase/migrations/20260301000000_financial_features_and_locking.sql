-- 1. Categorias Personalizadas
CREATE TABLE IF NOT EXISTS public.custom_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(couple_id, name),
  CONSTRAINT custom_categories_pkey PRIMARY KEY (id)
);

-- 2. Despesas Recorrentes
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  day_of_month integer NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  last_generated_at date, -- Data do último lançamento gerado
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id)
);

-- 3. Orçamentos (Budgets)
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  category text NOT NULL,
  limit_amount numeric NOT NULL,
  month_year text NOT NULL, -- Formato 'YYYY-MM'
  created_at timestamptz DEFAULT now(),
  UNIQUE(couple_id, category, month_year),
  CONSTRAINT budgets_pkey PRIMARY KEY (id)
);

-- 4. Ajustes na tabela de Casais para travas
ALTER TABLE public.couples ADD COLUMN IF NOT EXISTS roles_locked boolean DEFAULT false;

COMMENT ON TABLE public.custom_categories IS 'Categorias definidas pelo próprio casal.';
COMMENT ON TABLE public.recurring_expenses IS 'Gastos fixos que o sistema gera mensalmente.';
COMMENT ON TABLE public.budgets IS 'Metas de gastos por categoria e mês.';
