-- Migration to refactor category columns from TEXT to a FOREIGN KEY referencing custom_categories.
-- This script is designed to be run once and is wrapped in a transaction.

BEGIN;

-- Step 1: Add the new category_id columns as nullable to allow populating them later.
ALTER TABLE public.transactions ADD COLUMN category_id UUID;
ALTER TABLE public.recurring_expenses ADD COLUMN category_id UUID;
ALTER TABLE public.budgets ADD COLUMN category_id UUID;

-- Step 2: Ensure all existing category strings have a corresponding entry in custom_categories.
-- This prevents data loss by creating custom_category entries for any text categories
-- that were used in transactions/budgets but not formally created.
INSERT INTO public.custom_categories (couple_id, name)
SELECT DISTINCT t.couple_id, t.category
FROM public.transactions t
WHERE t.category IS NOT NULL AND t.couple_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.custom_categories cc
    WHERE cc.couple_id = t.couple_id AND cc.name = t.category
);

INSERT INTO public.custom_categories (couple_id, name)
SELECT DISTINCT re.couple_id, re.category
FROM public.recurring_expenses re
WHERE re.category IS NOT NULL AND re.couple_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.custom_categories cc
    WHERE cc.couple_id = re.couple_id AND cc.name = re.category
);

INSERT INTO public.custom_categories (couple_id, name)
SELECT DISTINCT b.couple_id, b.category
FROM public.budgets b
WHERE b.category IS NOT NULL AND b.couple_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM public.custom_categories cc
    WHERE cc.couple_id = b.couple_id AND cc.name = b.category
);

-- Step 3: Populate the new category_id columns by matching the old text names with the newly assured custom_categories.
UPDATE public.transactions t
SET category_id = (
    SELECT cc.id FROM public.custom_categories cc
    WHERE cc.couple_id = t.couple_id AND cc.name = t.category
)
WHERE t.category IS NOT NULL;

UPDATE public.recurring_expenses re
SET category_id = (
    SELECT cc.id FROM public.custom_categories cc
    WHERE cc.couple_id = re.couple_id AND cc.name = re.category
)
WHERE re.category IS NOT NULL;

UPDATE public.budgets b
SET category_id = (
    SELECT cc.id FROM public.custom_categories cc
    WHERE cc.couple_id = b.couple_id AND cc.name = b.category
)
WHERE b.category IS NOT NULL;

-- Step 4: Enforce NOT NULL constraints where they existed on the original text columns.
-- This is critical for maintaining data integrity.
ALTER TABLE public.recurring_expenses ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE public.budgets ALTER COLUMN category_id SET NOT NULL;

-- Step 5: Add the foreign key constraints to enforce relationships at the database level.
-- Different ON DELETE strategies are used based on what makes sense for each table.
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.custom_categories(id) ON DELETE SET NULL; -- Uncategorize transaction if category is deleted.

ALTER TABLE public.recurring_expenses
ADD CONSTRAINT recurring_expenses_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.custom_categories(id) ON DELETE RESTRICT; -- Prevent deleting a category that a recurring expense uses.

ALTER TABLE public.budgets
ADD CONSTRAINT budgets_category_id_fkey
FOREIGN KEY (category_id) REFERENCES public.custom_categories(id) ON DELETE CASCADE; -- If a category is deleted, its budget is deleted too.

-- Step 6: Drop the old, redundant text-based category columns.
ALTER TABLE public.transactions DROP COLUMN category;
ALTER TABLE public.recurring_expenses DROP COLUMN category;
ALTER TABLE public.budgets DROP COLUMN category;

-- Step 7: Add a unique constraint to the budgets table to prevent duplicate budgets for the same category by the same couple.
ALTER TABLE public.budgets ADD CONSTRAINT budgets_couple_id_category_id_key UNIQUE (couple_id, category_id);

-- Step 8: Add a column to transactions to track the originating recurring expense.
ALTER TABLE public.transactions ADD COLUMN recurring_expense_id UUID;

-- Add the foreign key constraint for the new column.
-- If a recurring expense is deleted, the transaction remains but is unlinked.
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_recurring_expense_id_fkey
FOREIGN KEY (recurring_expense_id) REFERENCES public.recurring_expenses(id) ON DELETE SET NULL;

COMMIT;
