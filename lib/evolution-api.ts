export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, ""); 
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  try {
    const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey || ''
      },
      body: JSON.stringify({
        number: remoteJid,
        text: text, // Na 1.8.2, 'text' na raiz costuma funcionar melhor
        options: {
          delay: 0,
          presence: 'composing',
          linkPreview: false
        }
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));

    console.log(`✅ Mensagem enviada!`);
    return result;
  } catch (error: any) {
    console.error('❌ Erro no envio:', error.message);
    return null;
  }
}