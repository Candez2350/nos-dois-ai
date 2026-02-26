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
        number: remoteJid,
        textMessage: {
          text: text
        }
      }),
    });

    // 1. Verifica se a resposta é texto ou JSON para evitar o erro "Unexpected token u"
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        console.error('❌ Erro Evolution API (JSON):', data);
        throw new Error(`Erro Evolution: ${data.response?.message || 'Erro na API'}`);
      }
      return data;
    } else {
      // Se não for JSON, logamos o texto puro do erro (ex: erro de servidor do Koyeb)
      const errorText = await response.text();
      console.error('🔥 Erro de Infraestrutura (Não-JSON):', errorText);
      throw new Error(`Servidor Evolution retornou erro de rede ou timeout.`);
    }

  } catch (error: any) {
    console.error('🔥 Falha Crítica no Envio:', error.message);
    throw error;
  }
}