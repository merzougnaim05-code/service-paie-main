/* ============================================================
   /api/registry — محمي برمز المطوّر (x-admin-token)
   GET  : سجل المفعّلين + الإعدادات العامة
   POST : مفتاح الإيقاف/التشغيل
          { action: 'kill' | 'enable', message? }
          { action: 'disable' | 'enable', machineId, message? }
   ============================================================ */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, x-admin-token'
};

function authorized(request, env) {
  const token = request.headers.get('x-admin-token') || '';
  return !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!authorized(request, env)) return Response.json({ error: 'unauthorized' }, { status: 401, headers: CORS });

  const activations = [];
  let cursor;
  try {
    do {
      const page = await env.SP_KV.list({ prefix: 'act:', cursor });
      for (const k of page.keys) {
        const rec = await env.SP_KV.get(k.name, 'json');
        if (rec) activations.push(rec);
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);
  } catch (e) {
    return Response.json({ error: 'kv: ' + String(e) }, { status: 500, headers: CORS });
  }
  activations.sort((a, b) => String(b.lastSeen).localeCompare(String(a.lastSeen)));

  const globalCfg = await env.SP_KV.get('cfg:global', 'json').catch(() => null);
  return Response.json({
    config: { enabled: !(globalCfg && globalCfg.enabled === false), message: (globalCfg && globalCfg.message) || '' },
    count: activations.length,
    activations
  }, { headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!authorized(request, env)) return Response.json({ error: 'unauthorized' }, { status: 401, headers: CORS });
  try {
    const body = await request.json();
    const action = body.action;

    if (action === 'kill' || action === 'enable') {
      const globalCfg = await env.SP_KV.get('cfg:global', 'json').catch(() => null) || {};
      if (action === 'kill') {
        globalCfg.enabled = false;
        globalCfg.message = String(body.message || 'تم إيقاف التطبيق من قِبل المطوّر.').slice(0, 300);
      } else {
        globalCfg.enabled = true;
        globalCfg.message = '';
      }
      await env.SP_KV.put('cfg:global', JSON.stringify(globalCfg));
      return Response.json({ ok: true, config: globalCfg }, { headers: CORS });
    }

    if (action === 'disable' || action === 'enable') {
      const machineId = String(body.machineId || '').toUpperCase().slice(0, 64);
      if (!machineId) return Response.json({ error: 'machineId required' }, { status: 400, headers: CORS });
      const key = 'cfg:m:' + machineId;
      if (action === 'disable') {
        await env.SP_KV.put(key, JSON.stringify({ enabled: false, message: String(body.message || '').slice(0, 300) }));
      } else {
        await env.SP_KV.delete(key);
      }
      return Response.json({ ok: true }, { headers: CORS });
    }

    if (action === 'delete') {
      // حذف سجل تفعيل من السجل (جهاز لم يعد مستخدماً أو سجل اختبار)
      const machineId = String(body.machineId || '').toUpperCase().slice(0, 64);
      if (!machineId) return Response.json({ error: 'machineId required' }, { status: 400, headers: CORS });
      await env.SP_KV.delete('act:' + machineId);
      await env.SP_KV.delete('cfg:m:' + machineId);
      return Response.json({ ok: true }, { headers: CORS });
    }

    return Response.json({ error: 'unknown action' }, { status: 400, headers: CORS });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 400, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
