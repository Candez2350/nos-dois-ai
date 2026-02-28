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

    // Upsert user: tenta com role (após migração); se falhar (coluna inexistente), tenta sem role
    const userPayload = {
      couple_id: couple.id,
      name: displayName,
      whatsapp_number: waNum,
    } as Record<string, unknown>;
    const { data: userFromUpsert, error: userError } = await supabase
      .from('users')
      .upsert({ ...userPayload, role }, { onConflict: 'whatsapp_number' })
      .select('id')
      .single();

    let userId: string | null = userFromUpsert?.id ?? null;
    if (userError) {
      const isColumnError =
        String(userError.message || '').includes('role') ||
        String(userError.code || '').includes('column');
      if (isColumnError) {
        const { data: userFallback, error: err2 } = await supabase
          .from('users')
          .upsert(userPayload, { onConflict: 'whatsapp_number' })
          .select('id')
          .single();
        if (err2) {
          console.error('Erro ao criar user (sem role):', err2);
          return NextResponse.json(
            { error: 'Erro ao registrar usuário. Execute a migração do banco (app_first_schema.sql).' },
            { status: 500 }
          );
        }
        userId = userFallback?.id ?? null;
      } else {
        console.error('Erro ao criar/atualizar user:', userError);
        return NextResponse.json(
          { error: userError.message || 'Erro ao registrar usuário.' },
          { status: 500 }
        );
      }
    } else {
      userId = userFromUpsert?.id ?? null;
    }

    if (!userId) {
      const { data: byWa } = await supabase
        .from('users')
        .select('id')
        .eq('whatsapp_number', waNum)
        .single();
      userId = byWa?.id ?? null;
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'Não foi possível obter o usuário. Tente novamente.' },
        { status: 500 }
      );
    }

    const coupleUpdate: Record<string, unknown> = {
      [partner === 1 ? 'p1_wa_number' : 'p2_wa_number']: waNum,
    };
    const partnerIdKey = partner === 1 ? 'partner_1_id' : 'partner_2_id';
    coupleUpdate[partnerIdKey] = userId;

    const { error: coupleUpdateError } = await supabase
      .from('couples')
      .update(coupleUpdate)
      .eq('id', couple.id);

    if (coupleUpdateError) {
      const { error: coupleFallback } = await supabase
        .from('couples')
        .update({ [partner === 1 ? 'p1_wa_number' : 'p2_wa_number']: waNum })
        .eq('id', couple.id);
      if (coupleFallback) {
        console.error('Erro ao atualizar casal:', coupleUpdateError, coupleFallback);
        return NextResponse.json(
          { error: 'Erro ao atualizar casal. Execute a migração do banco (app_first_schema.sql).' },
          { status: 500 }
        );
      }
    }

    await createSession({
      coupleId: couple.id,
      partner: partner as 1 | 2,
      partnerName: displayName,
      userId,
      activationToken: token,
    });

    return NextResponse.json({
      success: true,
      coupleId: couple.id,
      partner,
    });
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro ao fazer login.' },
      { status: 500 }
    );
  }
}
