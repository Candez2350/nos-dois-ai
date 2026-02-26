import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeExpense } from '@/lib/gemini-service';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

// Configuração para suportar o recebimento de imagens (OCR)
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

    // 1. FILTRO DE EVENTOS: Ignora históricos e foca no que é novo
    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const { data } = body;
    
    // Extração do conteúdo (Texto, Legenda ou Conversa)
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    // 2. MODO TESTADOR (ROGER): 
    // Permite que você use o número do bot para testar comandos e gastos.
    const isFromMe = data.key?.fromMe;
    if (isFromMe) {
      const isAction = messageContent.startsWith('/') || messageContent.toLowerCase().includes('gastei');
      if (!isAction) return NextResponse.json({ message: 'Auto-resposta ignorada' }, { status: 200 });
      console.log('🧪 Processando ação do próprio número (Roger)');
    }

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];

    // --- FLUXO 1: ATIVAÇÃO (/ativar) ---
    if (messageContent.toLowerCase().startsWith('/ativar')) {
      const token = messageContent.split(' ')[1]?.trim();
      
      const { data: couple, error: fetchError } = await supabase
        .from('couples')
        .select('*')
        .eq('activation_token', token)
        .single();

      if (fetchError || !couple) {
        return NextResponse.json({ message: 'Token inválido' }, { status: 200 });
      }

      // Vincula o JID do grupo ao casal
      await supabase.from('couples').update({ wa_group_id: remoteJid }).eq('id', couple.id);

      await sendWhatsAppMessage(
        `✅ *NósDois.ai Ativado!*\n\nOlá! Eu sou o Duetto. Roger e Juliana, agora estou de olho nas contas de vocês! 🤖🚀`,
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

    // Chama o motor unificado (gemini-service.ts)
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

    // Resposta de confirmação
    const msgConfirmacao = `✅ *Anotado!*\n\n💰 *R$ ${expense.valor.toFixed(2)}*\n📍 *Local:* ${expense.local}\n📁 *Categoria:* ${expense.categoria}\n👤 *Por:* @${payerNumber}`;
    
    await sendWhatsAppMessage(msgConfirmacao, remoteJid);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Erro Crítico no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro processado' }, { status: 200 });
  }
}