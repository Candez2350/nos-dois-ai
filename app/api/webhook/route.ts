import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: "Backend Online", message: "NósDois.ai está vivo!" });
}

export async function POST() {
  return NextResponse.json({ status: "Recebido", message: "Webhook funcionando" });
}