import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from('chat_messages')
      .select('id, sender, content, transaction_id, created_at')
      .eq('couple_id', session.coupleId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;

    const txIds = [...new Set((rows || []).map((r) => r.transaction_id).filter(Boolean))] as string[];
    let txMap: Record<string, { amount: number; description: string; category: string; expense_date: string }> = {};
    if (txIds.length > 0) {
      const { data: txs } = await supabase
        .from('transactions')
        .select('id, amount, description, category, expense_date')
        .in('id', txIds);
      txMap = Object.fromEntries((txs || []).map((t) => [t.id, { amount: Number(t.amount), description: t.description, category: t.category, expense_date: t.expense_date }]));
    }

    const messages = (rows || []).map((r) => {
      const tx = r.transaction_id ? txMap[r.transaction_id] : null;
      return {
        id: r.id,
        role: r.sender as 'user' | 'assistant',
        content: r.content,
        transaction_id: r.transaction_id,
        created_at: r.created_at,
        expense: tx ? { valor: tx.amount, local: tx.description, categoria: tx.category, data: tx.expense_date } : undefined,
      };
    });

    return NextResponse.json({ messages });
  } catch (e: any) {
    if (e?.code === '42P01' || String(e?.message || '').includes('chat_messages')) {
      return NextResponse.json({ messages: [] });
    }
    console.error('Erro ao buscar histórico do chat:', e?.message);
    return NextResponse.json({ messages: [] });
  }
}
