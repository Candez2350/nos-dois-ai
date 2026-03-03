-- Creates a PostgreSQL function to calculate budget progress for a given couple and month.
-- This function simplifies the API logic by performing the complex query directly in the database.
CREATE OR REPLACE FUNCTION public.get_budgets_progress(p_couple_id UUID, p_month_year TEXT)
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  limit_amount NUMERIC,
  total_spent NUMERIC
) AS $$
BEGIN
    -- This query joins budgets with an aggregate of transactions to calculate the total spent
    -- for each category within the specified month.
    RETURN QUERY
    SELECT
        b.category_id,
        c.name AS category_name,
        b.limit_amount,
        COALESCE(spent.total, 0) AS total_spent
    FROM 
        public.budgets b
    JOIN 
        public.custom_categories c ON b.category_id = c.id
    LEFT JOIN (
        -- Subquery to aggregate expenses for the given couple and month
        SELECT
            t.category_id,
            SUM(t.amount) AS total
        FROM
            public.transactions t
        WHERE
            t.couple_id = p_couple_id
            AND TO_CHAR(t.expense_date, 'YYYY-MM') = p_month_year
        GROUP BY
            t.category_id
    ) AS spent ON b.category_id = spent.category_id
    WHERE
        b.couple_id = p_couple_id
        AND b.month_year = p_month_year
    ORDER BY
        c.name;
END;
$$ LANGUAGE plpgsql;
