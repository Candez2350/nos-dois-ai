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

/**
 * Motor Unificado: Extração de dados financeiros de forma genérica.
 */
export async function analyzeExpense(input: { text?: string; imageBase64?: string }): Promise<ExpenseData> {
  try {
    const client = getGenAIClient();
    
    // Configuração para o modelo 2.5 Flash com saída JSON obrigatória
    const model = client.getGenerativeModel({
      model: "gemini-2.0-flash-lite", // Use este ID para alinhar com o que aparece no seu painel
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const systemInstruction = `
      Você é um assistente de organização financeira. 
      Sua única função é extrair dados de despesas a partir de mensagens de texto ou imagens de recibos.
      
      FORMATO DE SAÍDA (JSON):
      {
        "valor": number,
        "local": string,
        "categoria": "Alimentação" | "Lazer" | "Transporte" | "Casa" | "Saúde" | "Outros"
      }

      REGRAS:
      - Se o valor não for identificado, retorne 0.
      - Se o local não for identificado, use "Gasto Geral".
      - Se o texto contiver o valor por extenso, converta para numeral.
      - Retorne apenas o JSON puro.
    `;

    let result;
    if (input.imageBase64) {
      const cleanBase64 = input.imageBase64.includes(',') 
        ? input.imageBase64.split(',')[1] 
        : input.imageBase64;
      result = await model.generateContent([
        {text: systemInstruction},
        { 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: cleanBase64
          } 
        },
        { text: systemInstruction }
      ]);
    } else {
      result = await model.generateContent(`${systemInstruction}\n\nTexto: "${input.text}"`);
    }

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    // Tratamento de conversão para garantir que o valor seja numérico
    let valorNumerico = 0;
    if (typeof parsed.valor === 'string') {
      valorNumerico = parseFloat(parsed.valor.replace(/[^\d,.]/g, '').replace(',', '.'));
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