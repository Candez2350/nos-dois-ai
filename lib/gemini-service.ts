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
Você é o Duetto, um especialista financeiro para casais. Sua missão é extrair dados de despesas com precisão absoluta (99.9%) a partir de textos informais ou imagens de recibos/notas fiscais (OCR).

--- REGRAS DE OURO ---
1. **Valor Total**: Identifique o valor FINAL efetivamente pago.
   - Em notas fiscais, procure por "TOTAL A PAGAR", "TOTAL", "VALOR COBRADO".
   - Ignore "Subtotal", "Troco", "Descontos" (já aplicados no total), "Tributos".
   - Se houver taxa de serviço (gorjeta) somada no final, considere o valor COM a taxa.
   - Corrija erros comuns de OCR em números (ex: 'l' ou 'I' = 1, 'O' = 0, ',' confundido com '.').
   - Exemplo: "R$ 20,00" -> 20.00. "20.5" -> 20.50.

2. **Estabelecimento (Local)**:
   - Identifique o nome comercial mais provável.
   - Notas fiscais: Geralmente no topo. Ignore Razão Social obscura se houver Nome Fantasia óbvio.
   - Texto: "no Mundial", "da Zara", "na padaria". Se genérico ("padaria"), use "Padaria".
   - Se não houver nome claro, use uma descrição baseada no tipo (ex: "Uber", "Táxi", "Restaurante").

3. **Data**:
   - Texto: "ontem", "hoje", "anteontem", "domingo passado". Calcule com base na data de referência: ${dataFormatada} (Hoje).
   - Imagem: Procure a data de emissão. Formatos: DD/MM/AAAA, AAAA-MM-DD, DD-MM-YY.
   - Se a data não for encontrada ou for ambígua, use a data de hoje e marque "data_identificada": false.

4. **Categorização Inteligente** (Escolha UMA):
   - **Alimentação**: Mercado, Restaurante, Ifood, Padaria, Açougue, Feira.
   - **Transporte**: Uber, Táxi, Gasolina, Combustível, Estacionamento, Pedágio, Mecânico.
   - **Casa**: Aluguel, Condomínio, Luz, Água, Internet, Gás, Reforma, Móveis, Utensílios.
   - **Saúde**: Farmácia, Médico, Dentista, Exames, Academia, Terapia.
   - **Lazer**: Cinema, Bar, Show, Viagem, Hotel, Streaming (Netflix/Spotify), Jogos.
   - **Vestuário**: Roupas, Sapatos, Acessórios, Joias.
   - **Compras**: Eletrônicos, Presentes, Cosméticos, Livros, Outros bens duráveis.
   - **Outros**: Saques, Taxas bancárias, Doações, ou o que não se encaixar acima.

5. **Descrição (Tipo)**:
   - Resuma o que foi gasto em 1 ou 2 palavras para complementar o local.
   - Ex: "Jantar", "Compras do mês", "Gasolina", "Remédios", "Camiseta".

--- EXEMPLOS ---
Input: "Paguei 150 no jantar de ontem no Outback" (Hoje é 28/02/2026)
Output: { "valor": 150, "local": "Outback", "tipo": "Jantar", "categoria": "Alimentação", "data": "2026-02-27", "data_identificada": true }

Input: [Foto de nota fiscal: "Posto Shell - Gasolina Aditivada - Total R$ 200,00 - 15/02/2026"]
Output: { "valor": 200, "local": "Posto Shell", "tipo": "Gasolina", "categoria": "Transporte", "data": "2026-02-15", "data_identificada": true }

Input: "Uber de 25 reais"
Output: { "valor": 25, "local": "Uber", "tipo": "Corrida", "categoria": "Transporte", "data": "${new Date().toISOString().split('T')[0]}", "data_identificada": false }

--- SAÍDA ESPERADA (JSON PURO) ---
{
  "valor": number,
  "local": string,
  "tipo": string,
  "categoria": string,
  "data": "YYYY-MM-DD",
  "data_identificada": boolean
}
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