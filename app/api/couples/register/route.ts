import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  
  try {
    const { name, owner_phone } = await req.json();

    // Gera um token amigável (ex: ND-A1B2)
    const token = `ND-${randomBytes(2).toString('hex').toUpperCase()}`;

    const { data, error } = await supabase
      .from('couples')
      .insert({
        name: name || 'Novo Casal',
        owner_phone: owner_phone,
        activation_token: token
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      token, 
      message: 'Casal pré-cadastrado. Agora ative no WhatsApp.' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}