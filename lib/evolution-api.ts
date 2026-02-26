export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  // 1. Limpeza das URLs (Evita erro de // na rota)
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, ""); // Remove barra no final se houver
  const instance = process.env.EVOLUTION_INSTANCE_NAME;

  // 2. Log detalhado para sabermos exatamente o que está faltando
  if (!apiKey || !apiUrl || !instance) {
    console.error('❌ [Evolution] Configurações ausentes:', {
      hasKey: !!apiKey,
      hasUrl: !!apiUrl,
      hasInstance: !!instance
    });
    return null;
  }

  try {
    const url = `${apiUrl}/message/sendText/${instance}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        number: remoteJid,
        options: {
          delay: 500, // Diminuí um pouco para ser mais rápido
          presence: 'composing'
        },
        textMessage: {
          text: text
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ [Evolution] Mensagem enviada para ${remoteJid}`);
    return result;
  } catch (error: any) {
    console.error('❌ [Evolution] Erro ao enviar:', error.message);
    return null;
  }
}