import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getGenAIClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export interface ReceiptData {
  valor_total: number;
  estabelecimento: string;
  categoria: string;
}

/**
 * Analisa uma imagem de cupom fiscal usando o Google Gemini Vision.
 * @param imageInput Buffer da imagem ou string Base64.
 * @returns Dados extraídos do cupom (valor, estabelecimento, categoria).
 */
export async function analyzeReceipt(imageInput: Buffer | string): Promise<ReceiptData> {
  try {
    const client = getGenAIClient();

    // Tratamento do input da imagem
    let imageBase64: string;
    if (Buffer.isBuffer(imageInput)) {
      imageBase64 = imageInput.toString('base64');
    } else {
      // Remove prefixo de Data URI se existir (ex: "data:image/jpeg;base64,")
      imageBase64 = imageInput.replace(/^data:image\/\w+;base64,/, '');
    }

    const model = 'gemini-2.5-flash-image';
    const prompt = 'Extraia os seguintes dados deste cupom fiscal brasileiro: valor_total (number), estabelecimento (string), categoria (string). Se houver itens de mercado, saúde ou lazer, classifique corretamente. Retorne estritamente um JSON puro.';

    const result = await client.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // O Gemini aceita JPEG/PNG genericamente neste campo
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Baixa temperatura para maior precisão na extração de dados
      }
    });

    const responseText = result.text;

    if (!responseText) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    let data: ReceiptData;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Erro ao fazer parse do JSON do Gemini:", responseText);
      throw new Error("Falha ao processar a resposta da IA: Formato inválido.");
    }

    // Validação básica dos dados
    if (typeof data.valor_total !== 'number') {
      // Tenta corrigir se vier como string numérica
      if (typeof data.valor_total === 'string') {
        const parsed = parseFloat((data.valor_total as string).replace(',', '.'));
        if (!isNaN(parsed)) {
          data.valor_total = parsed;
        } else {
           throw new Error("Não foi possível identificar o valor total do cupom.");
        }
      } else {
         throw new Error("Não foi possível identificar o valor total do cupom.");
      }
    }

    return data;

  } catch (error) {
    console.error("Erro em analyzeReceipt:", error);
    throw error;
  }
}
