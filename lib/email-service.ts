import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const fromEmail = process.env.FROM_EMAIL || 'notification@nosdois.ai';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
}

async function sendEmail({ to, subject, text }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Email not sent.');
    // In a real app, you might want to throw an error or handle this differently
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export async function sendAdjustmentRequestEmail(to: string, requesterName: string, transactionDescription: string, adjustmentAmount: number) {
  const subject = `Solicitação de Ajuste: ${transactionDescription}`;
  const text = `${requesterName} solicitou um ajuste na despesa "${transactionDescription}" para o valor de R$ ${adjustmentAmount}.

Acesse o dashboard para aprovar ou rejeitar.`;
  
  await sendEmail({ to, subject, text });
}

export async function sendDeletionRequestEmail(to: string, requesterName: string, transactionDescription: string) {
  const subject = `Solicitação de Exclusão: ${transactionDescription}`;
  const text = `${requesterName} solicitou a exclusão da despesa "${transactionDescription}".

Acesse o dashboard para aprovar ou rejeitar.`;

  await sendEmail({ to, subject, text });
}
