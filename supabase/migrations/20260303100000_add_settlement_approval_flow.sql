-- Adiciona as colunas necessárias para o fluxo de aprovação de fechamento de contas.

-- 1. Adiciona a coluna 'status' para rastrear o estado da solicitação.
-- Pode ser 'PENDING', 'COMPLETED', ou 'REJECTED'.
ALTER TABLE public.settlements
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'COMPLETED';

-- 2. Adiciona as datas de início e fim do período de fechamento.
ALTER TABLE public.settlements
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Adiciona a referência de quem solicitou o fechamento.
-- Chave estrangeira para a tabela 'users'.
ALTER TABLE public.settlements
ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES public.users(id);

-- 4. Altera o default da coluna 'status' para 'PENDING' para novas solicitações.
-- A alteração é feita em um passo separado para garantir que os registros antigos
-- (que não tinham status) sejam marcados como 'COMPLETED' por padrão no passo 1.
ALTER TABLE public.settlements
ALTER COLUMN status SET DEFAULT 'PENDING';

-- Remove a restrição de status, caso ela já exista, para permitir a re-execução do script.
ALTER TABLE public.settlements
DROP CONSTRAINT IF EXISTS settlements_status_check;

-- Adiciona um check para garantir que os valores de status sejam apenas os permitidos.
ALTER TABLE public.settlements
ADD CONSTRAINT settlements_status_check CHECK (status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text, 'REJECTED'::text]));

COMMENT ON COLUMN public.settlements.status IS 'Status da solicitação de fechamento: PENDING, COMPLETED, REJECTED.';
COMMENT ON COLUMN public.settlements.requested_by IS 'Usuário que iniciou a solicitação de fechamento.';
COMMENT ON COLUMN public.settlements.start_date IS 'Data de início do período a ser fechado.';
COMMENT ON COLUMN public.settlements.end_date IS 'Data de fim do período a ser fechado.';
