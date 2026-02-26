export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  try {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${instance}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY || '',
      },
      body: JSON.stringify({
        number: remoteJid, // A Evolution espera o JID completo aqui
        text: text,
        options: {
          delay: 1200,
          presence: "composing"
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro Evolution API:', data);
      throw new Error(`Erro Evolution: ${data.response?.message || response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('🔥 Falha ao enviar mensagem:', error);
    throw error;
  }
}