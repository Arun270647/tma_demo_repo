// Supabase Edge Function: send-notification
// Sends web push notifications to subscribed users

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  type?: string;
  data?: any;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@trackmyacademy.com';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error('VAPID keys not configured');
    }

    // Parse request body
    const { userId, userIds, notification } = await req.json();

    if (!userId && !userIds) {
      return new Response(
        JSON.stringify({ error: 'userId or userIds required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!notification || !notification.title || !notification.body) {
      return new Response(
        JSON.stringify({ error: 'Notification title and body required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get push subscriptions from database
    let query = supabase.from('push_subscriptions').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (userIds && Array.isArray(userIds)) {
      query = query.in('user_id', userIds);
    }

    const { data: subscriptions, error: dbError } = await query;

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload
    const payload: NotificationPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-72x72.png',
      url: notification.url || '/',
      type: notification.type || 'general',
      data: notification.data || {},
    };

    const payloadString = JSON.stringify(payload);

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          // Prepare web push notification
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          // Send using web-push protocol
          const response = await sendWebPush(
            subscription,
            payloadString,
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY,
            VAPID_SUBJECT
          );

          // Update last_used_at timestamp
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);

          return { success: true, userId: sub.user_id };
        } catch (error) {
          console.error('Error sending to subscription:', error);

          // If subscription is no longer valid (410 Gone), remove it
          if (error instanceof Error && error.message.includes('410')) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
            console.log('Removed invalid subscription:', sub.id);
          }

          return { success: false, userId: sub.user_id, error: error.message };
        }
      })
    );

    // Count successes and failures
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        sent: successful,
        failed: failed,
        total: subscriptions.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to send web push notification
async function sendWebPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  // This is a simplified implementation
  // In production, you would use the web-push library
  // For Deno, you can use: https://deno.land/x/web_push

  // Import web-push for Deno
  const webPush = await import('https://deno.land/x/web_push@0.0.6/mod.ts');

  // Set VAPID details
  webPush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  // Send notification
  const result = await webPush.sendNotification(subscription, payload);

  if (!result.ok) {
    throw new Error(`Push service returned ${result.status}: ${result.statusText}`);
  }

  return result;
}
