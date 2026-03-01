import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Busca todos os fechamentos (settlements) do casal
  const { data: settlements, error } = await supabase
    .from('settlements')
    .select('id, couple_id, amount_settled, paid_by, received_by, month_reference, created_at')
    .eq('couple_id', session.coupleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao listar fechamentos:', error);
    return NextResponse.json({ error: 'Erro ao carregar histórico.' }, { status: 500 });
  }

  // Busca os nomes dos usuários que pagaram e receberam para cada settlement
  const userIds = settlements?.flatMap(s => [s.paid_by, s.received_by]).filter((id): id is string => id !== undefined && id !== null);
  let usersMap = {};
  if (userIds && userIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', userIds);
    usersMap = (users || []).reduce((acc, user) => {
      acc[user.id] = user.name;
      return acc;
    }, {});
  }

  const formattedSettlements = (settlements || []).map(s => ({
    ...s,
    payerName: usersMap[s.paid_by] || 'Parceiro',
    receiverName: usersMap[s.received_by] || 'Parceiro',
  }));

  return NextResponse.json({ history: formattedSettlements });
}
