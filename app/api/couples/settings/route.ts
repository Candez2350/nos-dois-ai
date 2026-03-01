import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: couple, error } = await supabase
    .from('couples')
    .select('*')
    .eq('id', session.coupleId)
    .single();

  if (error || !couple) return NextResponse.json({ error: 'Casal não encontrado' }, { status: 404 });

  return NextResponse.json({ couple });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  // Somente Parceiro 1 pode editar configurações (como solicitado)
  if (session.partner !== 1) {
    return NextResponse.json({ error: 'Apenas o Parceiro 1 (assinante) pode alterar configurações.' }, { status: 403 });
  }

  try {
    const { name, split_type, split_percentage_partner_1, split_percentage_partner_2 } = await req.json();
    const supabase = getSupabaseAdmin();

    const updates: any = {};
    if (name) updates.name = name;
    if (split_type) updates.split_type = split_type;
    if (typeof split_percentage_partner_1 === 'number') updates.split_percentage_partner_1 = split_percentage_partner_1;
    if (typeof split_percentage_partner_2 === 'number') updates.split_percentage_partner_2 = split_percentage_partner_2;

    const { error: updateErr } = await supabase
      .from('couples')
      .update(updates)
      .eq('id', session.coupleId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
