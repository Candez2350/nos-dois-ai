import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'Webhook Ativo', message: 'NósDois.ai está ouvindo!' });
}

export async function POST() {
  return NextResponse.json({ status: 'Recebido', message: 'Dados processados' });
}