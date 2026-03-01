import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: rows, error } = await supabase
    .from('adjustment_requests')
    .select(`
      id,
      transaction_id,
      requested_by,
      new_amount,
      new_description,
      new_category,
      new_date,
      status,
      created_at,
      transactions (id, couple_id, amount, description, category, expense_date)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao listar solicitações de ajuste:', error);
    return NextResponse.json({ error: 'Erro ao carregar.' }, { status: 500 });
  }

  const list = (rows || []).filter(
    (r: any) =>
      r.transactions?.couple_id === session.coupleId && r.requested_by !== session.userId
  );
  
  const formatted = list.map((r: any) => ({
    id: r.id,
    transaction_id: r.transaction_id,
    requested_by: r.requested_by,
    new_amount: r.new_amount,
    new_description: r.new_description,
    new_category: r.new_category,
    new_date: r.new_date,
    status: r.status,
    created_at: r.created_at,
    transaction: r.transactions,
  }));

  return NextResponse.json({ requests: formatted });
}
