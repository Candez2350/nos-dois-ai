import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeExpense } from '@/lib/gemini-service';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json();

    // 1. FILTROS DE INFRAESTRUTURA
    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    // Filtro contra o erro 413: Ignora sincronização de histórico (type: append)
    if (body.data?.type === 'append') {
      return NextResponse.json({ message: 'Histórico ignorado' }, { status: 200 });
    }

    const { data } = body;
    
    // Extração do conteúdo
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];

    // 2. MODO TESTADOR (ROGER)
    const isFromMe = data.key?.fromMe;
    if (isFromMe) {
      const isAction = messageContent.startsWith('/') || messageContent.toLowerCase().includes('gastei');
      if (!isAction) return NextResponse.json({ message: 'Auto-resposta ignorada' }, { status: 200 });
      console.log('🧪 Processando ação do próprio número');
    }

    // --- FLUXO 1: ATIVAÇÃO (/ativar) ---
    if (messageContent.toLowerCase().startsWith('/ativar')) {
      const token = messageContent.split(' ')[1]?.trim();
      console.log(`🔑 Tentando ativar token: [${token}] no JID: ${remoteJid}`);

      const { data: couple, error: fetchError } = await supabase
        .from('couples')
        .select('*')
        .eq('activation_token', token)
        .single();

      if (fetchError || !couple) {
        console.error('❌ Token inválido ou erro na busca');
        return NextResponse.json({ message: 'Token inválido' }, { status: 200 });
      }

      // VINCULAÇÃO: Atualiza o wa_group_id (permite sobrescrever para troca de grupo)
      const { error: updateError } = await supabase
        .from('couples')
        .update({ wa_group_id: remoteJid })
        .eq('id', couple.id);

      if (updateError) {
        console.error('❌ Erro ao vincular wa_group_id:', updateError.message);
        return NextResponse.json({ message: 'Erro no vínculo' }, { status: 200 });
      }

      await sendWhatsAppMessage(
        `✅ *NósDois.ai Ativado!*\n\nOlá! Agora estou de olho nas contas de vocês! 🤖🚀`,
        remoteJid
      );

      return NextResponse.json({ message: 'Ativado' });
    }

    // --- FLUXO 2: PROCESSAMENTO DE GASTOS ---
    const { data: currentCouple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('wa_group_id', remoteJid)
      .single();

    if (coupleError || !currentCouple) {
      console.log('⚠️ Grupo ou conversa não autorizada:', remoteJid);
      return NextResponse.json({ message: 'Não autorizado' }, { status: 200 });
    }

    const isImage = !!data.message?.imageMessage;
    let expense;

    // Chama o motor Gemini 2.5 Flash
    if (isImage) {
      const base64 = data.message?.imageMessage?.base64 || data.base64;
      expense = await analyzeExpense({ imageBase64: base64 });
    } else {
      expense = await analyzeExpense({ text: messageContent });
    }

    // Salva no Supabase
    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: expense.valor,
      description: expense.local,
      category: expense.categoria,
      ai_metadata: { source: isImage ? 'ocr' : 'text', raw: expense }
    });

    if (txError) throw txError;

    // Resposta de confirmação formatada
    const msgConfirmacao = `✅ *Anotado!*\n\n💰 *R$ ${expense.valor.toFixed(2)}*\n📍 *Local:* ${expense.local}\n📁 *Categoria:* ${expense.categoria}\n👤 *Por:* @${payerNumber}`;
    
    await sendWhatsAppMessage(msgConfirmacao, remoteJid);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Erro Crítico no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro processado' }, { status: 200 });
  }
}