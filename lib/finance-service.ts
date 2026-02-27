import { getSupabaseAdmin } from 'lib/supabase-admin';

export async function calculateSettlement(
  coupleId: string, 
  startDate: string, 
  endDate: string
) {
  const supabase = getSupabaseAdmin();
  
  // 1. Busca configuração e nomes dinâmicos
  const { data: couple, error: coupleErr } = await supabase
    .from('couples')
    .select(`
      *,
      p1:users!p1_wa_number(id, name),
      p2:users!p2_wa_number(id, name)
    `)
    .eq('id', coupleId)
    .single();

  if (!couple || coupleErr) throw new Error("Configuração do casal não encontrada.");

  const p1Name = couple.p1?.name || "Parceiro 1";
  const p2Name = couple.p2?.name || "Parceiro 2";

  const startOfDay = `${startDate}T00:00:00Z`;
  const endOfDay = `${endDate}T23:59:59Z`;

  // 2. BUSCA ATIVA: Somente transações SEM settlement_id (não liquidadas)
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, amount, payer_wa_number') // Buscamos o ID para poder atualizar depois
    .eq('couple_id', coupleId)
    .is('settlement_id', null) // <-- A TRAVA DE SEGURANÇA
    .gte('expense_date', startDate) // <-- Mudança aqui
    .lte('expense_date', endDate);

  if (txError || !transactions || transactions.length === 0) {
    return null; // Retorna nulo se não houver nada para fechar
  }

  const totalP1 = transactions
    ?.filter(t => t.payer_wa_number === couple.p1_wa_number)
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalP2 = transactions
    ?.filter(t => t.payer_wa_number === couple.p2_wa_number)
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const totalGeral = totalP1 + totalP2;
  
  let amountToTransfer = 0;
  let payerId = null;
  let receiverId = null;
  let payerName = '';
  let receiverName = '';

  const p1Share = couple.split_percentage_partner_1 || 50;

  // 4. Motores de Cálculo
  if (couple.split_type === 'EQUAL') {
    // Matemática: $T = \frac{|S_1 - S_2|}{2}$
    amountToTransfer = Math.abs(totalP1 - totalP2) / 2;
    const p1Deve = totalP1 < totalP2;
    
    payerId = p1Deve ? couple.p1.id : couple.p2.id;
    receiverId = p1Deve ? couple.p2.id : couple.p1.id;
    payerName = p1Deve ? p1Name : p2Name;
    receiverName = p1Deve ? p2Name : p1Name;

  } else if (couple.split_type === 'PROPORTIONAL') {
    // Matemática: $D_1 = G \times \frac{P_1}{100}$ | $Saldo = S_1 - D_1$
    const targetP1 = totalGeral * (p1Share / 100);
    const balanceP1 = totalP1 - targetP1;

    if (balanceP1 > 0) {
      amountToTransfer = balanceP1;
      payerId = couple.p2.id;
      receiverId = couple.p1.id;
      payerName = p2Name;
      receiverName = p1Name;
    } else {
      amountToTransfer = Math.abs(balanceP1);
      payerId = couple.p1.id;
      receiverId = couple.p2.id;
      payerName = p1Name;
      receiverName = p2Name;
    }
  }

  // 5. REGISTRO E LIQUIDAÇÃO (O "SELAMENTO")
  const periodRef = `${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`;
  
  if (amountToTransfer > 0) {
    // A. Cria o registro na settlements e pega o ID gerado
    const { data: settlementRecord, error: settleErr } = await supabase
      .from('settlements')
      .insert({
        couple_id: coupleId,
        amount_settled: amountToTransfer,
        paid_by: payerId,
        received_by: receiverId,
        month_reference: periodRef
      })
      .select('id')
      .single();

    if (settleErr) throw settleErr;

    // B. "Carimba" todas as transações usadas com o ID do settlement
    const transactionIds = transactions.map(t => t.id);
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ settlement_id: settlementRecord.id })
      .in('id', transactionIds);

    if (updateError) throw updateError;
  }

  return {
    totalGeral,
    totalP1,
    totalP2,
    p1Name,
    p2Name,
    amountToTransfer,
    payerName,
    receiverName,
    periodRef,
    splitType: couple.split_type
  };
}