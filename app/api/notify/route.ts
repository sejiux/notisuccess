import { NextRequest } from 'next/server';
import webPush from 'web-push';

webPush.setVapidDetails(
  'mailto:slmrsv.bz@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? ""
);

export async function POST(req: NextRequest) {
  try {
  const { title, body, icon, url, subscription } = await req.json();

  const notificationPayload = {
      title,
      body,
      icon,
      url
  };
  
    await webPush.sendNotification(subscription, JSON.stringify(notificationPayload));
    if(!subscription) {
      return new Response(JSON.stringify({ message: 'Failed to add subscription' }), { status: 404 });
    }
    return new Response(JSON.stringify({ message: 'Notification sent' }), { status: 200 });
  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(JSON.stringify({ error: 'Failed to send notification' }), { status: 500 });
  }
}
