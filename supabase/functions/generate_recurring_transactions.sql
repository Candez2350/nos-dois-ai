-- Função para gerar transações a partir de despesas recorrentes
CREATE OR REPLACE FUNCTION generate_recurring_transactions() RETURNS void AS $$
DECLARE
    rec_expense RECORD;
    last_transaction_date DATE;
    current_date DATE := CURRENT_DATE;
    year_month TEXT;
BEGIN
    RAISE NOTICE 'Iniciando geração de despesas recorrentes para %', current_date;

    -- Itera sobre todas as despesas recorrentes ativas
    FOR rec_expense IN 
        SELECT * FROM recurring_expenses WHERE active = TRUE
    LOOP
        -- Obtém a data da última transação gerada para esta despesa recorrente
        SELECT MAX(expense_date)
        INTO last_transaction_date
        FROM transactions
        WHERE description = rec_expense.description
          AND amount = rec_expense.amount
          AND category = rec_expense.category
          AND expense_date IS NOT NULL;

        -- Define o ano e mês atual para verificação
        year_month := TO_CHAR(current_date, 'YYYY-MM');

        -- Verifica se a despesa já foi gerada para este mês/dia
        IF last_transaction_date IS NULL OR TO_CHAR(last_transaction_date, 'YYYY-MM') < year_month THEN
            -- Verifica se o dia do mês atual é menor ou igual ao dia da despesa recorrente
            IF EXTRACT(DAY FROM current_date) <= rec_expense.day_of_month THEN
                RAISE NOTICE 'Gerando transação para: % (Descrição: %, Dia: %)', rec_expense.description, rec_expense.day_of_month;
                
                INSERT INTO public.transactions (
                    couple_id,
                    description,
                    amount,
                    category,
                    expense_date,
                    payer_user_id, -- Pode ser necessário definir um padrão ou buscar o P1/P2 do casal
                    payer_wa_number, -- Opcional
                    recurring_expense_id -- Referência à despesa recorrente que gerou esta transação
                )
                SELECT 
                    rec_expense.couple_id,
                    rec_expense.description,
                    rec_expense.amount,
                    rec_expense.category,
                    -- Define a data da transação como o dia do mês atual, se for menor ou igual ao dia da despesa
                    -- Se for o dia 1º e a despesa recorrente for para o dia 15, a data será o dia 1º deste mês.
                    -- Se for dia 15 e a despesa recorrente for para o dia 15, a data será o dia 15 deste mês.
                    (DATE_TRUNC('month', current_date) + (rec_expense.day_of_month - 1) * INTERVAL '1 day')::DATE,
                    -- Buscar um user_id padrão ou o P1 do casal como pagador padrão
                    -- Exemplo: (SELECT partner_1_id FROM couples WHERE id = rec_expense.couple_id),
                    -- Exemplo: (SELECT whatsapp_number FROM couples WHERE id = rec_expense.couple_id) -- Se precisar do WA number
                    NULL, -- Substituir por lógica de busca do pagador padrão se necessário
                    NULL, -- Substituir por lógica de busca do pagador padrão se necessário
                    rec_expense.id
                WHERE NOT EXISTS (
                    -- Previne duplicatas caso a função rode mais de uma vez no mesmo dia
                    SELECT 1 FROM transactions t 
                    WHERE t.recurring_expense_id = rec_expense.id
                      AND TO_CHAR(t.expense_date, 'YYYY-MM-DD') = TO_CHAR(DATE_TRUNC('month', current_date) + (rec_expense.day_of_month - 1) * INTERVAL '1 day', 'YYYY-MM-DD')
                );

                -- Atualiza o last_generated_at na tabela recurring_expenses após a inserção bem-sucedida
                -- Isso evita que a mesma despesa seja gerada múltiplas vezes no mesmo mês
                UPDATE recurring_expenses
                SET last_generated_at = (DATE_TRUNC('month', current_date) + (rec_expense.day_of_month - 1) * INTERVAL '1 day')::DATE
                WHERE id = rec_expense.id;
            END IF;
        END IF;
    END LOOP;
    RAISE NOTICE 'Finalizada geração de despesas recorrentes.';
END;
$$ LANGUAGE plpgsql;
