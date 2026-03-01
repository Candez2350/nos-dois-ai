import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase com a chave de serviço para operações de backend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('elo_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { coupleId } = session;

    const { data: couple, error } = await supabase
      .from('couples')
      .select('*')
      .eq('id', coupleId)
      .single();

    if (error) {
      console.error('Erro ao buscar casal:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    return NextResponse.json({ couple });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('elo_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { coupleId, partner } = session;

    // Regra de Negócio: Apenas o Parceiro 1 pode editar configurações globais
    if (partner !== 1) {
      return NextResponse.json(
        { error: 'Apenas o parceiro 1 pode alterar as configurações.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      split_type, 
      split_percentage_partner_1, 
      split_percentage_partner_2,
      ai_personality 
    } = body;

    const { error } = await supabase
      .from('couples')
      .update({
        name,
        split_type,
        split_percentage_partner_1,
        split_percentage_partner_2,
        ai_personality
      })
      .eq('id', coupleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}