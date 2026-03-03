import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getSupabaseAdmin();
    
    console.log(`[API settlement-requests] Buscando solicitação PENDING para coupleId: ${session.coupleId}`);

    // Busca solicitação pendente para o casal
    const { data: request, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('couple_id', session.coupleId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false }) // Pega a mais recente
      .limit(1) // Garante que teremos apenas uma
      .single(); // .single() é seguro de usar com .limit(1)

    if (error) {
      console.error('[API settlement-requests] Erro na query do Supabase:', error);
      // Ainda assim, não vamos travar a aplicação, vamos retornar nulo.
      return NextResponse.json({ request: null, error: 'Erro de banco de dados.' });
    }

    console.log('[API settlement-requests] Resultado da query:', request);

    if (!request) {
      return NextResponse.json({ request: null });
    }

    let requesterName = 'Parceiro';
    if (request.requested_by) {
      // Busca o nome de quem solicitou de forma segura
      const { data: requester } = await supabase
        .from('users')
        .select('name')
        .eq('id', request.requested_by)
        .maybeSingle();
      
      if (requester?.name) requesterName = requester.name;
    }

    return NextResponse.json({
      request: {
        id: request.id,
        amount: request.amount_settled,
        period: request.month_reference,
        requesterName,
      },
      isRequester: request.requested_by === session.userId,
    });
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}