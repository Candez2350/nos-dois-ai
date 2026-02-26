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
        number: remoteJid, // O JID completo do grupo ou contato
        textMessage: {
          text: text    // Estrutura obrigatória exigida pela v1.8.2
        }
      }),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        console.error('❌ Resposta da API:', JSON.stringify(data, null, 2));
        throw new Error(`Erro Evolution: ${data.response?.message || 'Falha de validação'}`);
      }
      return data;
    } else {
      const errorText = await response.text();
      throw new Error(`Servidor não retornou JSON: ${errorText.substring(0, 50)}`);
    }
  } catch (error: any) {
    console.error('🔥 Erro na função sendWhatsAppMessage:', error.message);
    throw error;
  }
}