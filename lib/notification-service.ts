import webpush from 'web-push';
import { createAdminClient } from './supabase-admin';

if (
  !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  !process.env.VAPID_PRIVATE_KEY
) {
  console.warn(
    'VAPID keys are not defined. Push notifications will be disabled.'
  );
} else {
  webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendNotification(userId: string, payload: NotificationPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    console.log('Push notifications are disabled. Cannot send notification.');
    return;
  }
  
  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching push subscriptions:', error);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) {
    return; // No subscriptions for this user
  }

  const notificationPromises = subscriptions.map(s =>
    webpush.sendNotification(
      s.subscription,
      JSON.stringify(payload)
    ).catch(err => {
      // Handle expired or invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log('Subscription has expired or is no longer valid. Removing...');
        return supabase
          .from('push_subscriptions')
          .delete()
          .eq('subscription->>endpoint', s.subscription.endpoint);
      } else {
        console.error('Error sending push notification:', err);
      }
    })
  );

  await Promise.all(notificationPromises);
}
