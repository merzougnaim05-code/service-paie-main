/* ============================================================
   خادم لوحة الإدارة المحلي — يعمل على جهازك فقط (127.0.0.1:5790)
   التشغيل: npm run admin   (أو node admin/admin-server.cjs)
   يوفّر: توليد أكواد التفعيل + قراءة سجل المفعّلين من السحابة
          + مفتاح الإيقاف/التشغيل عن بعد.
   ============================================================ */
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = 5790;
const CLOUD_BASE = 'https://service-paie.pages.dev';
const KEY_FILE = path.join(__dirname, 'keys.json');

let keys = {};
try {
  keys = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
} catch {
  console.error('تنبيه: admin/keys.json غير موجود — التوليد والسحابة لن تعملا حتى استعادته.');
}

/* توليد الكود بنفس خوارزمية keygen.cjs (بدون إعادة تعريف مكررة) */
const crypto = require('crypto');
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(buf) {
  let bits = 0, value = 0, out = '';
  for (const b of buf) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function generateCode(machineId, expiry) {
  if (!/^\d{8}$/.test(expiry)) throw new Error('صيغة التاريخ يجب أن تكون YYYYMMDD');
  const master = machineId.trim() === '*';
  const compact = master ? '*' : machineId.replace(/-/g, '').toUpperCase();
  if (!master && !/^[A-Z2-7]{16}$/.test(compact)) {
    throw new Error('رقم الجهاز يجب أن يكون 16 حرفاً بصيغة XXXX-XXXX-XXXX-XXXX');
  }
  const sig = base32(crypto.createHmac('sha256', Buffer.from(keys.sigKey, 'base64'))
    .update('SP1|' + compact + '|' + expiry).digest().slice(0, 10))
    .match(/.{4}/g).join('-');
  return (master ? 'SPX' : 'SP1') + '-' + expiry + '-' + sig;
}

async function cloudApi(route, init = {}) {
  const res = await fetch(CLOUD_BASE + route, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-admin-token': keys.adminToken || '', ...(init.headers || {}) }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // الخادم محلي فقط
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress || '')) {
    return json(res, 403, { error: 'forbidden' });
  }
  const url = new URL(req.url, 'http://127.0.0.1');

  try {
    if (url.pathname === '/' || url.pathname === '/dashboard.html') {
      const html = fs.readFileSync(path.join(__dirname, 'dashboard.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    if (url.pathname === '/api/config' && req.method === 'GET') {
      return json(res, 200, { contactUrl: keys.contactUrl || '', hasKey: !!keys.sigKey, cloud: CLOUD_BASE });
    }

    if (url.pathname === '/api/keygen' && req.method === 'POST') {
      const { machineId, expiry } = await readBody(req);
      if (!keys.sigKey) return json(res, 500, { error: 'keys.json مفقود' });
      try { return json(res, 200, { code: generateCode(machineId, expiry) }); }
      catch (e) { return json(res, 400, { error: e.message }); }
    }

    if (url.pathname === '/api/cloud/registry' && req.method === 'GET') {
      const r = await cloudApi('/api/registry');
      return json(res, 200, r);
    }

    if (url.pathname === '/api/cloud/toggle' && req.method === 'POST') {
      const body = await readBody(req);
      const r = await cloudApi('/api/registry', { method: 'POST', body: JSON.stringify(body) });
      return json(res, 200, r);
    }

    return json(res, 404, { error: 'not found' });
  } catch (e) {
    return json(res, 500, { error: String(e && e.message || e) });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  لوحة الإدارة تعمل:  http://127.0.0.1:' + PORT);
  console.log('  اترك هذه النافذة مفتوحة أثناء استخدام اللوحة (أغلقها بـ Ctrl+C).');
  console.log('');
});
