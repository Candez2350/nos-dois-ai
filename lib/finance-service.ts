import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendWhatsAppMessage } from '@/lib/evolution-api';

export type BalanceResult = {
  totalGeral: number;
  totalP1: number;
  totalP2: number;
  p1Name: string;
  p2Name: string;
  amountToTransfer: number;
  payerName: string;
  receiverName: string;
  periodRef: string;
  splitType: string;
  p1Id: string;
  p2Id: string;
  p1Phone: string;
  p2Phone: string;
  payerId: string | null;
  receiverId: string | null;
};

async function getBalanceInternal(
  coupleId: string,
  startDate: string,
  endDate: string
): Promise<BalanceResult | null> {
  const supabase = getSupabaseAdmin();

  const { data: couple, error: coupleErr } = await supabase
    .from('couples')
    .select('*')
    .eq('id', coupleId)
    .single();

  if (!couple || coupleErr) throw new Error('Configuração do casal não encontrada.');

  const partner1Id = (couple as { partner_1_id?: string }).partner_1_id;
  const partner2Id = (couple as { partner_2_id?: string }).partner_2_id;

  const { data: users } = await supabase
    .from('users')
    .select('id, name, whatsapp_number')
    .eq('couple_id', coupleId);

  const p1User =
    users?.find((u) => u.id === partner1Id) ??
    users?.find((u) => u.whatsapp_number === couple.p1_wa_number);
  const p2User =
    users?.find((u) => u.id === partner2Id) ??
    users?.find((u) => u.whatsapp_number === couple.p2_wa_number);

  const p1Name = p1User?.name ?? 'Parceiro 1';
  const p2Name = p2User?.name ?? 'Parceiro 2';

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('id, amount, payer_user_id, payer_wa_number')
    .eq('couple_id', coupleId)
    .is('settlement_id', null)
    .gte('expense_date', startDate)
    .lte('expense_date', endDate);

  if (txError || !transactions || transactions.length === 0) {
    return null;
  }

  const isP1 = (t: { payer_user_id?: string | null; payer_wa_number?: string | null }) =>
    (t.payer_user_id && t.payer_user_id === partner1Id) ||
    (!t.payer_user_id && t.payer_wa_number === couple.p1_wa_number);
  const isP2 = (t: { payer_user_id?: string | null; payer_wa_number?: string | null }) =>
    (t.payer_user_id && t.payer_user_id === partner2Id) ||
    (!t.payer_user_id && t.payer_wa_number === couple.p2_wa_number);

  const totalP1 =
    transactions?.filter(isP1).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalP2 =
    transactions?.filter(isP2).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalGeral = totalP1 + totalP2;

  let amountToTransfer = 0;
  let payerId: string | null = null;
  let receiverId: string | null = null;
  let payerName = '';
  let receiverName = '';

  const p1Share = couple.split_percentage_partner_1 || 50;

  if (couple.split_type === 'EQUAL') {
    amountToTransfer = Math.abs(totalP1 - totalP2) / 2;
    const p1Deve = totalP1 < totalP2;
    payerId = p1Deve ? p1User?.id ?? null : p2User?.id ?? null;
    receiverId = p1Deve ? p2User?.id ?? null : p1User?.id ?? null;
    payerName = p1Deve ? p1Name : p2Name;
    receiverName = p1Deve ? p2Name : p1Name;
  } else if (couple.split_type === 'PROPORTIONAL') {
    const targetP1 = totalGeral * (p1Share / 100);
    const balanceP1 = totalP1 - targetP1;
    if (balanceP1 > 0) {
      amountToTransfer = balanceP1;
      payerId = p2User?.id ?? null;
      receiverId = p1User?.id ?? null;
      payerName = p2Name;
      receiverName = p1Name;
    } else {
      amountToTransfer = Math.abs(balanceP1);
      payerId = p1User?.id ?? null;
      receiverId = p2User?.id ?? null;
      payerName = p1Name;
      receiverName = p2Name;
    }
  }

  const periodRef = `${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`;

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
    splitType: couple.split_type,
    p1Id: p1User?.id ?? '',
    p2Id: p2User?.id ?? '',
    p1Phone: p1User?.whatsapp_number ?? '',
    p2Phone: p2User?.whatsapp_number ?? '',
    payerId,
    receiverId,
  };
}

/** Retorna o saldo do período sem criar liquidação (para dashboard). */
export async function getBalance(
  coupleId: string,
  startDate: string,
  endDate: string
): Promise<BalanceResult | null> {
  return getBalanceInternal(coupleId, startDate, endDate);
}

/** Solicita o fechamento (cria pendência e notifica o parceiro). */
export async function requestSettlement(
  coupleId: string,
  startDate: string,
  endDate: string,
  requesterId: string
): Promise<{ success: boolean; message: string }> {
  const balance = await getBalanceInternal(coupleId, startDate, endDate);
  if (!balance) throw new Error('Não há dados para fechar neste período.');

  const supabase = getSupabaseAdmin();

  // 1. Verificar se já existe solicitação pendente (Regra 3)
  const { data: existing } = await supabase
    .from('settlements')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('status', 'PENDING')
    .maybeSingle();

  if (existing) {
    throw new Error('Já existe uma solicitação de fechamento pendente. Aguarde a aprovação ou rejeição.');
  }

  // Cria o registro de settlement com status PENDING
  const { error } = await supabase.from('settlements').insert({
    couple_id: coupleId,
    amount_settled: balance.amountToTransfer,
    paid_by: balance.payerId,
    received_by: balance.receiverId,
    month_reference: balance.periodRef,
    start_date: startDate,
    end_date: endDate,
    status: 'PENDING',
    total_expenses: balance.totalGeral,
    requested_by: requesterId,
  });

  if (error) throw new Error(`Erro ao criar solicitação: ${error.message}`);

  // Notifica o outro parceiro
  const isP1Requester = requesterId === balance.p1Id;
  const targetPhone = isP1Requester ? balance.p2Phone : balance.p1Phone;
  const targetName = isP1Requester ? balance.p2Name : balance.p1Name;
  const requesterName = isP1Requester ? balance.p1Name : balance.p2Name;

  let warning = '';
  if (targetPhone) {
    try {
      const msg = `Olá ${targetName}! 💑\n\n${requesterName} solicitou o fechamento das contas de ${balance.periodRef}.\n\nValor do acerto: R$ ${balance.amountToTransfer.toFixed(2)}\nQuem paga: ${balance.payerName}\n\nAcesse o app para aprovar: https://nosdois.ai/app/dashboard`;
      await sendWhatsAppMessage(msg, targetPhone);
    } catch (err) {
      console.error('Erro ao enviar notificação de fechamento:', err);
      warning = ' (Notificação de WhatsApp falhou, avise seu parceiro manualmente)';
    }
  }

  return { success: true, message: `Solicitação enviada para aprovação!${warning}` };
}

/** Aprova o fechamento e atualiza as transações. */
export async function approveSettlement(settlementId: string, coupleId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: settlement } = await supabase.from('settlements').select('*').eq('id', settlementId).single();
  if (!settlement) throw new Error('Solicitação não encontrada.');

  if (settlement.status !== 'PENDING') {
    throw new Error('Esta solicitação já foi processada.');
  }

  if (settlement.couple_id !== coupleId) {
    throw new Error('Você não tem permissão para aprovar esta liquidação.');
  }

  // Atualiza as transações do período
  const { error: txError } = await supabase
    .from('transactions')
    .update({ settlement_id: settlementId })
    .eq('couple_id', settlement.couple_id)
    .is('settlement_id', null)
    .gte('expense_date', settlement.start_date)
    .lte('expense_date', settlement.end_date);

  if (txError) throw new Error(`Erro ao atualizar transações: ${txError.message}`);

  // Marca como concluído
  const { error: settleError } = await supabase
    .from('settlements')
    .update({ status: 'COMPLETED' })
    .eq('id', settlementId);

  if (settleError) throw new Error(`Erro ao finalizar fechamento: ${settleError.message}`);

  // Notifica quem solicitou
  if (settlement.requested_by) {
    const { data: requester } = await supabase.from('users').select('whatsapp_number, name').eq('id', settlement.requested_by).single();
    if (requester?.whatsapp_number) {
      try {
        await sendWhatsAppMessage(`Olá ${requester.name}! ✅\n\nO fechamento de contas foi APROVADO pelo seu parceiro(a). 🎉\n\nAs despesas foram liquidadas e o histórico atualizado.`, requester.whatsapp_number);
      } catch (e) { console.error('Erro zap aprovação', e); }
    }
  }
}

/** Rejeita o fechamento. */
export async function rejectSettlement(settlementId: string, coupleId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: settlement } = await supabase.from('settlements').select('*').eq('id', settlementId).single();
  if (!settlement) throw new Error('Solicitação não encontrada.');

  if (settlement.status !== 'PENDING') {
    throw new Error('Esta solicitação já foi processada.');
  }

  if (settlement.couple_id !== coupleId) {
    throw new Error('Você não tem permissão para rejeitar esta liquidação.');
  }

  // Marca como rejeitado
  const { error } = await supabase
    .from('settlements')
    .update({ status: 'REJECTED' })
    .eq('id', settlementId);

  if (error) throw new Error(`Erro ao rejeitar: ${error.message}`);

  // Notifica quem solicitou
  if (settlement.requested_by) {
    const { data: requester } = await supabase.from('users').select('whatsapp_number, name').eq('id', settlement.requested_by).single();
    if (requester?.whatsapp_number) {
      try {
        await sendWhatsAppMessage(`Olá ${requester.name}. ⚠️\n\nO fechamento de contas foi REJEITADO pelo seu parceiro(a).\n\nVerifique as despesas e tente novamente.`, requester.whatsapp_number);
      } catch (e) { console.error('Erro zap rejeição', e); }
    }
  }
}
