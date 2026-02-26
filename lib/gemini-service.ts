import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAIClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Chave Gemini não configurada.");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface ExpenseData {
  valor: number;
  local: string;
  categoria: string;
}

export async function analyzeExpense(input: { text?: string; imageBase64?: string }): Promise<ExpenseData> {
  try {
    const client = getGenAIClient();
    
    // Alterado para 2.5-flash que está com cota disponível no seu painel
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash", 
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const systemInstruction = `
      Você é o Duetto, um assistente de organização financeira para casais. 
      Sua função é extrair dados de despesas a partir de mensagens de texto ou imagens de recibos/notas fiscais.

      --- REGRAS PARA IMAGENS (OCR) ---
      1. Identifique o valor REAL pago. Em notas fiscais brasileiras, foque em "Valor a Pagar", "Total Pago" ou "Valor Recebido". 
      2. Ignore subtotais ou valores de descontos. No exemplo da Miudezas, o valor correto é o final (R$ 20,48).
      3. Identifique o nome do estabelecimento no topo da nota para o campo "local".

      --- REGRAS PARA TEXTO ---
      1. Identifique gastos em mensagens como "Gastei 50 no mercado".
      2. Converta valores por extenso para numerais (ex: "vinte reais" vira 20).

      --- PADRONIZAÇÃO ---
      - Se o valor não for identificado, retorne 0.
      - Se o local não for identificado, use "Gasto Geral".
      - Categorias: "Alimentação", "Lazer", "Transporte", "Casa", "Saúde", "Outros".

      SAÍDA (JSON PURO):
      {
        "valor": number,
        "local": string,
        "categoria": string
      }
    `;

    let result;
    if (input.imageBase64) {
      const cleanBase64 = input.imageBase64.includes(',') 
        ? input.imageBase64.split(',')[1] 
        : input.imageBase64;

      // LOG DE SEGURANÇA: Verifica se o Base64 começa corretamente
      console.log("📸 [DEBUG] Início do Base64:", cleanBase64.substring(0, 30) + "...");

      result = await model.generateContent([
        { 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: cleanBase64
          } 
        },
        { text: "Analise esta imagem e extraia os dados financeiros conforme as instruções: " + systemInstruction }
      ]);
    } else {
      result = await model.generateContent(`${systemInstruction}\n\nTexto: "${input.text}"`);
    }

    const responseText = result.response.text();
    console.log("🤖 [DEBUG] Resposta da IA:", responseText); // Log vital para depuração
    
    const parsed = JSON.parse(responseText);

    // Tratamento robusto para converter R$ 20,48 ou "20.48" em número real
    let valorNumerico = 0;
    if (typeof parsed.valor === 'string') {
      valorNumerico = parseFloat(
        parsed.valor
          .replace('R$', '')
          .replace(/\./g, '')
          .replace(',', '.')
          .trim()
      );
    } else {
      valorNumerico = parsed.valor || 0;
    }

    return {
      valor: isNaN(valorNumerico) ? 0 : valorNumerico,
      local: parsed.local || "Gasto Geral",
      categoria: parsed.categoria || "Outros"
    };

  } catch (error: any) {
    console.error("🔥 Erro no Gemini Service:", error.message);
    throw error;
  }
}