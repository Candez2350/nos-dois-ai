import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase.from('users').select('role').eq('id', session.userId).single();

  // Retorna apenas os dados seguros e necessários para o cliente
  return NextResponse.json({
    userId: session.userId,
    coupleId: session.coupleId,
    partnerName: session.partnerName,
    role: user?.role,
  });
}