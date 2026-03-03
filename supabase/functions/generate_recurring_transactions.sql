-- Function to generate transactions from active recurring expenses on their due day.
-- This function is idempotent and safe to run daily.
CREATE OR REPLACE FUNCTION public.generate_recurring_transactions()
RETURNS void AS $$
BEGIN
  RAISE NOTICE 'Starting recurring transactions generation for %', CURRENT_DATE;

  INSERT INTO public.transactions (
    couple_id,
    payer_user_id,
    amount,
    description,
    category_id,
    expense_date,
    recurring_expense_id
  )
  SELECT
    re.couple_id,
    re.payer_user_id,
    re.amount,
    re.description,
    re.category_id,
    CURRENT_DATE,
    re.id
  FROM
    public.recurring_expenses re
  WHERE
    re.active = TRUE
    AND re.day_of_month = EXTRACT(DAY FROM CURRENT_DATE)
    -- Idempotency Check: Do not insert if a transaction for this recurring_expense
    -- has already been created in the current month and year.
    AND NOT EXISTS (
      SELECT 1
      FROM public.transactions t
      WHERE t.recurring_expense_id = re.id
        AND DATE_TRUNC('month', t.expense_date) = DATE_TRUNC('month', CURRENT_DATE)
    );

  RAISE NOTICE 'Finished recurring transactions generation.';
END;
$$ LANGUAGE plpgsql;
