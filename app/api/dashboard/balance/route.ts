import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getBalance } from '@/lib/finance-service';

function getMonthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let startDate: string;
    let endDate: string;

    if (month) {
      const range = getMonthRange(month);
      startDate = range.start;
      endDate = range.end;
    } else if (start && end) {
      startDate = start;
      endDate = end;
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth() + 1;
      const range = getMonthRange(`${y}-${String(m).padStart(2, '0')}`);
      startDate = range.start;
      endDate = range.end;
    }

    const balance = await getBalance(session.coupleId, startDate, endDate);
    return NextResponse.json({
      balance,
      period: { startDate, endDate },
    });
  } catch (error: any) {
    console.error('Erro no balance:', error.message);
    return NextResponse.json(
      { error: 'Erro ao buscar saldo.' },
      { status: 500 }
    );
  }
}
