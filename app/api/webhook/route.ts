import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Handler para testes (Evita tela branca)
export async function GET() {
  return NextResponse.json({ status: 'NósDois.ai Online 🚀' });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    const body = await req.json();
    const { event, data } = body;

    // 1. Filtro: Só queremos mensagens novas
    if (event !== 'messages.upsert' || data.key?.fromMe) {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid; // ID do Grupo
    const senderJid = data.key.participant || remoteJid; // Quem enviou
    const messageContent = data.message?.conversation || data.message?.extendedTextMessage?.text || "";
    const isImage = !!data.message?.imageMessage || data.messageType === 'imageMessage';

    console.log(`📩 Mensagem de ${senderJid} no grupo ${remoteJid}`);

    // --- FLUXO 1: HANDSHAKE (/ativar) ---
    if (messageContent.startsWith('/ativar')) {
      const token = messageContent.split(' ')[1];
      if (!token) return NextResponse.json({ message: 'Token ausente' });

      const { data: couple, error: searchError } = await supabase
        .from('couples')
        .select('id')
        .eq('activation_token', token)
        .single();

      if (searchError || !couple) return NextResponse.json({ message: 'Token inválido' });

      await supabase
        .from('couples')
        .update({ wa_group_id: remoteJid })
        .eq('id', couple.id);

      console.log(`✅ Grupo ${remoteJid} vinculado ao casal ${couple.id}`);
      return NextResponse.json({ message: 'Handshake realizado' });
    }

    // --- FLUXO 2: PROCESSAMENTO DE GASTOS ---
    
    // Verifica se o grupo já está ativado
    const { data: currentCouple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('wa_group_id', remoteJid)
      .single();

    if (coupleError || !currentCouple) {
      return NextResponse.json({ message: 'Grupo não ativado. Use /ativar [token]' });
    }

    let finalData = { valor: 0, local: 'Desconhecido', categoria: 'Outros' };

    if (isImage) {
      // 📸 Processamento de Foto (Gemini Vision)
      const base64Data = data.base64 || data.message?.imageMessage?.base64;
      if (!base64Data) throw new Error('Buffer da imagem não encontrado');
      
      const receipt = await analyzeReceipt(base64Data);
      finalData = { valor: receipt.valor_total, local: receipt.estabelecimento, categoria: receipt.categoria };
    } else {
      // ✍️ Processamento de Texto (Gemini Pro)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = "Extraia o valor (number), local (string) e categoria (string) deste gasto. Responda estritamente em JSON puro.";
      const result = await model.generateContent([prompt, messageContent]);
      const responseText = result.response.text().replace(/```json|```/g, "").trim();
      
      const parsed = JSON.parse(responseText);
      finalData = { valor: parsed.valor, local: parsed.local, categoria: parsed.categoria };
    }

    // Salva a transação no Supabase
    const { error: dbError } = await supabase.from('transactions').insert({
      couple_id: currentCouple.id,
      amount: finalData.valor,
      description: finalData.local,
      category: finalData.categoria,
      paid_by: senderJid // Fundamental para o acerto de contas!
    });

    if (dbError) throw dbError;
    console.log(`💰 Gasto de R$ ${finalData.valor} registrado!`);

    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    console.error('❌ Erro no Webhook:', error.message);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}