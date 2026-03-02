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

    // Chama a nova função de solicitação (requer aprovação)
    const result = await requestSettlement(
      session.coupleId,
      startDate,
      endDate,
      session.userId // Identifica quem pediu para notificar o outro
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Erro ao solicitar fechamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar solicitação' },
      { status: 500 }
    );
  }
}