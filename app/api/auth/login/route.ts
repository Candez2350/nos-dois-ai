import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const { activationToken, partner, partnerName } = await req.json();

    if (!activationToken || !partner) {
      return NextResponse.json(
        { error: 'Código do casal e escolha do parceiro são obrigatórios.' },
        { status: 400 }
      );
    }

    if (partner !== 1 && partner !== 2) {
      return NextResponse.json(
        { error: 'Parceiro deve ser 1 ou 2.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const token = String(activationToken).trim().toUpperCase();

    const { data: couple, error: fetchError } = await supabase
      .from('couples')
      .select('*')
      .eq('activation_token', token)
      .single();

    if (fetchError || !couple) {
      return NextResponse.json(
        { error: 'Código do casal inválido.' },
        { status: 401 }
      );
    }

    const updates: Record<string, unknown> = {};
    const p1Key = 'p1_wa_number';
    const p2Key = 'p2_wa_number';
    const name1Key = 'partner_1_name';
    const name2Key = 'partner_2_name';

    if (!couple[p1Key]) updates[p1Key] = 'app_p1';
    if (!couple[p2Key]) updates[p2Key] = 'app_p2';
    if (partnerName) {
      if (partner === 1) updates[name1Key] = partnerName;
      else updates[name2Key] = partnerName;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('couples').update(updates).eq('id', couple.id);
    }

    await createSession({
      coupleId: couple.id,
      partner: partner as 1 | 2,
      partnerName: partnerName || (partner === 1 ? 'Parceiro 1' : 'Parceiro 2'),
      activationToken: token,
    });

    return NextResponse.json({
      success: true,
      coupleId: couple.id,
      partner,
    });
  } catch (error: any) {
    console.error('❌ Erro no login:', error.message);
    return NextResponse.json(
      { error: 'Erro ao fazer login.' },
      { status: 500 }
    );
  }
}
