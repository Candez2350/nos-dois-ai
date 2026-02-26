export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, ""); 
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiKey || !apiUrl || !instance) {
    console.error('❌ [Evolution] Configurações ausentes no ambiente');
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
        number: remoteJid,
        textMessage: {
          text: text // O texto PRECISA estar aqui dentro na v1.8.2
        },
        options: {
          delay: 0,
          presence: 'composing',
          linkPreview: false
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [Evolution] Erro detalhado:', JSON.stringify(result));
      throw new Error(`Status ${response.status}`);
    }

    console.log(`✅ [Evolution] Mensagem enviada para ${remoteJid}`);
    return result;
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao enviar:', error.message);
    return null;
  }
}