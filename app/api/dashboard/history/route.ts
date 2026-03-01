import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

// Define the type for usersMap
interface UsersMap {
  [key: string | number]: string; // Allows indexing by user ID (string or number) to get a string (user name)
}

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

  // Extract user IDs from settlements, ensuring they are valid strings or numbers
  const userIds = settlements?.flatMap(s => [s.paid_by, s.received_by]).filter((id): id is string | number => id !== undefined && id !== null);
  let usersMap: UsersMap = {}; // Initialize with an explicit type
  if (userIds && userIds.length > 0) {
    const { data: users } = await supabase
      .from('users') // Assuming your user table is named 'users'
      .select('id, name')
      .in('id', userIds);

    // Ensure users is not null and has data before reducing
    if (users) {
        usersMap = (users).reduce((acc: UsersMap, user) => {
          // Ensure user.id and user.name exist before assigning
          if (user.id !== undefined && user.name !== undefined) {
            acc[user.id] = user.name;
          }
          return acc;
        }, {} as UsersMap); // Initialize with an empty object of type UsersMap
    }
  }

  const formattedSettlements = (settlements || []).map(s => ({
    ...s,
    payerName: usersMap[s.paid_by] || 'Parceiro',
    receiverName: usersMap[s.received_by] || 'Parceiro',
  }));

  return NextResponse.json({ history: formattedSettlements });
}
