export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  try {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const apiKey = process.env.EVOLUTION_API_KEY;
    const baseURL = process.env.EVOLUTION_API_URL;

    if (!instance || !apiKey || !baseURL) {
      throw new Error("Variáveis da Evolution API não configuradas na Vercel.");
    }

    // A rota correta para envio de texto na v1.8.2
    const url = `${baseURL}/message/sendText/${instance}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        number: remoteJid, // Mantemos o JID completo (ex: 12036... @g.us)
        textMessage: {
          text: text
        },
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: false
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resposta negativa da Evolution:', data);
      throw new Error(`Erro Evolution: ${data.response?.message || 'Falha no envio'}`);
    }

    return data;
  } catch (error: any) {
    console.error('🔥 Erro na função sendWhatsAppMessage:', error.message);
    throw error;
  }
}