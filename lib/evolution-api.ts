export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, ""); 
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  if (!apiKey || !apiUrl || !instance) {
    console.error('❌ Configurações ausentes');
    return null;
  }

  try {
    // Para v1.8.2 no Koyeb, o endpoint de texto deve ser bem direto
    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: remoteJid,
        textMessage: {
          text: text
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro na Evolution:', errorData);
      return null;
    }

    console.log(`✅ Mensagem enviada para ${remoteJid}`);
    return await response.json();
  } catch (error: any) {
    console.error('❌ Falha no fetch da Evolution:', error.message);
    return null;
  }
}