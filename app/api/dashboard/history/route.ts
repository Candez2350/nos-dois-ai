import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

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

    // 1. Busca dados do casal para saber os nomes
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('partner1_name, partner2_name')
      .eq('id', coupleId)
      .single();

    if (coupleError) {
      return NextResponse.json({ error: 'Erro ao buscar dados do casal' }, { status: 500 });
    }

    // 2. Busca o histórico de fechamentos
    const { data: history, error: historyError } = await supabase
      .from('settlements')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (historyError) {
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 });
    }

    // 3. Formata os dados adicionando os nomes legíveis
    // Assume que no banco 'paid_by' é salvo como 'partner_1' ou 'partner_2'
    const formattedHistory = history.map((item) => {
      const payerName = item.paid_by === 'partner_1' 
        ? couple.partner1_name 
        : couple.partner2_name;
        
      const receiverName = item.received_by === 'partner_1' 
        ? couple.partner1_name 
        : couple.partner2_name;

      return {
        ...item,
        payer_name: payerName || 'Parceiro',
        receiver_name: receiverName || 'Você',
      };
    });

    return NextResponse.json({ history: formattedHistory });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}