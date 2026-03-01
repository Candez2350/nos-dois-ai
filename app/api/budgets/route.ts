import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

// GET /api/budgets
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: budgets, error } = await supabase
    .from('budgets')
    .select('id, category, limit_amount, month_year, created_at')
    .eq('couple_id', session.coupleId)
    .order('month_year', { ascending: false })
    .order('category');

  if (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json({ error: 'Erro ao carregar orçamentos' }, { status: 500 });
  }

  return NextResponse.json({ budgets: budgets || [] });
}

// POST /api/budgets
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { category, limit_amount, month_year } = await req.json();

    if (!category || !limit_amount || !month_year) {
      return NextResponse.json({ error: 'Categoria, valor limite e mês/ano são obrigatórios' }, { status: 400 });
    }

    // Validação simples do formato YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month_year)) {
      return NextResponse.json({ error: 'Formato de mês/ano inválido. Use YYYY-MM.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        couple_id: session.coupleId,
        category: category.trim(),
        limit_amount,
        month_year,
      })
      .select('id, category, limit_amount, month_year, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Orçamento para esta categoria e mês já existe.' }, { status: 409 });
      }
      console.error('Erro ao criar orçamento:', error);
      return NextResponse.json({ error: 'Erro ao criar orçamento' }, { status: 500 });
    }

    return NextResponse.json({ budget: data }, { status: 201 });
  } catch (error: any) {
    console.error('Erro no POST de orçamento:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE /api/budgets?id=...
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID do orçamento é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('couple_id', session.coupleId);

    if (error) {
      console.error('Erro ao deletar orçamento:', error);
      return NextResponse.json({ error: 'Erro ao deletar orçamento' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no DELETE de orçamento:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
