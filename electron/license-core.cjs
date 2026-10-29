/* ============================================================
   نواة الترخيص — مشتركة بين تطبيق سطح المكتب وأداة الإدارة
   - بصمة جهاز ثابتة (MachineGuid من ويندوز أو بدائل)
   - أكواد تفعيل موقّعة HMAC-SHA256 مرتبطة بالجهاز والتاريخ
   - مفتاح التوقيع نفسه لدى الطرفين (يُولَّد مرة واحدة في keys.json)
   ============================================================ */
const crypto = require('crypto');

/* مفتاح التوقيع — سر المطور. لا يُشارك ولا يُنشر في مستودع عام مع المفتاح الخاص بأداة الإدارة */
const SIG_KEY_B64 = '/lDBKzr52u3ibNu0xUAhnxQBPyUHtqRF7a+2dm0dFA4=';
const KEY = Buffer.from(SIG_KEY_B64, 'base64');

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

/* بصمة الجهاز: 16 حرفاً Base32 مثل K7QM-3P2F-9XRD-8WCV */
function machineIdFrom(guidLike) {
  const h = crypto.createHash('sha256').update('sp-fp|' + guidLike).digest();
  const raw = base32(h.slice(0, 10)); // 16 حرفاً
  return raw.match(/.{4}/g).join('-');
}

function readWindowsMachineGuid() {
  try {
    const { execSync } = require('child_process');
    const out = execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
      { encoding: 'utf8', timeout: 5000 }
    );
    const m = out.match(/REG_SZ\s+(\S+)/);
    if (m) return 'guid:' + m[1];
  } catch { /* بيئة غير ويندوز */ }
  const os = require('os');
  return 'fallback:' + os.hostname() + '|' + os.userInfo().username;
}

/* توقيع كود تفعيل: يُربط برقم الجهاز (أو "*" لكود عام) وتاريخ انتهاء */
function signCode(machineCompact, expiryYYYYMMDD) {
  const mac = crypto.createHmac('sha256', KEY)
    .update('SP1|' + machineCompact + '|' + expiryYYYYMMDD)
    .digest();
  const sig = base32(mac.slice(0, 10)); // 16 حرفاً
  return sig.match(/.{4}/g).join('-');
}

/* كود كامل جاهز للمستخدم: SP1-20271231-XXXX-XXXX-XXXX-XXXX (كود جهاز)
   أو SPX-20271231-XXXX-XXXX-XXXX-XXXX (كود عام يعمل على أي جهاز) */
function generateActivationCode(machineId, expiryYYYYMMDD) {
  if (!/^\d{8}$/.test(expiryYYYYMMDD)) throw new Error('صيغة التاريخ يجب أن تكون YYYYMMDD');
  const d = Number(expiryYYYYMMDD.slice(0, 4)) * 10000
    + Number(expiryYYYYMMDD.slice(4, 6)) * 100
    + Number(expiryYYYYMMDD.slice(6, 8));
  if (d < 20260101 || d > 20991231) throw new Error('التاريخ خارج المدى المسموح');
  const master = machineId === '*';
  const sig = signCode(master ? '*' : machineId.replace(/-/g, ''), expiryYYYYMMDD);
  return (master ? 'SPX' : 'SP1') + '-' + expiryYYYYMMDD + '-' + sig;
}

function verifyActivationCode(machineId, code) {
  const norm = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
  const m = norm.match(/^(SP[1X])-(\d{8})-([A-Z2-7]{4}(?:-?[A-Z2-7]{4}){3})$/);
  if (!m) return { ok: false, reason: 'صيغة الكود غير صحيحة' };
  const [, prefix, expiry, sigRaw] = m;
  const sig = sigRaw.replace(/-/g, '');
  const y = +expiry.slice(0, 4), mo = +expiry.slice(4, 6), d = +expiry.slice(6, 8);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return { ok: false, reason: 'تاريخ غير صالح' };
  const expiryMs = Date.UTC(y, mo - 1, d, 23, 59, 59);
  const compact = machineId.replace(/-/g, '');
  // كود جهاز خاص
  const sigMachine = base32(crypto.createHmac('sha256', KEY)
    .update('SP1|' + compact + '|' + expiry).digest().slice(0, 10));
  let master = false;
  if (sig === sigMachine && prefix === 'SP1') {
    // مطابقة كود الجهاز
  } else {
    const sigMaster = base32(crypto.createHmac('sha256', KEY)
      .update('SP1|*|' + expiry).digest().slice(0, 10));
    if (sig === sigMaster && prefix === 'SPX') master = true;
    else return { ok: false, reason: 'الكود غير صالح لهذا الجهاز' };
  }
  return { ok: true, expiryMs, expiry, master };
}

module.exports = {
  machineIdFrom,
  readWindowsMachineGuid,
  generateActivationCode,
  verifyActivationCode
};
