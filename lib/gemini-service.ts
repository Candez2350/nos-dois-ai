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
      model: "gemini-2.5-flash", // Use este ID para alinhar com o que aparece no seu painel
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const systemInstruction = `
      Você é o Duetto, um assistente de organização financeira para casais. 
      Sua função é extrair dados de despesas a partir de mensagens de texto ou imagens de recibos/notas fiscais.

      --- REGRAS PARA IMAGENS (OCR) ---
      1. Identifique o valor REAL pago. Em notas fiscais brasileiras, foque em "Valor a Pagar", "Total Pago" ou "Valor Recebido". 
      2. Ignore subtotais ou valores de descontos. No caso da "RFC Comercio de Miudezas", por exemplo, o valor correto é o final (R$ 20,48).
      3. Identifique o nome do estabelecimento no topo da nota para o campo "local".

      --- REGRAS PARA TEXTO ---
      1. Identifique gastos em mensagens como "Gastei 50 no mercado" ou "Paguei 20 de Uber".
      2. Converta valores por extenso para numerais (ex: "vinte reais" vira 20).
      3. Se o usuário não disser o local, tente deduzir pelo contexto ou use "Gasto Geral".

      --- PADRONIZAÇÃO ---
      - Se o valor não for identificado, retorne 0.
      - Se o local não for identificado, use "Gasto Geral".
      - Categorias permitidas: "Alimentação", "Lazer", "Transporte", "Casa", "Saúde", "Outros".

      FORMATO DE SAÍDA (JSON PURO):
      {
        "valor": number,
        "local": string,
        "categoria": "Alimentação" | "Lazer" | "Transporte" | "Casa" | "Saúde" | "Outros"
      }
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