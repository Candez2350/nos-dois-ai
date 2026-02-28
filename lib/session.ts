import { cookies } from 'next/headers';
import { createHmac } from 'crypto';

const COOKIE_NAME = 'nd_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export type AppSession = {
  coupleId: string;
  partner: 1 | 2;
  partnerName: string;
  activationToken: string;
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return secret;
}

function encode(session: AppSession): string {
  const payload = JSON.stringify(session);
  const secret = getSecret();
  const signature = Buffer.from(
    createHmac('sha256', secret).update(payload).digest('hex')
  ).toString('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${signature}`;
}

function decode(value: string): AppSession | null {
  try {
    const [payloadB64, signature] = value.split('.');
    if (!payloadB64 || !signature) return null;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const secret = getSecret();
    const expected = Buffer.from(
      createHmac('sha256', secret).update(payload).digest('hex')
    ).toString('base64url');
    if (signature !== expected) return null;
    return JSON.parse(payload) as AppSession;
  } catch {
    return null;
  }
}

export async function createSession(session: AppSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return decode(value);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
