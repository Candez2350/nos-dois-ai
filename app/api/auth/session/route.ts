import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Retorna apenas os dados seguros e necessários para o cliente
  return NextResponse.json({
    userId: session.userId,
    coupleId: session.coupleId,
    partnerName: session.partnerName,
  });
}