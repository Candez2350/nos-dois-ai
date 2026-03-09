import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await req.json();
  if (!subscription) {
    return NextResponse.json({ error: 'Missing subscription object' }, { status: 400 });
  }

  // The user object from supabase.auth.getUser() has the correct auth.users.id
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: user.id,
    subscription: subscription,
  });

  if (error) {
    console.error('Error saving push subscription:', error);
    // Be more specific about the error if possible, e.g., duplicate subscription
    if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'Subscription already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
