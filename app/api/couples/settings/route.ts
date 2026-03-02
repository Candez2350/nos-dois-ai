import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: couple } = await supabase
    .from('couples')
    .select('*')
    .eq('id', session.coupleId)
    .single();

  return NextResponse.json({ couple });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Verifica se o usuário é o Parceiro 1
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.userId)
    .single();

  if (user?.role !== 'partner_1') {
    return NextResponse.json({ error: 'Apenas o Parceiro 1 pode alterar as configurações.' }, { status: 403 });
  }

  const { error } = await supabase
    .from('couples')
    .update({
      name: body.name,
      split_type: body.split_type,
      split_percentage_partner_1: body.split_percentage_partner_1,
      split_percentage_partner_2: body.split_percentage_partner_2,
    })
    .eq('id', session.coupleId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}