import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Busca fechamentos concluídos (status = COMPLETED)
    const { data: settlements, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('couple_id', session.coupleId)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
    }

    // Busca nomes dos usuários para exibir quem pagou/recebeu
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .eq('couple_id', session.coupleId);

    const history = settlements.map((s) => {
      const payer = users?.find((u) => u.id === s.paid_by);
      const receiver = users?.find((u) => u.id === s.received_by);
      return {
        id: s.id,
        amount_settled: s.amount_settled,
        paid_by: s.paid_by,
        received_by: s.received_by,
        month_reference: s.month_reference,
        created_at: s.created_at,
        payer_name: payer?.name || 'Parceiro',
        receiver_name: receiver?.name || 'Você',
      };
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Erro interno ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}