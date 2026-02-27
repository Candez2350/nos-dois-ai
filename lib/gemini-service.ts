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
  data: string;               // Novo: YYYY-MM-DD
  data_identificada: boolean; // Novo: Para sabermos se foi lido ou deduzido
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

    const systemInstruction = `
      Você é o Duetto, um assistente de organização financeira para casais brasileiros.
      Sua função é extrair dados de despesas a partir de mensagens de texto ou imagens de recibos/notas fiscais.

      --- REGRAS PARA IMAGENS (OCR) ---
      1. Leia TODA a imagem com atenção antes de responder.
      2. O valor correto a extrair é o VALOR FINAL PAGO. Procure por: "Valor a Pagar", "Total Pago", "Valor Recebido", "Total", "TOTAL A PAGAR".
      3. IGNORE subtotais, valores parciais e descontos intermediários.
      4. O nome do estabelecimento geralmente aparece no TOPO da nota fiscal — use-o no campo "local".
      5. Se houver CNPJ ou endereço, ignore — foque apenas no nome do estabelecimento e no valor final.

      --- REGRAS PARA TEXTO ---
      1. Identifique gastos em mensagens como "Gastei 50 no mercado" ou "Paguei R$ 30,00 no posto".
      2. Converta valores por extenso para numerais (ex: "vinte reais" vira 20).

      --- CATEGORIAS DISPONÍVEIS ---
      "Alimentação", "Lazer", "Transporte", "Casa", "Saúde", "Outros"

      --- REGRA DE DATA ---
      1. Procure referências temporais: "hoje", "ontem", "anteontem", datas (10/02) ou dias da semana.
      2. Se for uma imagem, procure a data de emissão.
      3. IMPORTANTE: 
        - Se encontrar uma data clara ou referência temporal no texto: "data_identificada": true.
        - Se NÃO encontrar nada e precisar usar a data de hoje por padrão: "data_identificada": false.

      FORMATO DE SAÍDA (JSON):
      {
        "valor": number,
        "local": string,
        "categoria": string,
        "data": "YYYY-MM-DD",
        "data_identificada": boolean
      }

      Se o valor não for identificado, retorne 0.
      Se o local não for identificado, use "Gasto Geral".
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
      categoria: parsed.categoria || "Outros",
      data: parsed.data || new Date().toISOString().split('T')[0],
      data_identificada: !!parsed.data_identificada
    };

  } catch (error: any) {
    console.error("🔥 Erro no Gemini Service:", error.message);
    throw error;
  }
}