import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';
import { sendNotification } from '@/lib/notification-service';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { id: transactionId } = params;

  try {
    const { amount, description, category, expense_date } = await req.json();

    const supabase = createAdminClient();
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('couple_id')
      .eq('id', transactionId)
      .single();

    if (txError || !tx || tx.couple_id !== session.coupleId) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    const { error: insertError } = await supabase
      .from('adjustment_requests')
      .insert({
        transaction_id: transactionId,
        requested_by: session.userId,
        new_amount: amount,
        new_description: description,
        new_category_id: category, // Assuming this is the new field
        new_date: expense_date,
        status: 'pending',
      });

    if (insertError) throw insertError;

    // --- Notification Logic ---
    const { data: partner } = await supabase
      .from('users')
      .select('id') // Select partner's user ID for push notification
      .eq('couple_id', session.coupleId)
      .neq('id', session.userId)
      .single();

    if (partner?.id) {
      await sendNotification(partner.id, {
        title: 'Solicitação de Ajuste',
        body: `${session.partnerName} pediu para ajustar uma despesa.`,
      });
    }

    return NextResponse.json({ success: true, message: 'Solicitação de ajuste enviada.' });
  } catch (error: any) {
    console.error('Erro ao solicitar ajuste:', error);
    return NextResponse.json({ error: 'Erro ao solicitar ajuste.' }, { status: 500 });
  }
}
