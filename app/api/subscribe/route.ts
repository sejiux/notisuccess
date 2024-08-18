import { NextRequest } from 'next/server';

let subscriptions: any[] = [];

export async function POST(req: NextRequest) {
  const subscription = await req.json();
  subscriptions.push(subscription);
  return new Response(JSON.stringify({}), { status: 201 });
}
