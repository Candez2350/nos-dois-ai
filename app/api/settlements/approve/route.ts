import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { approveSettlement } from '@/lib/finance-service';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { settlementId } = await request.json();

    if (!settlementId) {
      return NextResponse.json({ error: 'ID da solicitação é obrigatório' }, { status: 400 });
    }

    await approveSettlement(settlementId, session.coupleId);

    return NextResponse.json({ message: 'Fechamento aprovado com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao aprovar fechamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao processar a aprovação' },
      { status: 500 }
    );
  }
}
