import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { requestId } = await params;
  const { action } = await req.json();

  const supabase = getSupabaseAdmin();

  try {
    const { data: request, error: fetchErr } = await supabase
      .from('adjustment_requests')
      .select('*, transactions(id, couple_id)')
      .eq('id', requestId)
      .single();

    if (fetchErr || !request || request.status !== 'pending') {
      return NextResponse.json({ error: 'Solicitação não encontrada ou já respondida.' }, { status: 404 });
    }

    if (request.transactions.couple_id !== session.coupleId) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    if (action === 'reject') {
      await supabase
        .from('adjustment_requests')
        .update({ status: 'rejected', responded_by: session.userId, responded_at: new Date() })
        .eq('id', requestId);
      return NextResponse.json({ success: true, message: 'Ajuste rejeitado.' });
    }

    if (action === 'approve') {
      const updates: any = {};
      if (request.new_amount !== null) updates.amount = request.new_amount;
      if (request.new_description !== null) updates.description = request.new_description;
      if (request.new_category !== null) updates.category = request.new_category;
      if (request.new_date !== null) updates.expense_date = request.new_date;

      const { error: txError } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', request.transaction_id);

      if (txError) throw txError;

      await supabase
        .from('adjustment_requests')
        .update({ status: 'approved', responded_by: session.userId, responded_at: new Date() })
        .eq('id', requestId);

      return NextResponse.json({ success: true, message: 'Ajuste aprovado e aplicado.' });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao responder solicitação de ajuste:', error);
    return NextResponse.json({ error: 'Erro ao processar.' }, { status: 500 });
  }
}
