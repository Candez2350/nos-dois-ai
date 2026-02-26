export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  try {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${instance}`;

    // Limpeza: Garante que o JID não tenha espaços extras
    const targetJid = remoteJid.trim();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY || '',
      },
      body: JSON.stringify({
        number: targetJid,
        textMessage: {
          text: text
        }
      }),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        console.error('❌ Erro Evolution API:', data);
        throw new Error(`Erro Evolution: ${data.response?.message || 'Erro 400'}`);
      }
      return data;
    } else {
      const errorText = await response.text();
      throw new Error(`Erro de rede: ${errorText.substring(0, 50)}`);
    }
  } catch (error: any) {
    console.error('🔥 Falha ao enviar mensagem:', error.message);
    throw error;
  }
}