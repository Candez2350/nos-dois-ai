export async function sendWhatsAppMessage(text: string, remoteJid: string) {
  try {
    const instance = process.env.EVOLUTION_INSTANCE_NAME;
    // Certifique-se que a URL não termine com / antes de montar a rota
    const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
    const url = `${baseUrl}/message/sendText/${instance}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY || '',
      },
      body: JSON.stringify({
        number: remoteJid,
        text: text,        // ✅ NA v2.1.1 É ASSIM: Direto na raiz
        delay: 1200,       // Recomendado para parecer humano
        linkPreview: true  // Útil para links se necessário
      }),
    });

    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      
      if (!response.ok) {
        // Log detalhado para capturar exatamente o que a v2 está rejeitando
        console.error('❌ Resposta de Erro Evolution v2:', JSON.stringify(data, null, 2));
        throw new Error(`Erro Evolution: ${data.response?.message || data.message || 'Falha de validação'}`);
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