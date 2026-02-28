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
      .select('id, amount, description, category, expense_date, payer_wa_number, created_at')
      .eq('couple_id', session.coupleId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (start) query = query.gte('expense_date', start);
    if (end) query = query.lte('expense_date', end);

    const { data: transactions, error } = await query;
    if (error) throw error;

    const { data: couple } = await supabase
      .from('couples')
      .select('partner_1_name, partner_2_name, p1_wa_number, p2_wa_number')
      .eq('id', session.coupleId)
      .single();

    const partnerLabel = (wa: string) => {
      if (wa === couple?.p1_wa_number) return (couple as { partner_1_name?: string }).partner_1_name || 'Parceiro 1';
      if (wa === couple?.p2_wa_number) return (couple as { partner_2_name?: string }).partner_2_name || 'Parceiro 2';
      return wa;
    };

    const list = (transactions || []).map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      description: t.description,
      category: t.category,
      expense_date: t.expense_date,
      payer: partnerLabel(t.payer_wa_number),
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
