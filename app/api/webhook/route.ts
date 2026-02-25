import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // O correto é supabase-js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuração do Supabase e Gemini
const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase URL ou Key não encontradas nas variáveis de ambiente.');
  }
  return createClient(url, key);
};

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

    const payload = await req.json();


    // 1. Filtro Inicial: Só queremos mensagens novas
    if (payload.event !== 'messages.upsert') {
      return NextResponse.json({ message: 'Evento ignorado' });
    }

    const messageData = payload.data;
    const remoteJid = messageData.key.remoteJid; // ID do Grupo ou Chat
    const messageContent = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || "";
    const isImage = !!messageData.message?.imageMessage;
    const senderNumber = messageData.key.participant || remoteJid;

    console.log(`📩 Mensagem recebida de ${remoteJid}: ${messageContent}`);

    // --- FLUXO 1: MAPEAMENTO POR HANDSHAKE (/ativar) ---
    if (messageContent.startsWith('/ativar')) {
      const token = messageContent.split(' ')[1];

      if (!token) {
        return NextResponse.json({ message: 'Token não fornecido' });
      }

      // Busca o casal que possui esse token de ativação
      const { data: couple, error: searchError } = await supabase
        .from('couples')
        .select('id')
        .eq('activation_token', token)
        .single();

      if (searchError || !couple) {
        return NextResponse.json({ message: 'Token inválido' });
      }

      // Vincula o ID do grupo (remoteJid) ao casal
      await supabase
        .from('couples')
        .update({ wa_group_id: remoteJid })
        .eq('id', couple.id);

      console.log(`✅ Grupo ${remoteJid} ativado para o casal ${couple.id}`);
      // Aqui você poderia chamar a API da Evolution para mandar uma mensagem de sucesso no WhatsApp
      return NextResponse.json({ message: 'Handshake realizado com sucesso' });
    }

    // --- FLUXO 2: PROCESSAMENTO DE GASTOS ---
    
    // Verifica se esse grupo já está cadastrado no nosso banco
    const { data: currentCouple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('wa_group_id', remoteJid)
      .single();

    if (coupleError || !currentCouple) {
      console.log("⚠️ Mensagem de grupo não autorizado ou não mapeado.");
      return NextResponse.json({ message: 'Grupo não autorizado' });
    }

    // Se chegou aqui, o grupo é válido! Vamos chamar o Gemini.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    let prompt = "Extraia o valor (number), local (string) e categoria (string) deste gasto. Responda apenas em JSON.";
    let result;

    if (isImage) {
      // Lógica simplificada: Para imagens, você precisará baixar o buffer da Evolution API
      // Por enquanto, vamos logar que é uma imagem para você implementar o download
      console.log("📸 Imagem detectada. Pendente implementação de download de mídia.");
      return NextResponse.json({ message: 'Processamento de imagem em desenvolvimento' });
    } else {
      // Processamento de Texto
      result = await model.generateContent([prompt, messageContent]);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text().replace(/```json|```/g, ""));

      // Salva no Supabase
      const { error: dbError } = await supabase.from('transactions').insert({
        couple_id: currentCouple.id,
        amount: jsonResponse.valor,
        description: jsonResponse.local,
        category: jsonResponse.categoria,
        sender_number: senderNumber
      });

      if (dbError) throw dbError;
      console.log("💰 Gasto registrado no Supabase!");
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('❌ Erro no Webhook:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}