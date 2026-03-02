import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { rejectSettlement } from '@/lib/finance-service';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { settlementId } = await request.json();

    if (!settlementId) {
      return NextResponse.json({ error: 'ID da liquidação é obrigatório' }, { status: 400 });
    }

    await rejectSettlement(settlementId, session.coupleId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao rejeitar liquidação:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno ao rejeitar liquidação' },
      { status: 500 }
    );
  }
}