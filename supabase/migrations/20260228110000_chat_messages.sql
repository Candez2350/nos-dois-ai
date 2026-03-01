-- Histórico de mensagens do chat (lançamentos + respostas do bot)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'assistant')),
  content text NOT NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_couple_id_fkey FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_couple_created
ON public.chat_messages (couple_id, created_at DESC);

COMMENT ON TABLE public.chat_messages IS 'Histórico do chat: mensagens do usuário e respostas do assistente vinculadas a transações.';
