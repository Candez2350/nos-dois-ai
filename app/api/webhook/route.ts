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
    
    // Extração do conteúdo (Trata texto simples, mensagens estendidas e legendas de imagem)
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];
    const isImage = !!data.message?.imageMessage;

    // 2. MODO TESTADOR (ROGER)
    const isFromMe = data.key?.fromMe;
    if (isFromMe) {
      const isAction = messageContent.startsWith('/') || messageContent.toLowerCase().includes('gastei') || isImage;
      if (!isAction) return NextResponse.json({ message: 'Auto-resposta ignorada' }, { status: 200 });
      console.log('🧪 Processando ação do próprio número (Roger)');
    }

    // --- FLUXO 1: ATIVAÇÃO (/ativar TOKEN) ---
    if (messageContent.toLowerCase().startsWith('/ativar')) {
      const token = messageContent.split(' ')[1]?.trim();
      
      const { data: couple, error: fetchError } = await supabase
        .from('couples')
        .select('*')
        .eq('activation_token', token)
        .single();

      if (fetchError || !couple) {
        await sendWhatsAppMessage("❌ Token inválido. Verifique o código e tente novamente.", remoteJid);
        return NextResponse.json({ message: 'Token inválido' }, { status: 200 });
      }

      // VINCULAÇÃO: Salva o ID do grupo no banco
      const { error: updateError } = await supabase
        .from('couples')
        .update({ wa_group_id: remoteJid })
        .eq('id', couple.id);

      if (updateError) throw updateError;

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
      console.log('⚠️ Grupo não autorizado:', remoteJid);
      return NextResponse.json({ message: 'Não autorizado' }, { status: 200 });
    }

    let expense;

    // Chama o Gemini para entender o gasto
    if (isImage) {
      const base64 = data.message?.base64 || 
               data.base64 || 
               data.message?.imageMessage?.jpegThumbnail;

      console.log("📸 [DEBUG] Base64 encontrado:", base64 ? "SIM (" + base64.substring(0, 30) + "...)" : "NÃO - undefined!");
      expense = await analyzeExpense({ imageBase64: base64 });
    } else {
      expense = await analyzeExpense({ text: messageContent });
    }

    // Salva a transação no Supabase
    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: expense.valor,
      description: expense.local,
      category: expense.categoria,
      ai_metadata: { source: isImage ? 'ocr' : 'text', raw: expense }
    });

    if (txError) throw txError;

    // Resposta formatada para o casal
    const msgConfirmacao = `✅ *Anotado!*\n\n💰 *R$ ${expense.valor.toFixed(2)}*\n📍 *Local:* ${expense.local}\n📁 *Categoria:* ${expense.categoria}\n👤 *Por:* @${payerNumber}`;
    
    await sendWhatsAppMessage(msgConfirmacao, remoteJid);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Erro Crítico no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro processado internamente' }, { status: 200 });
  }
}