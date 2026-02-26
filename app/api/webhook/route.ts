import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';

// Handler para testes no navegador (Evita a tela branca)
export async function GET() {
  return NextResponse.json({ 
    status: 'online', 
    service: 'NósDois.ai Webhook',
    timestamp: new Date().toISOString() 
  });
}

export async function POST(req: NextRequest) {
  console.log('🔹 [Webhook] Recebido POST request');

  try {
    const body = await req.json();
    
    // 1. Validação do Evento
    const { event, data } = body;
    if (event !== 'messages.upsert') {
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    // Ignorar se for mensagem enviada pelo próprio bot
    if (data.key?.fromMe) return NextResponse.json({ message: 'Ignorado (fromMe)' }, { status: 200 });

    const remoteJid = data.key.remoteJid; // ID do Grupo ou Chat
    const senderJid = data.key.participant || data.key.remoteJid; // Quem enviou (Juliana ou Roger)
    
    // 2. Verificar se é Imagem
    const isImage = !!data.message?.imageMessage || data.messageType === 'imageMessage';
    if (!isImage) {
      return NextResponse.json({ message: 'Não é uma imagem' }, { status: 200 });
    }

    console.log(`📸 [Webhook] Processando imagem de: ${senderJid} no grupo: ${remoteJid}`);

    // 3. Extrair a Imagem (Priorizando Base64 da Evolution API)
    let imageBuffer: Buffer | null = null;
    const base64Data = data.base64 || data.message?.imageMessage?.base64 || data.message?.base64;

    if (base64Data) {
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (data.message?.imageMessage?.url) {
      // Caso não tenha base64, tenta baixar pela URL
      const response = await fetch(data.message.imageMessage.url);
      if (response.ok) {
        imageBuffer = Buffer.from(await response.arrayBuffer());
      }
    }

    if (!imageBuffer) {
      console.error('❌ [Webhook] Não foi possível obter o Buffer da imagem');
      return NextResponse.json({ error: 'Imagem inacessível' }, { status: 400 });
    }

    // 4. Inteligência Artificial (Gemini)
    console.log('🤖 [Webhook] Consultando Gemini Vision...');
    const receiptData = await analyzeReceipt(imageBuffer);
    
    // 5. Banco de Dados (Supabase)
    const supabase = getSupabaseAdmin();
    
    // Busca o casal pelo ID do grupo do WhatsApp
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('wa_group_id', remoteJid)
      .single();

    if (coupleError || !couple) {
      console.error('❌ [Webhook] Grupo não vinculado a um casal:', remoteJid);
      return NextResponse.json({ error: 'Grupo não cadastrado' }, { status: 200 });
    }

    // 6. Salvar a Transação
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        couple_id: couple.id,
        amount: receiptData.valor_total,
        merchant: receiptData.estabelecimento,
        category: receiptData.categoria,
        paid_by: senderJid, // Aqui salvamos quem pagou!
        description: 'Processado via WhatsApp'
      })
      .select()
      .single();

    if (txError) throw txError;

    console.log(`✅ [Webhook] Gasto de R$ ${receiptData.valor_total} salvo com sucesso!`);

    return NextResponse.json({ 
      success: true, 
      transaction_id: transaction.id 
    });

  } catch (error: any) {
    console.error('❌ [Webhook] Erro fatal:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}