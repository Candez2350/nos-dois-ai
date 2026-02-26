export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  try {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${instance}`;

    // Garantimos que o número seja enviado sem espaços e exatamente como recebido
    const targetNumber = remoteJid.trim();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY || '',
      },
      body: JSON.stringify({
        number: targetNumber,
        textMessage: {
          text: text
        }
        // Removido completamente o objeto 'options'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Detalhes do erro Evolution:', JSON.stringify(data, null, 2));
      throw new Error(`Erro Evolution: ${data.response?.message || 'Rejeitado'}`);
    }

    return data;
  } catch (error: any) {
    console.error('🔥 Erro na função sendWhatsAppMessage:', error.message);
    throw error;
  }
}