/* ============================================================
   مدير الترخيص — تقييم حالة التفعيل وحماية التلاعب بالساعة
   الترخيص سنوي: يعمل التطبيق حتى تاريخ انتهاء ثم يقفل حتى
   إدخال كود تفعيل جديد مرتبط برقم الجهاز.
   ============================================================ */
const path = require('path');
const fs = require('fs');
const { machineIdFrom, readWindowsMachineGuid, verifyActivationCode } = require('./license-core.cjs');

const BUILT_IN_EXPIRY = '20261231'; // انتهاء مدمج لأول تثبيت: نهاية سنة البناء
const CLOUD_BASE = 'https://service-paie.pages.dev';
const CLOCK_TOLERANCE_MS = 3 * 24 * 3600 * 1000; // سماحية ساعة النظام 3 أيام

let licenseFile = null;
let machineId = null;

function init(userDataDir) {
  licenseFile = path.join(userDataDir, 'license.json');
  machineId = machineIdFrom(readWindowsMachineGuid());
}

function getMachineId() { return machineId; }

function readLicense() {
  try { return JSON.parse(fs.readFileSync(licenseFile, 'utf8')); } catch { return {}; }
}

function writeLicense(lic) {
  const tmp = licenseFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(lic, null, 2), 'utf8');
  fs.renameSync(tmp, licenseFile);
}

function expiryMsOf(expiryYYYYMMDD) {
  return Date.UTC(+expiryYYYYMMDD.slice(0, 4), +expiryYYYYMMDD.slice(4, 6) - 1, +expiryYYYYMMDD.slice(6, 8), 23, 59, 59);
}

/* الحالة الكاملة للترخيص — تُستدعى عند كل إقلاع وعند كل تفعيل */
function evaluate() {
  const lic = readLicense();
  const now = Date.now();

  // حماية رجوع ساعة النظام: إذا كانت الساعة أقدم بـ3 أيام من آخر تشغيل → قفل
  if (lic.lastSeen && now < lic.lastSeen - CLOCK_TOLERANCE_MS) {
    return {
      locked: true, reason: 'clock',
      machineId, expiry: lic.expiry || BUILT_IN_EXPIRY,
      title: 'تم اكتشاف تعديل في ساعة النظام',
      message: 'يُرجى ضبط تاريخ وجهاز الحاسوب على التاريخ الحقيقي ثم إعادة تشغيل التطبيق.'
    };
  }

  // تحديث آخر ظهور (يحدَّث مرة كل ساعة على الأكثر)
  if (!lic.lastSeen || now - lic.lastSeen > 3600 * 1000) {
    lic.lastSeen = now;
    try { writeLicense(lic); } catch { /* ignore */ }
  }

  const effectiveExpiry = lic.expiry || BUILT_IN_EXPIRY;
  const expMs = expiryMsOf(effectiveExpiry);

  if (lic.cloudDisabled) {
    return {
      locked: true, reason: 'disabled', machineId, expiry: effectiveExpiry,
      title: 'تم إيقاف هذا التطبيق',
      message: lic.cloudMessage || 'تم إيقاف هذه النسخة من قِبل المطوّر. تواصل معه لإعادة التشغيل.'
    };
  }

  if (now > expMs) {
    return {
      locked: true, reason: 'expired', machineId, expiry: effectiveExpiry,
      title: 'انتهت مدة الترخيص',
      message: `انتهت صلاحية الترخيص بتاريخ ${effectiveExpiry.slice(0, 4)}/${effectiveExpiry.slice(4, 6)}/${effectiveExpiry.slice(6, 8)}.\nيُرجى التواصل مع المطوّر للحصول على كود تفعيل جديد سنوي.`
    };
  }

  const daysLeft = Math.ceil((expMs - now) / 86400000);
  return {
    locked: false, machineId, expiry: effectiveExpiry, daysLeft,
    warnSoon: daysLeft <= 45
  };
}

/* تفعيل بكود — يتحقق ثم يخزّن ثم يبلّغ الخادم (أفضل جهد) */
function activate(code) {
  const res = verifyActivationCode(machineId, code);
  if (!res.ok) return { ok: false, error: res.reason };
  const lic = readLicense();
  lic.machineId = machineId;
  lic.code = String(code || '').trim().toUpperCase();
  lic.expiry = res.expiry;
  lic.activatedAt = new Date().toISOString();
  lic.lastSeen = Date.now();
  lic.cloudDisabled = false; // التفعيل اليدوي يرفع الإيقاف السحابي للمستقبل
  lic.cloudMessage = '';
  try { writeLicense(lic); } catch { /* ignore */ }
  reportActivation(lic.code);
  return { ok: true, expiry: res.expiry, master: !!res.master };
}

/* ===== اتصال بالخادم (اختياري — فشل الاتصال لا يمنع العمل) ===== */
async function fetchWithTimeout(url, opts = {}, ms = 6000) {
  const { net } = require('electron');
  const res = await net.fetch(url, { ...opts, signal: AbortSignal.timeout(ms) });
  const body = await res.text();
  return { status: res.status, body };
}

async function checkCloudStatus() {
  // يقرأ مفتاح الإيقاف عن بعد — لا يغيّر شيئاً عند فشل الاتصال
  try {
    const r = await fetchWithTimeout(`${CLOUD_BASE}/api/status?m=${encodeURIComponent(machineId)}`);
    if (r.status === 200) {
      const data = JSON.parse(r.body);
      const lic = readLicense();
      if (data.enabled === false) {
        lic.cloudDisabled = true;
        lic.cloudMessage = data.message || '';
        lic.cloudCheckedAt = new Date().toISOString();
        writeLicense(lic);
      } else if (data.enabled === true && lic.cloudDisabled) {
        lic.cloudDisabled = false;
        lic.cloudMessage = '';
        lic.cloudCheckedAt = new Date().toISOString();
        writeLicense(lic);
      }
    }
  } catch { /* دون إنترنت — تجاهل */ }
}

async function reportActivation(code) {
  // تسجيل التفعيل في سجل المطوّر (أفضل جهد — يعمل فقط عند توفر الشبكة)
  try {
    await fetchWithTimeout(`${CLOUD_BASE}/api/activate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ machineId, code, version: process.env.SP_VERSION || '' })
    }, 5000);
  } catch { /* ignore */ }
}

module.exports = { init, getMachineId, evaluate, activate, checkCloudStatus, expiryMsOf, BUILT_IN_EXPIRY };
