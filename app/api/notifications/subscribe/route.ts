import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await req.json();
  if (!subscription) {
    return NextResponse.json({ error: 'Missing subscription object' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: session.userId,
    subscription: subscription,
  });

  if (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
