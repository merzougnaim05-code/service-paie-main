/* ============================================================
   POST /api/activate
   يبلغه التطبيق بعد تفعيل ناجح: يسجّل الجهاز في سجل المفعّلين.
   { machineId, code, version }
   ============================================================ */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type'
};

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.SP_KV) return Response.json({ ok: false, error: 'KV missing' }, { status: 500, headers: CORS });
  try {
    const { machineId, code, version } = await request.json();
    if (!machineId || typeof machineId !== 'string' || machineId.length > 64) {
      return Response.json({ ok: false }, { status: 400, headers: CORS });
    }
    const key = 'act:' + machineId.toUpperCase();
    const now = new Date().toISOString();
    const prev = await env.SP_KV.get(key, 'json');
    const record = {
      machineId: machineId.toUpperCase(),
      code: String(code || '').slice(0, 48),
      version: String(version || '').slice(0, 16),
      firstSeen: (prev && prev.firstSeen) || now,
      lastSeen: now,
      count: ((prev && prev.count) || 0) + 1
    };
    await env.SP_KV.put(key, JSON.stringify(record));
    return Response.json({ ok: true }, { headers: CORS });
  } catch {
    return Response.json({ ok: false }, { status: 400, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
