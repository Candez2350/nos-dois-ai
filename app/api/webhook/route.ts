import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeExpense } from '@/lib/gemini-service';
import { sendWhatsAppMessage } from '@/lib/evolution-api';
import { calculateSettlement } from '@/lib/finance-service';

const parseDate = (dateStr: string) => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const date = new Date(`${y}-${m}-${d}`);
  return isNaN(date.getTime()) ? null : `${y}-${m}-${d}`;
};

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json();

    // 1. FILTROS DE INFRAESTRUTURA
    if (body.event !== 'messages.upsert') return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    if (body.data?.type === 'append') return NextResponse.json({ message: 'Histórico ignorado' }, { status: 200 });

    const { data } = body;
    
    // Extração Robusta (Trata diferentes formatos da Evolution API)
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      data.message?.videoMessage?.caption ||
      ""
    ).trim();

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];
    const isImage = !!data.message?.imageMessage;
    const isFromMe = !!data.key?.fromMe;

    // 📡 LOG DE RADAR: Verificação inicial de toda mensagem
    console.log(`📩 [LOG] De: ${remoteJid} | Texto: "${messageContent}" | isFromMe: ${isFromMe}`);

    // 2. MODO TESTADOR (ROGER)
    if (isFromMe) {
      const hasNumber = /\d+/.test(messageContent);
      const stopWords = ['minuto', 'min', 'hora', ' h ', 'segundo', 'dia', 'ano', 'feira'];
      const isFalsePositive = stopWords.some(word => messageContent.toLowerCase().includes(word));

      // Se for comando (/), imagem ou tiver número (sem ser tempo), prossegue
      const isAction = (messageContent.startsWith('/') || (hasNumber && !isFalsePositive)) || isImage; 
                       
      if (!isAction) {
        console.log('🔇 [DEBUG] Roger conversando, ignorado.');
        return NextResponse.json({ message: 'Conversa comum ignorada' }, { status: 200 });
      }
      
      console.log('🧪 [DEBUG] Analisando ação real do Roger...');
    }

    // --- FLUXO 1: ATIVAÇÃO ---
    if (messageContent.toLowerCase().startsWith('/ativar')) {
      const token = messageContent.split(' ')[1]?.trim();
      const { data: couple, error: fetchError } = await supabase.from('couples').select('*').eq('activation_token', token).single();

      if (fetchError || !couple) {
        await sendWhatsAppMessage("❌ Token inválido.", remoteJid);
        return NextResponse.json({ message: 'Token inválido' });
      }

      await supabase.from('couples').update({ wa_group_id: remoteJid }).eq('id', couple.id);
      await sendWhatsAppMessage(`✅ *NósDois.ai Ativado!* 🤖🚀`, remoteJid);
      return NextResponse.json({ message: 'Ativado' });
    }

    // --- AUTORIZAÇÃO DO GRUPO ---
    const { data: currentCouple, error: coupleError } = await supabase.from('couples').select('*').eq('wa_group_id', remoteJid).single();

    if (coupleError || !currentCouple) {
      console.log('⚠️ Grupo não autorizado:', remoteJid);
      return NextResponse.json({ message: 'Não autorizado' }, { status: 200 });
    }

    // --- NOVO FLUXO: FECHAMENTO DE PERÍODO ---
    if (messageContent.toLowerCase().startsWith('/fechar')) {
      const parts = messageContent.split(' ');
      if (parts.length < 3) {
        await sendWhatsAppMessage("⚠️ *Uso:* /fechar DD/MM/AAAA DD/MM/AAAA", remoteJid);
        return NextResponse.json({ message: 'Faltam datas' });
      }

      const startISO = parseDate(parts[1]);
      const endISO = parseDate(parts[2]);

      if (!startISO || !endISO) {
        await sendWhatsAppMessage("❌ *Data inválida!*", remoteJid);
        return NextResponse.json({ message: 'Data inválida' });
      }

      const res = await calculateSettlement(currentCouple.id, startISO, endISO);

      if (!res) {
        await sendWhatsAppMessage("📭 *Nada para fechar!*", remoteJid);
        return NextResponse.json({ message: 'Sem pendências' });
      }

      const msgFechamento = `📊 *BALANÇO DO PERÍODO*\n📅 ${res.periodRef}\n\n` +
        `💰 *Total Gasto:* R$ ${res.totalGeral.toFixed(2)}\n` +
        `⚖️ *Divisão:* ${res.splitType === 'EQUAL' ? '50/50' : 'Proporcional'}\n\n` +
        `🤵 *${res.p1Name}:* R$ ${res.totalP1.toFixed(2)}\n` +
        `👩‍💼 *${res.p2Name}:* R$ ${res.totalP2.toFixed(2)}\n\n` +
        `🏁 *VEREDITO:* \n${res.amountToTransfer > 0 
          ? `*${res.payerName}* deve enviar *R$ ${res.amountToTransfer.toFixed(2)}* para *${res.receiverName}*` 
          : "Contas equilibradas! ✅"}`;

      await sendWhatsAppMessage(msgFechamento, remoteJid);
      return NextResponse.json({ success: true });
    }

    // --- FLUXO 2: PROCESSAMENTO DE GASTOS ---
    let expense;
    if (isImage) {
      const mediaResponse = await fetch(`${process.env.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/nosdois`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({ message: { key: data.key } })
      });
      const mediaData = await mediaResponse.json();
      expense = await analyzeExpense({ imageBase64: mediaData.base64 });
    } else {
      expense = await analyzeExpense({ text: messageContent });
    }

    // Salva a transação com a NOVA coluna expense_date
    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: expense.valor,
      description: expense.local,
      category: expense.categoria,
      expense_date: expense.data, // <-- IMPORTANTE: Adicionado conforme combinamos
      ai_metadata: { 
        source: isImage ? 'ocr' : 'text', 
        raw: expense, 
        date_certainty: expense.data_identificada 
      }
    });

    if (txError) throw txError;

    let msgConfirmacao = `✅ *Anotado!*\n\n` +
      `💰 *R$ ${expense.valor.toFixed(2)}*\n` +
      `📅 *Data:* ${new Date(expense.data).toLocaleDateString('pt-BR')}\n` +
      `📍 *Local:* ${expense.local}\n` +
      `👤 *Por:* @${payerNumber}`;    
    
    // Pergunta inteligente sobre a data (texto ou foto)
    if (!expense.data_identificada) {
      msgConfirmacao += `\n\n⚠️ *Aviso:* Não identifiquei a data, salvei como *hoje*. Foi isso mesmo?`;
    }
    
    await sendWhatsAppMessage(msgConfirmacao, remoteJid);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Erro Crítico no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 200 });
  }
}