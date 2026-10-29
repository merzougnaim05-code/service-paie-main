/* ============================================================
   GET /api/status?m=<رقم الجهاز>
   يفحصه التطبيق عند الإقلاع ودورياً: هل التطبيق مفعّل العام؟
   هل هذا الجهاز موقوف فردياً؟ (فشل الاتصال = التطبيق يعمل عادي)
   ============================================================ */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type'
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const machineId = (url.searchParams.get('m') || '').toUpperCase().slice(0, 64);

  let enabled = true;
  let message = '';
  try {
    if (env.SP_KV) {
      const globalCfg = await env.SP_KV.get('cfg:global', 'json');
      if (globalCfg && globalCfg.enabled === false) {
        enabled = false;
        message = globalCfg.message || '';
      } else if (machineId) {
        const mCfg = await env.SP_KV.get('cfg:m:' + machineId, 'json');
        if (mCfg && mCfg.enabled === false) {
          enabled = false;
          message = mCfg.message || '';
        }
      }
    }
  } catch { /* KV غير متاح — اعتبر التطبيق مفعّلاً */ }

  return Response.json({ enabled, message }, { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
