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
  const body = await req.json().catch(() => ({}));
  const action = body.action === 'reject' ? 'rejected' : 'approved';

  const supabase = getSupabaseAdmin();

  const { data: dr, error: fetchErr } = await supabase
    .from('deletion_requests')
    .select('id, transaction_id, requested_by, status')
    .eq('id', requestId)
    .eq('status', 'pending')
    .single();

  if (fetchErr || !dr) {
    return NextResponse.json({ error: 'Solicitação não encontrada ou já respondida.' }, { status: 404 });
  }

  const { data: tx } = await supabase
    .from('transactions')
    .select('couple_id')
    .eq('id', dr.transaction_id)
    .single();

  if (!tx || tx.couple_id !== session.coupleId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  if (dr.requested_by === session.userId) {
    return NextResponse.json({ error: 'Você não pode aprovar a própria solicitação.' }, { status: 400 });
  }

  const { error: updateErr } = await supabase
    .from('deletion_requests')
    .update({
      status: action,
      responded_by: session.userId,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateErr) {
    return NextResponse.json({ error: 'Erro ao responder.' }, { status: 500 });
  }

  if (action === 'approved') {
    await supabase.from('transactions').delete().eq('id', dr.transaction_id);
  }

  return NextResponse.json({ success: true, action });
}
