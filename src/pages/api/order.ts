import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as {
      contact: { name: string; phone: string; address: string };
      items: Array<{ productId: string; name: string; color: string; colorHex: string; size: string; quantity: number; price: number }>;
    };

    const { contact, items } = body;

    if (!contact?.name || !contact?.phone || !contact?.address || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: '请求参数不完整' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orderId = `ORD-${Date.now()}`;
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = {
      orderId,
      contact,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const kv = locals.runtime.env.QUAN_STORE;
    await kv.put(`order:${orderId}`, JSON.stringify(order), {
      expirationTtl: 60 * 60 * 24 * 90,
    });

    return new Response(JSON.stringify({ orderId, total }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
