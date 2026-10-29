/* ============================================================
   مولّد أكواد التفعيل — سطر أوامر
   الاستخدام:
     node admin/keygen.cjs <رقم-الجهاز> [--until 20271231]
     node admin/keygen.cjs *                  -- كود عام يعمل على أي جهاز
   أمثلة:
     node admin/keygen.cjs K7QM-3P2F-9XRD-8WCV --until 20271231
   الافتراضي: صالح حتى نهاية السنة الحالية.
   ============================================================ */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const KEY_FILE = path.join(__dirname, 'keys.json');
if (!fs.existsSync(KEY_FILE)) {
  console.error('خطأ: admin/keys.json غير موجود — أعد توليده أو استعد نسخته الاحتياطية.');
  process.exit(1);
}
const { sigKey } = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
const KEY = Buffer.from(sigKey, 'base64');

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

function generate(machineId, expiry) {
  if (!/^\d{8}$/.test(expiry)) throw new Error('صيغة التاريخ يجب أن تكون YYYYMMDD');
  const master = machineId.trim() === '*';
  const compact = master ? '*' : machineId.replace(/-/g, '').toUpperCase();
  if (!master && !/^[A-Z2-7]{16}$/.test(compact)) {
    throw new Error('رقم الجهاز يجب أن يكون 16 حرفاً بصيغة XXXX-XXXX-XXXX-XXXX');
  }
  const sig = base32(crypto.createHmac('sha256', KEY)
    .update('SP1|' + compact + '|' + expiry).digest().slice(0, 10))
    .match(/.{4}/g).join('-');
  return (master ? 'SPX' : 'SP1') + '-' + expiry + '-' + sig;
}

/* ===== سطر الأوامر ===== */
if (require.main === module) {
  const args = process.argv.slice(2);
  const machine = args[0];
  const untilIdx = args.indexOf('--until');
  const year = new Date().getFullYear();
  const expiry = untilIdx !== -1 && args[untilIdx + 1]
    ? args[untilIdx + 1].replace(/-/g, '')
    : String(year) + '1231';
  if (!machine) {
    console.log('الاستخدام: node admin/keygen.cjs <رقم-الجهاز أو *> [--until YYYYMMDD]');
    process.exit(1);
  }
  try {
    const code = generate(machine, expiry);
    console.log('');
    console.log('  رقم الجهاز : ' + machine);
    console.log('  صالح حتى   : ' + expiry);
    console.log('');
    console.log('  كود التفعيل: ' + code);
    console.log('');
  } catch (e) {
    console.error('خطأ: ' + e.message);
    process.exit(1);
  }
} else {
  module.exports = { generate };
}
