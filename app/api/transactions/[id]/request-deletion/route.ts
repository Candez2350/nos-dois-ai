import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';
import { sendNotification } from '@/lib/notification-service';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id: transactionId } = params;
  if (!transactionId) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .select('id, couple_id, description')
    .eq('id', transactionId)
    .eq('couple_id', session.coupleId)
    .single();

  if (txErr || !tx) {
    return NextResponse.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from('deletion_requests')
    .select('id, status')
    .eq('transaction_id', transactionId)
    .eq('requested_by', session.userId)
    .in('status', ['pending', 'approved'])
    .maybeSingle();

  if (existing) {
    if (existing.status === 'pending') {
      return NextResponse.json({ error: 'Já existe uma solicitação de exclusão pendente.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Esta exclusão já foi aprovada.' }, { status: 400 });
  }

  const { error: insertErr } = await supabase.from('deletion_requests').insert({
    transaction_id: transactionId,
    requested_by: session.userId,
    status: 'pending',
  });

  if (insertErr) {
    console.error('Erro ao criar solicitação:', insertErr);
    return NextResponse.json({ error: 'Erro ao solicitar exclusão.' }, { status: 500 });
  }

  // --- Notification Logic ---
  const { data: partner } = await supabase
    .from('users')
    .select('id') // Select partner's user ID for push notification
    .eq('couple_id', session.coupleId)
    .neq('id', session.userId)
    .single();

  if (partner?.id) {
    await sendNotification(partner.id, {
        title: 'Solicitação de Exclusão',
        body: `${session.partnerName} pediu para excluir uma despesa.`,
    });
  }

  return NextResponse.json({ success: true, message: 'Solicitação enviada. Aguarde o parceiro aprovar.' });
}
