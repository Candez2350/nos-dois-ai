import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAIClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY ausente.");
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
 * Motor Único do Duetto: Processa Texto ou Imagem
 */
export async function analyzeExpense(input: { text?: string; imageBase64?: string }): Promise<ExpenseData> {
  try {
    const client = getGenAIClient();
    // Forçamos a versão 'v1' para evitar o erro 404 da v1beta
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });

    const prompt = `
      Você é o Duetto, assistente financeiro de um casal. 
      Extraia os dados de gasto no formato JSON: {"valor": number, "local": string, "categoria": string}.
      CATEGORIAS: Alimentação, Lazer, Transporte, Casa, Saúde, Outros.
      Regra: Se o local não estiver claro, use "Gasto Geral". Se o valor for texto (ex: cem reais), converta para número (100).
      RESPONDA APENAS O JSON PURO.
    `;

    let result;

    if (input.imageBase64) {
      // Processamento de Imagem (OCR)
      result = await model.generateContent([
        { inlineData: { mimeType: 'image/jpeg', data: input.imageBase64.replace(/^data:image\/\w+;base64,/, '') } },
        { text: prompt + " Analise esta imagem de recibo." }
      ]);
    } else {
      // Processamento de Texto Direto
      result = await model.generateContent(`${prompt} Texto do gasto: "${input.text}"`);
    }

    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(responseText);

    // Tratamento de segurança para valores (Lida com R$, vírgulas e pontos)
    let valorFinal = 0;
    if (typeof parsed.valor === 'string') {
      valorFinal = parseFloat(parsed.valor.replace(/[R$\s]/g, '').replace(',', '.'));
    } else {
      valorFinal = parsed.valor || 0;
    }

    return {
      valor: isNaN(valorFinal) ? 0 : valorFinal,
      local: parsed.local || "Desconhecido",
      categoria: parsed.categoria || "Outros"
    };

  } catch (error: any) {
    console.error("🔥 Erro no Gemini Service:", error.message);
    throw error;
  }
}