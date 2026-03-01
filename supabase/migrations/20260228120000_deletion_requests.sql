-- Solicitações de exclusão de lançamento (um parceiro pede, o outro aprova)
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  responded_by uuid,
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT deletion_requests_pkey PRIMARY KEY (id),
  CONSTRAINT deletion_requests_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE,
  CONSTRAINT deletion_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id),
  CONSTRAINT deletion_requests_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_transaction ON public.deletion_requests (transaction_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON public.deletion_requests (status) WHERE status = 'pending';

COMMENT ON TABLE public.deletion_requests IS 'Solicitações de exclusão: quem pediu e quem aprovou/rejeitou.';
