import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('transactions')
      .select('id, amount, description, category, expense_date, payer_user_id, payer_wa_number, created_at')
      .eq('couple_id', session.coupleId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (start) query = query.gte('expense_date', start);
    if (end) query = query.lte('expense_date', end);

    const { data: transactions, error } = await query;
    if (error) throw error;

    const { data: users } = await supabase
      .from('users')
      .select('id, name, whatsapp_number')
      .eq('couple_id', session.coupleId);

    const nameByUserId = new Map(users?.map((u) => [u.id, u.name]) ?? []);
    const nameByWa = new Map(users?.map((u) => [u.whatsapp_number, u.name]) ?? []);

    const payerName = (t: { payer_user_id?: string | null; payer_wa_number?: string | null }) =>
      (t.payer_user_id && nameByUserId.get(t.payer_user_id)) ||
      (t.payer_wa_number && nameByWa.get(t.payer_wa_number)) ||
      t.payer_wa_number ||
      '—';

    const list = (transactions || []).map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description,
      category: t.category,
      expense_date: t.expense_date,
      payer: payerName(t),
      payer_user_id: t.payer_user_id,
      payer_wa_number: t.payer_wa_number,
      created_at: t.created_at,
    }));

    return NextResponse.json({ expenses: list });
  } catch (error: any) {
    console.error('Erro ao listar gastos:', error.message);
    return NextResponse.json(
      { error: 'Erro ao listar gastos.' },
      { status: 500 }
    );
  }
}
