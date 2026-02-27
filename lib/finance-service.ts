import { getSupabaseAdmin } from 'lib/supabase-admin';

export async function calculateSettlement(
  coupleId: string, 
  startDate: string, 
  endDate: string
) {
  const supabase = getSupabaseAdmin();
  
  // 1. Busca a configuração básica do casal
  const { data: couple, error: coupleErr } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single();

  if (!couple || coupleErr) throw new Error("Configuração do casal não encontrada.");

  // 2. Busca os nomes dos parceiros na tabela users de forma independente
  const { data: users } = await supabase
    .from('users')
    .select('id, name, wa_number')
    .in('wa_number', [couple.p1_wa_number, couple.p2_wa_number]);

  const p1User = users?.find(u => u.wa_number === couple.p1_wa_number);
  const p2User = users?.find(u => u.wa_number === couple.p2_wa_number);

  const p1Name = p1User?.name || "Parceiro 1";
  const p2Name = p2User?.name || "Parceiro 2";

  const startOfDay = `${startDate}T00:00:00Z`;
  const endOfDay = `${endDate}T23:59:59Z`;

  // 3. Soma os gastos não liquidados no período (expense_date)
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, amount, payer_wa_number')
    .eq('couple_id', coupleId)
    .is('settlement_id', null)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  if (txError || !transactions || transactions.length === 0) {
    return null; 
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
    amountToTransfer = Math.abs(totalP1 - totalP2) / 2;
    const p1Deve = totalP1 < totalP2;
    
    payerId = p1Deve ? p1User?.id : p2User?.id;
    receiverId = p1Deve ? p2User?.id : p1User?.id;
    payerName = p1Deve ? p1Name : p2Name;
    receiverName = p1Deve ? p2Name : p1Name;

  } else if (couple.split_type === 'PROPORTIONAL') {
    const targetP1 = totalGeral * (p1Share / 100);
    const balanceP1 = totalP1 - targetP1;

    if (balanceP1 > 0) {
      amountToTransfer = balanceP1;
      payerId = p2User?.id;
      receiverId = p1User?.id;
      payerName = p2Name;
      receiverName = p1Name;
    } else {
      amountToTransfer = Math.abs(balanceP1);
      payerId = p1User?.id;
      receiverId = p2User?.id;
      payerName = p1Name;
      receiverName = p2Name;
    }
  }

  // 5. REGISTRO E LIQUIDAÇÃO
  const periodRef = `${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`;
  
  if (amountToTransfer > 0 && payerId && receiverId) {
    const { data: settlementRecord } = await supabase
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

    if (settlementRecord) {
      const transactionIds = transactions.map(t => t.id);
      await supabase
        .from('transactions')
        .update({ settlement_id: settlementRecord.id })
        .in('id', transactionIds);
    }
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