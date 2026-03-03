import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { requestSettlement } from '@/lib/finance-service';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Datas obrigatórias' }, { status: 400 });
    }

    console.log(`[API close-period] Iniciando solicitação para coupleId: ${session.coupleId}`);
    console.log(`[API close-period] Período: ${startDate} a ${endDate}`);

    // Chama a nova função de solicitação (requer aprovação)
    const result = await requestSettlement(
      session.coupleId,
      startDate,
      endDate,
      session.userId // Identifica quem pediu para notificar o outro
    );

    console.log('[API close-period] Resultado da operação:', result);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao solicitar fechamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar solicitação' },
      { status: 500 }
    );
  }
}