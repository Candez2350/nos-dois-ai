
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId || session.role !== 'partner_1') {
    return NextResponse.json({ error: 'Apenas o Parceiro 1 pode realizar ajustes de saldo.' }, { status: 403 });
  }

  try {
    const { amount, debtor, reason } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido para o ajuste.' }, { status: 400 });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'O motivo do ajuste é obrigatório.' }, { status: 400 });
    }
    if (!['partner_1', 'partner_2'].includes(debtor)) {
      return NextResponse.json({ error: 'Devedor inválido.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('partner_1_id, partner_2_id')
      .eq('id', session.coupleId)
      .single();

    if (coupleError || !coupleData) {
      return NextResponse.json({ error: 'Casal não encontrado.' }, { status: 404 });
    }

    const creditorId = debtor === 'partner_1' ? coupleData.partner_2_id : coupleData.partner_1_id;
    const debtorId = debtor === 'partner_1' ? coupleData.partner_1_id : coupleData.partner_2_id;

    if (!creditorId || !debtorId) {
        return NextResponse.json({ error: 'Parceiros do casal não configurados corretamente.' }, { status: 500 });
    }


    const { error: insertError } = await supabase
      .from('transactions')
      .insert({
        couple_id: session.coupleId,
        amount,
        description: `Ajuste: ${reason}`,
        category: 'Ajuste',
        paid_by_id: creditorId,
        paid_for_id: debtorId, 
        transaction_type: 'adjustment',
        status: 'approved',
      });

    if (insertError) {
      console.error('Erro ao inserir transação de ajuste:', insertError);
      return NextResponse.json({ error: 'Falha ao criar a transação de ajuste.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error: any) {
    console.error('Erro no ajuste de saldo:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
