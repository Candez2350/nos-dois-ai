import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { calculateSettlement } from '@/lib/finance-service';

function parseDate(dateStr: string): string | null {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const date = new Date(`${y}-${m}-${d}`);
    if (!isNaN(date.getTime())) return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { startDate, endDate } = body;

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || !end) {
      return NextResponse.json(
        { error: 'Datas inválidas. Use DD/MM/AAAA ou AAAA-MM-DD.' },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'Data inicial deve ser anterior à data final.' },
        { status: 400 }
      );
    }

    const result = await calculateSettlement(
      session.coupleId,
      start,
      end
    );

    if (!result) {
      return NextResponse.json({
        success: true,
        closed: false,
        message: 'Nenhuma despesa pendente no período.',
      });
    }

    return NextResponse.json({
      success: true,
      closed: true,
      settlement: result,
    });
  } catch (error: any) {
    console.error('Erro ao fechar período:', error.message);
    return NextResponse.json(
      { error: error.message || 'Erro ao fechar período.' },
      { status: 500 }
    );
  }
}
