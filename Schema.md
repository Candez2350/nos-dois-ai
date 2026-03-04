-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.adjustment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  new_amount numeric,
  new_description text,
  new_category text,
  new_date date,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  responded_by uuid,
  responded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT adjustment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT adjustment_requests_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT adjustment_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT adjustment_requests_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id)
);
CREATE TABLE public.ai_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  keyword text NOT NULL,
  preferred_category text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT ai_preferences_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  monthly_limit numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  category_id uuid NOT NULL,
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id),
  CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.custom_categories(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  transaction_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT chat_messages_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);
CREATE TABLE public.couples (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wa_group_id text UNIQUE,
  name text,
  created_at timestamp with time zone DEFAULT now(),
  activation_token text UNIQUE,
  owner_phone text,
  split_type text DEFAULT 'EQUAL'::text,
  split_percentage_partner_1 integer DEFAULT 50,
  p1_wa_number text,
  p2_wa_number text,
  split_percentage_partner_2 integer DEFAULT 50,
  partner_1_id uuid,
  partner_2_id uuid,
  roles_locked boolean DEFAULT false,
  CONSTRAINT couples_pkey PRIMARY KEY (id),
  CONSTRAINT couples_partner_1_id_fkey FOREIGN KEY (partner_1_id) REFERENCES public.users(id),
  CONSTRAINT couples_partner_2_id_fkey FOREIGN KEY (partner_2_id) REFERENCES public.users(id)
);
CREATE TABLE public.custom_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_categories_pkey PRIMARY KEY (id),
  CONSTRAINT custom_categories_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);
CREATE TABLE public.deletion_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  responded_by uuid,
  responded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deletion_requests_pkey PRIMARY KEY (id),
  CONSTRAINT deletion_requests_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT deletion_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT deletion_requests_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id)
);
CREATE TABLE public.recurring_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  day_of_month integer NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  active boolean DEFAULT true,
  payer_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  category_id uuid NOT NULL,
  CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id),
  CONSTRAINT recurring_expenses_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id),
  CONSTRAINT recurring_expenses_payer_user_id_fkey FOREIGN KEY (payer_user_id) REFERENCES public.users(id),
  CONSTRAINT recurring_expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.custom_categories(id)
);
CREATE TABLE public.settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid,
  amount_settled numeric NOT NULL,
  paid_by uuid,
  received_by uuid,
  month_reference text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  total_expenses numeric DEFAULT 0,
  snapshot_data jsonb,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'REJECTED'::text])),
  start_date date,
  end_date date,
  requested_by uuid,
  CONSTRAINT settlements_pkey PRIMARY KEY (id),
  CONSTRAINT settlements_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id),
  CONSTRAINT settlements_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users(id),
  CONSTRAINT settlements_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(id),
  CONSTRAINT settlements_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid,
  external_id text,
  status text DEFAULT 'active'::text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid,
  payer_wa_number text,
  amount numeric NOT NULL,
  description text,
  image_path text,
  ai_metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  settlement_id uuid,
  expense_date date DEFAULT CURRENT_DATE,
  payer_user_id uuid,
  category_id uuid,
  recurring_expense_id uuid,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id),
  CONSTRAINT transactions_payer_user_id_fkey FOREIGN KEY (payer_user_id) REFERENCES public.users(id),
  CONSTRAINT transactions_settlement_id_fkey FOREIGN KEY (settlement_id) REFERENCES public.settlements(id),
  CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.custom_categories(id),
  CONSTRAINT transactions_recurring_expense_id_fkey FOREIGN KEY (recurring_expense_id) REFERENCES public.recurring_expenses(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid,
  name text NOT NULL,
  email text UNIQUE,
  whatsapp_number text NOT NULL UNIQUE,
  pix_key text,
  password text,
  created_at timestamp with time zone DEFAULT now(),
  role text CHECK (role = ANY (ARRAY['partner_1'::text, 'partner_2'::text])),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id)
);