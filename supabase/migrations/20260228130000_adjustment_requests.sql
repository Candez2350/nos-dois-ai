-- Solicitações de ajuste (edição) de transação
CREATE TABLE IF NOT EXISTS public.adjustment_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  new_amount numeric,
  new_description text,
  new_category text,
  new_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  responded_by uuid,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT adjustment_requests_pkey PRIMARY KEY (id),
  CONSTRAINT adjustment_requests_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE,
  CONSTRAINT adjustment_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT adjustment_requests_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_adjustment_requests_transaction ON public.adjustment_requests (transaction_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_requests_status ON public.adjustment_requests (status) WHERE status = 'pending';

COMMENT ON TABLE public.adjustment_requests IS 'Solicitações de ajuste (edição) de transação: um pede, o outro aprova.';
