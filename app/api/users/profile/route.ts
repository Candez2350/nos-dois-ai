import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, pix_key, role, created_at')
    .eq('id', session.userId)
    .single();

  if (error || !user) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // The 'whatsapp_number' is deprecated, so we don't return it.
  const profileData = { ...user, whatsapp_number: '' };

  return NextResponse.json({ user: profileData });
}

export async function PATCH(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const { name, pix_key } = await req.json();
  
    if (!name || !pix_key) {
        return NextResponse.json({ error: 'Name and PIX key are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('users')
      .update({ name, pix_key })
      .eq('id', session.userId)
      .select()
      .single();
  
    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
  
    return NextResponse.json({ user: data });
}
