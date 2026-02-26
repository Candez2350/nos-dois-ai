import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  // Inicializa o Gemini
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    const body = await req.json();

    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ message: 'Ignorado' }, { status: 200 });
    }

    const { data } = body;
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    // 🧪 MODO TESTADOR: Permite que você (o bot) envie comandos para si mesmo
    const isFromMe = data.key?.fromMe;
    if (isFromMe) {
      const isAction = messageContent.startsWith('/') || messageContent.toLowerCase().includes('gastei');
      if (!isAction) return NextResponse.json({ message: 'Auto-resposta' }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];

    // --- FLUXO 1: ATIVAÇÃO ---
    if (messageContent.toLowerCase().startsWith('/ativar')) {
      const token = messageContent.split(' ')[1]?.trim();
      const { data: couple } = await supabase.from('couples').select('*').eq('activation_token', token).single();

      if (!couple) return NextResponse.json({ message: 'Token inválido' });

      await supabase.from('couples').update({ wa_group_id: remoteJid }).eq('id', couple.id);
      await sendWhatsAppMessage(`✅ *Ativação Confirmada!* O Duetto está pronto. 🚀`, remoteJid);
      return NextResponse.json({ message: 'Ativado' });
    }

    // --- FLUXO 2: PROCESSAMENTO ---
    const { data: currentCouple } = await supabase.from('couples').select('id').eq('wa_group_id', remoteJid).single();
    if (!currentCouple) return NextResponse.json({ message: 'Não autorizado' }, { status: 200 });

    let finalData = { valor: 0, local: '', categoria: '' };
    const isImage = !!data.message?.imageMessage;

    if (isImage) {
      const base64Data = data.message?.imageMessage?.base64 || data.base64;
      const receipt = await analyzeReceipt(base64Data);
      finalData = { valor: receipt.valor_total, local: receipt.estabelecimento, categoria: receipt.categoria };
    } else {
      // MUDANÇA PARA GEMINI-1.5-FLASH (Cota mais estável)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Extraia JSON: {valor: number, local: string, categoria: string} deste gasto: "${messageContent}". 
      Categorias: Alimentação, Lazer, Transporte, Casa, Saúde, Outros. Responda APENAS o JSON.`;
      
      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text().replace(/```json|```/g, ""));
      finalData = { valor: parsed.valor, local: parsed.local, categoria: parsed.categoria || 'Outros' };
    }

    await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: finalData.valor,
      description: finalData.local,
      category: finalData.categoria,
      ai_metadata: { raw: finalData }
    });

    await sendWhatsAppMessage(
      `✅ *Anotado!*\n💰 *R$ ${finalData.valor.toFixed(2)}* no *${finalData.local}*\n👤 Pago por @${payerNumber}`,
      remoteJid
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Erro:', error.message);
    return NextResponse.json({ error: 'Erro processado' }, { status: 200 });
  }
}