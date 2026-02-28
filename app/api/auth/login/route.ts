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

    const waNum = `app_${couple.id}_${partner}`;
    const displayName = partnerName?.trim() || `Parceiro ${partner}`;
    const role = partner === 1 ? 'partner_1' : 'partner_2';

    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          couple_id: couple.id,
          name: displayName,
          whatsapp_number: waNum,
          role,
        },
        { onConflict: 'whatsapp_number' }
      )
      .select('id')
      .single();

    if (userError || !user) {
      console.error('Erro ao criar/atualizar user:', userError);
      return NextResponse.json(
        { error: 'Erro ao registrar usuário.' },
        { status: 500 }
      );
    }

    await supabase
      .from('couples')
      .update({
        [partner === 1 ? 'p1_wa_number' : 'p2_wa_number']: waNum,
        [partner === 1 ? 'partner_1_id' : 'partner_2_id']: user.id,
      })
      .eq('id', couple.id);

    await createSession({
      coupleId: couple.id,
      partner: partner as 1 | 2,
      partnerName: displayName,
      userId: user.id,
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
