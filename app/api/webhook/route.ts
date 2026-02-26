import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    // 1. LER O CORPO APENAS UMA VEZ
    const body = await req.json();
    
    // 2. LOG INTELIGENTE (Usando a variável 'body' que já foi lida)
    const bodyLog = { ...body };
    if (bodyLog.data?.base64) bodyLog.data.base64 = "[MUITO GRANDE]";
    if (bodyLog.data?.message?.imageMessage?.base64) bodyLog.data.message.imageMessage.base64 = "[MUITO GRANDE]";
    
    console.log('📦 [WEBHOOK] Payload recebido (limpo):', JSON.stringify(bodyLog));

    // 3. DESESTRUTURAR OS DADOS
    const { event, data } = body;

    // Filtro inicial
    if (event !== 'messages.upsert' || data.key?.fromMe) {
      return NextResponse.json({ message: 'Ignorado' }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];

    // Extração de texto aprimorada (captura texto simples, resposta com link e legenda de foto)
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    const isImage = !!data.message?.imageMessage || data.messageType === 'imageMessage';

    // --- FLUXO 1: HANDSHAKE (/ativar) ---
    if (messageContent.startsWith('/ativar')) {
      const token = messageContent.split(' ')[1]?.trim();
      
      console.log(`🔑 Tentando ativar grupo ${remoteJid} com token ${token}`);

      const { data: couple, error: fetchError } = await supabase
        .from('couples')
        .select('*')
        .eq('activation_token', token)
        .single();

      if (fetchError || !couple) {
        console.error('❌ Token inválido:', token);
        return NextResponse.json({ message: 'Token inválido' });
      }

      const { error: updateError } = await supabase
        .from('couples')
        .update({ wa_group_id: remoteJid })
        .eq('id', couple.id);

      if (updateError) throw updateError;

      // 📢 RESPOSTA DE SUCESSO NO WHATSAPP
      await sendWhatsAppMessage(
        `✅ *Ativação Concluída!*\n\nOlá! Eu sou o Duetto, o assistente financeiro de vocês. 🤖\n\nA partir de agora, qualquer gasto enviado aqui (foto ou texto) será anotado automaticamente. Vamos colocar essas finanças em ordem! 🚀`,
        remoteJid
      );

      return NextResponse.json({ message: 'Ativado' });
    }

    // --- FLUXO 2: PROCESSAMENTO DE GASTOS ---
    const { data: currentCouple } = await supabase
      .from('couples')
      .select('id, name')
      .eq('wa_group_id', remoteJid)
      .single();

    if (!currentCouple) {
      console.log('⚠️ Grupo não autorizado:', remoteJid);
      return NextResponse.json({ message: 'Não autorizado' });
    }

    let finalData = { valor: 0, local: '', categoria: '' };

    if (isImage) {
      // Prioriza Base64 se a Evolution enviar, senão o analyzeReceipt trata
      const base64Data = data.base64 || data.message?.imageMessage?.base64;
      const receipt = await analyzeReceipt(base64Data);
      finalData = { valor: receipt.valor_total, local: receipt.estabelecimento, categoria: receipt.categoria };
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Extraia o valor (number), local (string) e categoria (string) deste gasto. Responda apenas JSON puro.";
      const result = await model.generateContent([prompt, messageContent]);
      const parsed = JSON.parse(result.response.text().replace(/```json|```/g, ""));
      finalData = { valor: parsed.valor, local: parsed.local, categoria: parsed.categoria };
    }

    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: finalData.valor,
      description: finalData.local,
      category: finalData.categoria,
      ai_metadata: { raw: finalData }
    });

    if (txError) throw txError;

    // 📢 CONFIRMAÇÃO DE GASTO NO WHATSAPP
    const msgConfirmacao = `✅ *Gasto Anotado!*\n\n💰 *Valor:* R$ ${finalData.valor.toFixed(2)}\n📍 *Local:* ${finalData.local}\n📁 *Categoria:* ${finalData.categoria}\n👤 *Pago por:* @${payerNumber}`;
    
    await sendWhatsAppMessage(msgConfirmacao, remoteJid);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro no Webhook:', error.message);
    // Retornamos 200 para não travar a Evolution API, mas logamos o erro
    return NextResponse.json({ error: 'Erro processado', detalhe: error.message }, { status: 200 });
  }
}