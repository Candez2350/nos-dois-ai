export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL;
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiKey || !apiUrl || !instance) {
    console.error('❌ Configurações da Evolution API ausentes');
    return;
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
        options: {
          delay: 1200,
          presence: 'composing'
        },
        textMessage: {
          text: text
        }
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para WhatsApp:', error);
  }
}