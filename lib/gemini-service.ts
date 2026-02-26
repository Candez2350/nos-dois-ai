import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function getGenAIClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface ReceiptData {
  valor_total: number;
  estabelecimento: string;
  categoria: string;
}

export async function analyzeReceipt(imageInput: Buffer | string): Promise<ReceiptData> {
  try {
    const client = getGenAIClient();

    let imageBase64: string;
    if (typeof imageInput !== 'string') {
      imageBase64 = imageInput.toString('base64');
    } else {
      imageBase64 = imageInput.replace(/^data:image\/\w+;base64,/, '');
    }

    const modelInstance = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = 'Extraia os seguintes dados deste cupom fiscal brasileiro: valor_total (number), estabelecimento (string), categoria (string). Retorne estritamente um JSON puro.';

    const result = await modelInstance.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    
    // Usamos 'any' aqui para evitar o erro de 'never' no TypeScript
    const rawData = JSON.parse(cleanJson) as any;
    
    // Tratamos a conversão de valor de forma segura
    let valorFinal = 0;
    if (typeof rawData.valor_total === 'string') {
      valorFinal = parseFloat(rawData.valor_total.replace(',', '.'));
    } else if (typeof rawData.valor_total === 'number') {
      valorFinal = rawData.valor_total;
    }

    const data: ReceiptData = {
      valor_total: isNaN(valorFinal) ? 0 : valorFinal,
      estabelecimento: rawData.estabelecimento || "Desconhecido",
      categoria: rawData.categoria || "Outros"
    };

    return data;

  } catch (error) {
    console.error("Erro em analyzeReceipt:", error);
    throw error;
  }
}