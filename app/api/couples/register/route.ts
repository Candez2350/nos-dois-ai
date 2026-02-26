import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  
  try {
    const { name, owner_phone } = await req.json();

    if (!owner_phone) {
      return NextResponse.json({ error: 'WhatsApp do dono é obrigatório' }, { status: 400 });
    }

    // Gera um token de 6 caracteres (ex: ND-A1B2)
    // Mais fácil para o usuário digitar no celular
    const token = `ND-${randomBytes(2).toString('hex').toUpperCase()}`;

    const { data, error } = await supabase
      .from('couples')
      .insert({
        name: name || 'Novo Casal',
        owner_phone: owner_phone,
        activation_token: token,
        // wa_group_id fica nulo aqui, será preenchido pelo /ativar no WhatsApp
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      token: token,
      message: 'Registro criado! Use o token no WhatsApp.' 
    });

  } catch (error: any) {
    console.error('❌ Erro no Registro:', error.message);
    return NextResponse.json({ error: 'Falha ao criar conta' }, { status: 500 });
  }
}