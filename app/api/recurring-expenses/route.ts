import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

// GET /api/recurring-expenses
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: expenses, error } = await supabase
    .from('recurring_expenses')
    .select('id, description, amount, category, day_of_month, active, created_at')
    .eq('couple_id', session.coupleId)
    .order('description');

  if (error) {
    console.error('Erro ao buscar despesas recorrentes:', error);
    return NextResponse.json({ error: 'Erro ao carregar despesas recorrentes' }, { status: 500 });
  }

  return NextResponse.json({ expenses: expenses || [] });
}

// POST /api/recurring-expenses
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { description, amount, category, day_of_month } = await req.json();

    if (!description || !amount || !category || !day_of_month) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        couple_id: session.coupleId,
        description: description.trim(),
        amount,
        category: category.trim(),
        day_of_month,
        active: true, // Nova despesa sempre ativa por padrão
      })
      .select('id, description, amount, category, day_of_month, active, created_at')
      .single();

    if (error) {
      console.error('Erro ao criar despesa recorrente:', error);
      return NextResponse.json({ error: 'Erro ao criar despesa recorrente' }, { status: 500 });
    }

    return NextResponse.json({ expense: data }, { status: 201 });
  } catch (error: any) {
    console.error('Erro no POST de despesa recorrente:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/recurring-expenses?id=...
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID da despesa recorrente é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id)
      .eq('couple_id', session.coupleId); // Garante que só pode deletar do próprio casal

    if (error) {
      console.error('Erro ao deletar despesa recorrente:', error);
      return NextResponse.json({ error: 'Erro ao deletar despesa recorrente' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no DELETE de despesa recorrente:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
