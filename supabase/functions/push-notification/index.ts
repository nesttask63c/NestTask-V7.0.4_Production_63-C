import { serve } from 'https://deno.fresh.dev/std@v9.6.1/http/server.ts';
import webpush from 'https://esm.sh/web-push@3.6.7';

const VAPID_PUBLIC_KEY = 'BP0OqfYrKQh6jjbGPsCsh-RmZtsJKoDrcGdOLEgBn2ke2qbRR2DoC2cgF2XeRDKWcqFbWKWzJhLfhrxoRuTbxU8';
const VAPID_PRIVATE_KEY = 'N4XWQgw1uXxhu7H7AK3a84xJFZKVBwR1YqJuWl1qkFw';

webpush.setVapidDetails(
  'mailto:sheikhshariarnehal@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { subscription, payload } = await req.json();

    await webpush.sendNotification(subscription, JSON.stringify(payload));

    return new Response(
      JSON.stringify({ success: true }), 
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send push notification' }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});