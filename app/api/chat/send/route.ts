import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';
import { analyzeExpense } from '@/lib/gemini-service';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado. Faça login novamente.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text, imageBase64 } = body;

    if (!text && !imageBase64) {
      return NextResponse.json(
        { error: 'Envie um texto ou uma imagem de recibo.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const expense = await analyzeExpense(
      imageBase64 ? { imageBase64 } : { text: String(text).trim() }
    );

    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: session.coupleId,
      payer_user_id: session.userId,
      amount: expense.valor,
      description: expense.local,
      category: expense.categoria,
      expense_date: expense.data,
      ai_metadata: {
        source: imageBase64 ? 'ocr' : 'text',
        raw: expense,
        date_certainty: expense.data_identificada,
      },
    });

    if (txError) throw txError;

    let message =
      `✅ *Anotado!*\n\n` +
      `💰 *R$ ${expense.valor.toFixed(2)}*\n` +
      `📅 *Data:* ${new Date(expense.data).toLocaleDateString('pt-BR')}\n` +
      `📍 *Local:* ${expense.local}\n` +
      `👤 *Por:* ${session.partnerName}`;

    if (!expense.data_identificada) {
      message += `\n\n⚠️ *Aviso:* Não identifiquei a data, salvei como *hoje*.`;
    }

    return NextResponse.json({
      success: true,
      message,
      expense: {
        valor: expense.valor,
        local: expense.local,
        categoria: expense.categoria,
        data: expense.data,
      },
    });
  } catch (error: any) {
    console.error('🔥 Erro no chat/send:', error.message);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar gasto.' },
      { status: 500 }
    );
  }
}
