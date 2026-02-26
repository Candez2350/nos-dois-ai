import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeExpense } from '@/lib/gemini-service';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Mantemos alto para Next.js, mas o filtro abaixo descarta o excesso
    },
  },
};

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json();

    // 1. FILTRO DE SINCRONIZAÇÃO (O "Matador" do Erro 413)
    // Mensagens de histórico ou sync vêm com tipos diferentes de 'notify'
    if (body.event !== 'messages.upsert' || body.data?.type !== 'notify') {
      return NextResponse.json({ message: 'Sincronização ou evento ignorado' }, { status: 200 });
    }

    const { data } = body;
    
    // 2. FILTRO DE CONTEÚDO VAZIO
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    if (!messageContent && !data.message?.imageMessage) {
      return NextResponse.json({ message: 'Sem conteúdo útil' }, { status: 200 });
    }

    // 3. MODO TESTADOR: Permite comandos do próprio número do bot
    const isFromMe = data.key?.fromMe;
    if (isFromMe) {
      const isAction = messageContent.startsWith('/') || messageContent.toLowerCase().includes('gastei');
      if (!isAction) return NextResponse.json({ message: 'Auto-resposta ignorada' }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];

    // --- FLUXO 1: ATIVAÇÃO ---
    if (messageContent.toLowerCase().startsWith('/ativar')) {
      const token = messageContent.split(' ')[1]?.trim();
      const { data: couple } = await supabase.from('couples').select('*').eq('activation_token', token).single();

      if (couple) {
        await supabase.from('couples').update({ wa_group_id: remoteJid }).eq('id', couple.id);
        await sendWhatsAppMessage(`✅ *NósDois.ai Ativado!* \nProntos para organizar as finanças? 🚀`, remoteJid);
        return NextResponse.json({ message: 'Ativado' });
      }
      return NextResponse.json({ message: 'Token inválido' });
    }

    // --- FLUXO 2: GASTOS ---
    const { data: currentCouple } = await supabase.from('couples').select('id').eq('wa_group_id', remoteJid).single();
    
    if (!currentCouple) {
      console.log(`⚠️ Conversa não autorizada: ${remoteJid}`);
      return NextResponse.json({ message: 'Não autorizado' }, { status: 200 });
    }

    const isImage = !!data.message?.imageMessage;
    const expense = isImage 
      ? await analyzeExpense({ imageBase64: data.message.imageMessage.base64 || data.base64 })
      : await analyzeExpense({ text: messageContent });

    // Salvamento no Banco
    await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: expense.valor,
      description: expense.local,
      category: expense.categoria,
      ai_metadata: { source: isImage ? 'ocr' : 'text', raw: expense }
    });

    // Resposta via Evolution API v1.8.2
    await sendWhatsAppMessage(
      `✅ *Anotado!*\n💰 *R$ ${expense.valor.toFixed(2)}* no *${expense.local}* (${expense.categoria})\n👤 *Por:* @${payerNumber}`,
      remoteJid
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Erro no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro processado' }, { status: 200 });
  }
}