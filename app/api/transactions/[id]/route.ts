import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  try {
    const body = await req.json();
    const { amount, description, category, expense_date } = body;

    const supabase = getSupabaseAdmin();
    const { data: tx, error: fetchErr } = await supabase
      .from('transactions')
      .select('id, couple_id')
      .eq('id', id)
      .eq('couple_id', session.coupleId)
      .single();

    if (fetchErr || !tx) {
      return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof amount === 'number' && amount >= 0) updates.amount = amount;
    if (typeof description === 'string') updates.description = description.trim();
    if (typeof category === 'string') updates.category = category.trim();
    if (typeof expense_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expense_date)) {
      updates.expense_date = expense_date;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('couple_id', session.coupleId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Erro ao atualizar transação:', e?.message);
    return NextResponse.json({ error: e?.message || 'Erro ao atualizar.' }, { status: 500 });
  }
}
