export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, ""); 
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiKey || !apiUrl || !instance) {
    console.error('❌ [Evolution] Configurações ausentes');
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: remoteJid, // O JID do grupo (120363425019427166@g.us)
        text: text,        // Algumas versões da 1.8 preferem 'text' direto ou dentro de 'textMessage'
        textMessage: {
          text: text
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [Evolution] Erro na resposta:', result);
      throw new Error(result.message || 'Erro desconhecido');
    }

    console.log(`✅ [Evolution] Mensagem enviada para ${remoteJid}`);
    return result;
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao enviar:', error.message);
    return null;
  }
}