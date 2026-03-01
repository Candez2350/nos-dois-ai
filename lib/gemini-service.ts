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
  local: string;       // estabelecimento (ex: Mundial, Zara)
  tipo?: string;       // tipo do gasto (ex: Mercado, Vestuário, Posto)
  categoria: string;  // agrupamento para relatórios
  data: string;
  data_identificada: boolean;
}

export async function analyzeExpense(input: { text?: string; imageBase64?: string }): Promise<ExpenseData> {
  try {
    const client = getGenAIClient();

    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR');
    const systemInstruction = `
Você é o Duetto, assistente de organização financeira para casais brasileiros.
Extraia dados de despesas a partir de mensagens de texto ou imagens de recibos/notas fiscais.

--- IMAGENS (OCR) ---
• Valor: use o VALOR FINAL PAGO (Total, Total a Pagar, Valor Recebido). Ignore subtotais.
• local: nome do ESTABELECIMENTO (topo da nota). Ex: "Mundial", "Zara", "Posto Ipiranga".
• tipo: o que foi comprado em uma palavra (Supermercado, Vestuário, Combustível, Farmácia, etc.).
• categoria: use uma das categorias fixas listadas abaixo.

--- TEXTO ---
• "Gastei 95 no Mundial" → local="Mundial", tipo="Supermercado" ou "Mercado", categoria="Alimentação".
• "Comprei 90 reais na Zara" → local="Zara", tipo="Vestuário", categoria="Vestuário" ou "Compras".
• "Paguei 30 no posto" → local="Posto" (ou nome se disser), tipo="Combustível", categoria="Transporte".
• Converta valores por extenso em número ("vinte reais" → 20).

--- CATEGORIAS (use EXATAMENTE uma) ---
"Alimentação", "Lazer", "Transporte", "Casa", "Saúde", "Vestuário", "Compras", "Outros"

--- DATA ---
Hoje: ${dataFormatada}. Ano 2026.
• "ontem" = dia anterior a hoje.
• Sem data no texto → use a data de hoje e "data_identificada": false.

--- SAÍDA (JSON apenas) ---
{
  "valor": number,
  "local": string,
  "tipo": string,
  "categoria": string,
  "data": "YYYY-MM-DD",
  "data_identificada": boolean
}

• valor não identificado → 0.
• local não identificado → "Gasto Geral".
• tipo não identificado → "Outros".
    `;

    let result;

    if (input.imageBase64) {
      const cleanBase64 = input.imageBase64.includes(',')
        ? input.imageBase64.split(',')[1]
        : input.imageBase64;

      console.log("📸 [DEBUG] Início do Base64:", cleanBase64.substring(0, 30) + "...");

      result = await model.generateContent([
        { text: systemInstruction },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        },
        { text: "Extraia os dados financeiros desta nota fiscal e retorne APENAS o JSON." }
      ]);

    } else {
      result = await model.generateContent([
        { text: systemInstruction },
        { text: `Texto do usuário: "${input.text}"` }
      ]);
    }

    const responseText = result.response.text();
    console.log("🤖 [DEBUG] Resposta da IA:", responseText);

    // Remove possíveis markdown fences caso o modelo retorne ```json ... ```
    const cleanResponse = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanResponse);

    // Conversão robusta para número (trata "R$ 20,48", "20.48", 20)
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
      tipo: parsed.tipo || undefined,
      categoria: parsed.categoria || "Outros",
      data: parsed.data || new Date().toISOString().split('T')[0],
      data_identificada: !!parsed.data_identificada,
    };

  } catch (error: any) {
    console.error("🔥 Erro no Gemini Service:", error.message);
    throw error;
  }
}