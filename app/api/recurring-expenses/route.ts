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
  // Join with custom_categories to get the category name for the frontend
  const { data: expenses, error } = await supabase
    .from('recurring_expenses')
    .select('id, description, amount, day_of_month, active, created_at, category_id, custom_categories(name)')
    .eq('couple_id', session.coupleId)
    .order('description');

  if (error) {
    console.error('Erro ao buscar despesas recorrentes:', error);
    return NextResponse.json({ error: 'Erro ao carregar despesas recorrentes' }, { status: 500 });
  }

  // Flatten the response to make it easier for the client
  const flatExpenses = expenses?.map(e => ({
    ...e,
    category_name: (e.custom_categories as any)?.name || 'Sem categoria'
  }));

  return NextResponse.json({ expenses: flatExpenses || [] });
}

// POST /api/recurring-expenses
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { description, amount, category_id, day_of_month } = await req.json();

    if (!description || !amount || !category_id || !day_of_month) {
      return NextResponse.json({ error: 'Descrição, valor, categoria e dia são obrigatórios' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        couple_id: session.coupleId,
        payer_user_id: session.userId, // Assume o criador como pagador padrão
        description: description.trim(),
        amount,
        category_id, // Use category_id (UUID)
        day_of_month,
        active: true,
      })
      .select('id')
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

// PUT /api/recurring-expenses
export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
  
    try {
      const { id, description, amount, category_id, day_of_month, active } = await req.json();
  
      if (!id) {
        return NextResponse.json({ error: 'ID da despesa é obrigatório' }, { status: 400 });
      }
  
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update({
          description: description?.trim(),
          amount,
          category_id,
          day_of_month,
          active
        })
        .eq('id', id)
        .eq('couple_id', session.coupleId) // Security check
        .select('id')
        .single();
  
      if (error) {
        console.error('Erro ao atualizar despesa recorrente:', error);
        return NextResponse.json({ error: 'Erro ao atualizar despesa recorrente' }, { status: 500 });
      }
  
      return NextResponse.json({ expense: data }, { status: 200 });
    } catch (error: any) {
      console.error('Erro no PUT de despesa recorrente:', error);
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
      .eq('couple_id', session.coupleId);

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
