import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Handler para testes (Evita a tela branca no navegador)
export async function GET() {
  return NextResponse.json({ status: 'NósDois.ai Webhook Ativo 🚀' });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    const body = await req.json();
    const { event, data } = body;

    // 1. Filtro: Só mensagens de entrada e ignora as do próprio bot
    if (event !== 'messages.upsert' || data.key?.fromMe) {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid; 
    const participantJid = data.key.participant || remoteJid;
    const payerNumber = participantJid.split('@')[0]; // Pega só o número
    
    const messageContent = data.message?.conversation || data.message?.extendedTextMessage?.text || "";
    const isImage = !!data.message?.imageMessage || data.messageType === 'imageMessage';

    console.log(`📩 Mensagem de ${payerNumber} no grupo ${remoteJid}`);

    // --- FLUXO 1: HANDSHAKE (/ativar) ---
    if (messageContent.startsWith('/ativar')) {
      const token = messageContent.split(' ')[1];
      if (!token) return NextResponse.json({ message: 'Token ausente' });

      const { data: couple, error: searchError } = await supabase
        .from('couples')
        .update({ wa_group_id: remoteJid })
        .eq('activation_token', token)
        .select()
        .single();

      if (searchError || !couple) return NextResponse.json({ message: 'Token inválido' });

      console.log(`✅ Handshake: Grupo ${remoteJid} ativado.`);
      return NextResponse.json({ message: 'Ativado com sucesso' });
    }

    // --- FLUXO 2: PROCESSAMENTO DE GASTOS ---
    
    // Verifica autorização do grupo
    const { data: currentCouple } = await supabase
      .from('couples')
      .select('id')
      .eq('wa_group_id', remoteJid)
      .single();

    if (!currentCouple) {
      return NextResponse.json({ message: 'Grupo não autorizado' });
    }

    let amount = 0, description = '', category = '';

    if (isImage) {
      // 📸 Processamento de Foto (Gemini Vision via Helper)
      const base64Data = data.base64 || data.message?.imageMessage?.base64;
      if (!base64Data) throw new Error('Mídia não encontrada no payload');
      
      // No fluxo de imagem do Webhook:
      const receipt = await analyzeReceipt(base64Data);

      const { error: txError } = await supabase.from('transactions').insert({
        couple_id: currentCouple.id,
        payer_wa_number: payerNumber,
        amount: receipt.valor_total, // Nome que vem do seu gemini-service
        description: receipt.estabelecimento,
        category: receipt.categoria,
        ai_metadata: { source: 'gemini-1.5-flash', raw: receipt }
      });
    } else {
      // ✍️ Processamento de Texto (Gemini Pro integrado aqui)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Extraia o valor (number), local (string) e categoria (string) deste gasto. Responda estritamente em JSON puro: { \"valor\": 0.0, \"local\": \"\", \"categoria\": \"\" }";
      
      const result = await model.generateContent([prompt, messageContent]);
      const responseText = result.response.text().replace(/```json|```/g, "").trim();
      
      const parsed = JSON.parse(responseText);
      amount = parsed.valor;
      description = parsed.local;
      category = parsed.categoria;
    }

    // SALVAR NA TABELA TRANSACTIONS (Conforme seu SQL)
    const { error: txError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      payer_wa_number: payerNumber,
      amount: amount,
      description: description,
      category: category,
      ai_metadata: { raw_response: isImage ? 'Gemini Vision Analysis' : 'Gemini Text Analysis' }
    });

    if (txError) throw txError;
    console.log(`💰 Gasto de R$ ${amount} registrado para o número ${payerNumber}`);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erro no Webhook:', error.message);
    // Retornamos 200 para evitar que a Evolution API fique tentando reenviar o erro infinitamente
    return NextResponse.json({ error: 'Erro processado' }, { status: 200 });
  }
}