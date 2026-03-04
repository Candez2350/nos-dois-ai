import { NextResponse } from 'next/server';
import { getSession, AppSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Interface for the data returned from the RPC function
interface BudgetProgressData {
  category_id: string;
  category_name: string;
  limit_amount: number;
  total_spent: number;
}

// Interface for the final API response object
interface BudgetProgressResponse extends BudgetProgressData {
  progress: number;
}

// GET /api/dashboard/budgets-progress
export async function GET() {
  const session: AppSession | null = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const currentMonthYear = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

    // Call the PostgreSQL function via RPC
    const { data, error } = await supabase.rpc('get_budgets_progress', {
      p_couple_id: session.coupleId,
      p_month_date: currentMonthYear,
    });

    if (error) {
      console.error('Erro ao chamar RPC get_budgets_progress:', error);
      return NextResponse.json(
        { error: 'Erro ao calcular o progresso dos orçamentos.' },
        { status: 500 }
      );
    }

    // Process the data to add the 'progress' percentage
    const budgetsProgress: BudgetProgressResponse[] = (data as BudgetProgressData[]).map(
      (item) => ({
        ...item,
        // Ensure no division by zero if limit is 0 or null
        progress: item.limit_amount > 0 ? item.total_spent / item.limit_amount : 0,
      })
    );

    return NextResponse.json(budgetsProgress);
  } catch (e: any) {
    console.error('Erro inesperado no endpoint de progresso de orçamentos:', e);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
