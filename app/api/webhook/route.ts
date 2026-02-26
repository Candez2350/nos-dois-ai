import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { analyzeReceipt } from '@/lib/gemini-service';

export async function POST(req: NextRequest) {
  console.log('🔹 [Webhook] Recebido POST request');

  try {
    const body = await req.json();
    // Log do payload (limitado para não poluir demais se for base64 gigante)
    const logBody = { ...body };
    if (logBody.data?.base64) logBody.data.base64 = '[BASE64_TRUNCATED]';
    if (logBody.data?.message?.base64) logBody.data.message.base64 = '[BASE64_TRUNCATED]';
    console.log('🔹 [Webhook] Payload recebido:', JSON.stringify(logBody, null, 2));

    // 1. Validação básica da Evolution API
    const { event, data } = body;
    
    // Verifica se é um evento de mensagem (messages.upsert)
    if (event !== 'messages.upsert') {
      console.log('🔸 [Webhook] Evento ignorado (não é messages.upsert):', event);
      return NextResponse.json({ message: 'Evento ignorado' }, { status: 200 });
    }

    if (!data || !data.key || !data.message) {
      console.log('❌ [Webhook] Payload inválido ou incompleto');
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // Ignorar mensagens enviadas pelo próprio bot (fromMe)
    if (data.key.fromMe) {
        console.log('🔸 [Webhook] Mensagem enviada por mim. Ignorando.');
        return NextResponse.json({ message: 'Ignorado (fromMe)' }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid;
    const messageType = data.messageType;
    console.log(`🔹 [Webhook] Processando mensagem de: ${remoteJid}, Tipo: ${messageType}`);

    // 2. Identificar se contém imagem
    // A Evolution API pode classificar como 'imageMessage' ou vir dentro de message.imageMessage
    const isImage = messageType === 'imageMessage' || !!data.message.imageMessage;

    if (!isImage) {
      console.log('🔸 [Webhook] Não é uma imagem. Ignorando.');
      return NextResponse.json({ message: 'Não é imagem' }, { status: 200 });
    }

    // 3. Obter a imagem (Buffer)
    let imageBuffer: Buffer | null = null;

    // Prioridade 1: Base64 direto no payload (se configurado na Evolution)
    if (data.base64) {
       console.log('🔹 [Webhook] Base64 encontrado na raiz de data');
       imageBuffer = Buffer.from(data.base64, 'base64');
    } else if (data.message.base64) {
       console.log('🔹 [Webhook] Base64 encontrado em data.message');
       imageBuffer = Buffer.from(data.message.base64, 'base64');
    } else if (data.message.imageMessage && data.message.imageMessage.url) {
       // Prioridade 2: URL da imagem
       const imageUrl = data.message.imageMessage.url;
       console.log('🔹 [Webhook] Tentando baixar imagem da URL:', imageUrl);
       try {
         const response = await fetch(imageUrl);
         if (!response.ok) throw new Error(`Status ${response.status}`);
         const arrayBuffer = await response.arrayBuffer();
         imageBuffer = Buffer.from(arrayBuffer);
         console.log('🔹 [Webhook] Imagem baixada com sucesso');
       } catch (err) {
         console.error('❌ [Webhook] Erro ao baixar imagem da URL:', err);
       }
    }

    if (!imageBuffer) {
      console.log('❌ [Webhook] Falha: Não foi possível obter o conteúdo da imagem (sem base64 ou URL acessível)');
      return NextResponse.json({ error: 'Imagem não encontrada ou inacessível' }, { status: 400 });
    }

    // 4. Analisar com Gemini
    console.log('🔹 [Webhook] Enviando imagem para o Gemini...');
    const receiptData = await analyzeReceipt(imageBuffer);
    console.log('✅ [Webhook] Gemini retornou:', receiptData);

    // 5. Buscar Casal no Supabase
    console.log(`🔹 [Webhook] Buscando casal com wa_group_id: ${remoteJid}`);
    const supabase = getSupabaseAdmin();
    
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('wa_group_id', remoteJid)
      .single();

    if (coupleError || !couple) {
      console.error('❌ [Webhook] Casal não encontrado ou erro:', coupleError);
      // Retornamos 200 para a API não ficar tentando reenviar o webhook, já que o erro é de negócio (cadastro)
      return NextResponse.json({ error: 'Casal não cadastrado' }, { status: 200 });
    }

    console.log('🔹 [Webhook] Casal encontrado ID:', couple.id);

    // 6. Salvar Transação
    console.log('🔹 [Webhook] Salvando transação...');
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        couple_id: couple.id,
        amount: receiptData.valor_total,
        merchant: receiptData.estabelecimento,
        category: receiptData.categoria,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (txError) {
      console.error('❌ [Webhook] Erro ao salvar transação:', txError);
      return NextResponse.json({ error: 'Erro ao salvar no banco' }, { status: 500 });
    }

    console.log('✅ [Webhook] Sucesso! Transação ID:', transaction.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Cupom processado com sucesso',
      data: {
        transaction_id: transaction.id,
        extracted_data: receiptData
      }
    });

  } catch (error: any) {
    console.error('❌ [Webhook] Erro fatal no processamento:', error);
    return NextResponse.json({ error: 'Erro interno no servidor', details: error.message }, { status: 500 });
  }
}
