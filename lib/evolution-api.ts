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
        number: remoteJid, // O JID completo (ex: 12036... @g.us)
        text: text         // Na v1.8.2, tente enviar o texto na raiz
      }),
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        console.error('❌ Rejeitado pela Evolution:', JSON.stringify(data, null, 2));
        throw new Error(`Erro Evolution: ${data.response?.message || 'not-acceptable'}`);
      }
      return data;
    } else {
      const errorText = await response.text();
      throw new Error(`Resposta do servidor não é JSON: ${errorText.substring(0, 50)}`);
    }
  } catch (error: any) {
    console.error('🔥 Erro no envio da mensagem:', error.message);
    throw error;
  }
}