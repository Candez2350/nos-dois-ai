import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

// Configuração para Next.js aceitar payloads maiores
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  const systemInstruction = `
    Você é o Duetto, um assistente financeiro inteligente para casais.
    Ao receber um gasto em texto, sua tarefa é extrair: valor (number), local (string) e categoria (string).
    REGRAS:
    - Retorne APENAS o JSON puro, sem markdown, sem explicações.
    - CATEGORIAS: Alimentação, Lazer, Transporte, Casa, Saúde, Outros.
    - Se o valor não for detectado, retorne 0.
    - Exemplo: { "valor": 45.90, "local": "Padaria", "categoria": "Alimentação" }
  `;

  try {
    const body = await req.json();

    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const { data } = body;

    // 1. EXTRAÇÃO PRÉVIA DO CONTEÚDO PARA VALIDAÇÃO
    const messageContent = (
      data.message?.conversation || 
      data.message?.extendedTextMessage?.text || 
      data.message?.imageMessage?.caption || 
      ""
    ).trim();

    const isFromMe = data.key?.fromMe;

    // 2. AJUSTE PARA MODO TESTADOR (ROGER)
    // Se a mensagem for do bot (fromMe), só continuamos se for um comando ou gasto manual.
    // Isso evita que o bot processe as próprias mensagens de confirmação.
    if (isFromMe) {
      const isTestCommand = messageContent.startsWith('/') || messageContent.toLowerCase().includes('gastei');
      if (!isTestCommand) {
        return NextResponse.json({ message: 'Ignorado (Auto-resposta do bot)' }, { status: 200 });
      }
      console.log('🧪 Modo Testador: Processando mensagem do próprio número.');
    }

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0];

    console.log(`📩 Mensagem de ${payerNumber} em ${remoteJid}`);

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
        console.error('❌ Token inválido ou não encontrado');
        return NextResponse.json({ message: 'Token inválido' });
      }

      const { error: updateError } = await supabase
        .from('couples')
        .update({ wa_group_id: remoteJid })
        .eq('id', couple.id);

      if (updateError) throw updateError;

      await sendWhatsAppMessage(
        `✅ *Ativação Concluída!*\n\nOlá! Eu sou o Duetto, o assistente financeiro de vocês. 🤖\n\nA partir de agora, qualquer gasto enviado aqui (foto ou texto) será anotado. Vamos organizar essas finanças! 🚀`,
        remoteJid
      );

      return NextResponse.json({ message: 'Ativado' });
    }

    // --- FLUXO 2: PROCESSAMENTO DE GASTOS ---
    const { data: currentCouple, error: coupleError } = await supabase
      .from('couples')
      .select('id, name')
      .eq('wa_group_id', remoteJid)
      .single();

    if (coupleError || !currentCouple) {
      console.log('⚠️ Grupo não autorizado:', remoteJid);
      return NextResponse.json({ message: 'Não autorizado' }, { status: 200 });
    }

    let finalData = { valor: 0, local: '', categoria: '' };

    if (isImage) {
      const base64Data = data.message?.imageMessage?.base64 || data.base64;
      const receipt = await analyzeReceipt(base64Data);
      finalData = { 
        valor: receipt.valor_total, 
        local: receipt.estabelecimento, 
        categoria: receipt.categoria 
      };
    } else if (messageContent) {
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
        categoria: parsed.categoria || 'Outros'
      };
    } else {
      return NextResponse.json({ message: 'Mensagem vazia' });
    }

    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: finalData.valor,
      description: finalData.local,
      category: finalData.categoria,
      ai_metadata: { source: isImage ? 'ocr' : 'text', raw: finalData }
    });

    if (txError) throw txError;

    const msgConfirmacao = `✅ *Anotado, capitão!*\n\n💰 *R$ ${finalData.valor.toFixed(2)}*\n📍 *Local:* ${finalData.local}\n📁 *Categoria:* ${finalData.categoria}\n👤 *Pago por:* @${payerNumber}`;
    
    await sendWhatsAppMessage(msgConfirmacao, remoteJid);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('🔥 Erro Crítico no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro processado' }, { status: 200 });
  }
}