import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  // 1. PERSONALIDADE E REGRAS DO DUETTO (System Instructions)
  const systemInstruction = `
    Você é o Duetto, um assistente financeiro inteligente para casais.
    Ao receber um gasto em texto, sua tarefa é extrair: valor, local e categoria.
    REGRA: Retorne APENAS o JSON puro, sem explicações ou markdown.
    CATEGORIAS PERMITIDAS: Alimentação, Lazer, Transporte, Casa, Saúde, Outros.
    EXEMPLO: { "valor": 50.00, "local": "Mercado", "categoria": "Alimentação" }
  `;

  try {
    // 2. LER O CORPO DA REQUISIÇÃO (Apenas uma vez)
    const body = await req.json();
    
    // Log limpo para debug no painel da Vercel
    const bodyLog = { ...body };
    if (bodyLog.data?.base64) bodyLog.data.base64 = "[MUITO GRANDE]";
    if (bodyLog.data?.message?.imageMessage?.base64) bodyLog.data.message.imageMessage.base64 = "[MUITO GRANDE]";
    console.log('📦 [WEBHOOK] Recebido:', JSON.stringify(bodyLog));

    const { event, data } = body;

    // Filtro de evento e remetente
    if (event !== 'messages.upsert' || data.key?.fromMe) {
      return NextResponse.json({ message: 'Ignorado' }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];

    // Extração de conteúdo
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    const isImage = !!data.message?.imageMessage || data.messageType === 'imageMessage';

    // --- FLUXO 1: HANDSHAKE (/ativar) ---
    if (messageContent.toLowerCase().startsWith('/ativar')) {
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

      await sendWhatsAppMessage(
        `✅ *Ativação Concluída!*\n\nOlá! Eu sou o Duetto, o assistente financeiro de vocês. 🤖\n\nA partir de agora, qualquer gasto enviado aqui será anotado automaticamente. Vamos organizar essas contas! 🚀`,
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
      // 📸 Processamento de Imagem
      const base64Data = data.base64 || data.message?.imageMessage?.base64;
      const receipt = await analyzeReceipt(base64Data);
      finalData = { 
        valor: receipt.valor_total, 
        local: receipt.estabelecimento, 
        categoria: receipt.categoria 
      };
    } else {
      // ✍️ Processamento de Texto (Gemini 2.0 Flash)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        systemInstruction: systemInstruction 
      });

      const result = await model.generateContent(messageContent);
      const responseText = result.response.text().replace(/```json|```/g, "").trim();
      
      const parsed = JSON.parse(responseText);
      finalData = { 
        valor: parsed.valor, 
        local: parsed.local, 
        categoria: parsed.categoria 
      };
    }

    // Gravação no Banco de Dados
    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: finalData.valor,
      description: finalData.local,
      category: finalData.categoria,
      ai_metadata: { raw: finalData, model: isImage ? 'gemini-1.5-flash' : 'gemini-2.0-flash' }
    });

    if (txError) throw txError;

    // 📢 CONFIRMAÇÃO NO WHATSAPP
    const msgConfirmacao = `✅ *Anotado!*\n\n💰 *R$ ${finalData.valor.toFixed(2)}* no *${finalData.local}* (${finalData.categoria}).\n👤 Pago por @${payerNumber}`;
    
    await sendWhatsAppMessage(msgConfirmacao, remoteJid);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro interno', detalhe: error.message }, { status: 200 });
  }
}