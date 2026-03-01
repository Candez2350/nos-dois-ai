
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

// GET /api/custom-categories
export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: categories, error } = await supabase
    .from('custom_categories')
    .select('id, name, created_at')
    .eq('couple_id', session.coupleId)
    .order('name');

  if (error) {
    console.error('Erro ao buscar categorias personalizadas:', error);
    return NextResponse.json({ error: 'Erro ao carregar categorias' }, { status: 500 });
  }

  return NextResponse.json({ categories: categories || [] });
}

// POST /api/custom-categories
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nome da categoria é obrigatório' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('custom_categories')
      .insert({
        couple_id: session.coupleId,
        name: name.trim(),
      })
      .select('id, name, created_at')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Esta categoria já existe para o seu casal.' }, { status: 409 });
      }
      console.error('Erro ao criar categoria personalizada:', error);
      return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
    }

    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error: any) {
    console.error('Erro no POST de categoria personalizada:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}



// DELETE /api/custom-categories?id=... (usando query param para simplificar)
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('custom_categories')
      .delete()
      .eq('id', id)
      .eq('couple_id', session.coupleId); // Garante que só pode deletar do próprio casal

    if (error) {
      console.error('Erro ao deletar categoria personalizada:', error);
      return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no DELETE de categoria personalizada:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}

