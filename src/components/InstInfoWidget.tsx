// زر «معطيات المؤسسة» — ودجت عام لأي تطبيق React
// يستقبل الهوية الرسمية للمؤسسة من البوابة عبر جزء الرابط (#inst=...) عند الفتح،
// يحفظها في localStorage هذا المتصفح فقط، ويطبّقها على مفاتيح localStorage التي
// يحددها التطبيق. لا يوجد أي اتصال بخادم: لا نشر ولا جلب ولا مزامنة مركزية،
// فلا تظهر معطيات أي مستخدم لمستخدم آخر.
// رابط البوابة (?mecano=...) يبقى يُحفظ محلياً كما كان.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const LS_INFO = 'instInfoV1';
const LS_MECANO = 'instInfoMecanoV1';
const LS_UPDATED = 'instInfoUpdatedAtV1';
const LS_APPLIED = 'instInfoAppliedAtV1';

export interface InstInfoTarget {
  /** مفتاح localStorage الذي يحوي بيانات التطبيق */
  storageKey: string;
  /** مسار الكائن داخل المفتاح (مثل institution أو settings أو meta) — فارغ = الجذر */
  subPath?: string;
  /** infoField → اسم الحقل في إعدادات التطبيق */
  fields: { [infoField: string]: string };
  /** الحقول الرقمية (يُستخرج منها العدد من سنة مثل 2025/2026) */
  numeric?: string[];
}

interface StoredInfo {
  [field: string]: unknown;
}

function getLS(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function setLS(k: string, v: string | null) {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ }
}
function normalizeMecano(v: unknown): string {
  return String(v ?? '').trim().toLowerCase().replace(/\s+/g, '-');
}

// فكّ حمولة البوابة في جزء الرابط (#inst=<base64url>) — بيانات مشفّرة بصرياً فقط
// (base64url ل JSON UTF-8) تبقى داخل متصفح المستخدم ولا تمرّ بأي خادم.
function readHashPayload(): { info: StoredInfo; updatedAt: string } | null {
  try {
    const hash = window.location.hash || '';
    if (!hash) return null;
    const payload = new URLSearchParams(hash.replace(/^#/, '')).get('inst');
    if (!payload) return null;
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const parsed: unknown = JSON.parse(new TextDecoder('utf-8').decode(bytes));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const info = (parsed as Record<string, unknown>).info;
    if (!info || typeof info !== 'object' || Array.isArray(info)) return null;
    const updatedAt = (parsed as Record<string, unknown>).updatedAt;
    return { info: info as StoredInfo, updatedAt: typeof updatedAt === 'string' ? updatedAt : '' };
  } catch { return null; }
}

// المعطيات المحفوظة محلياً في هذا المتصفح (مصدرها البوابة عبر رابط الفتح)
function loadStoredInfo(): { info: StoredInfo; updatedAt: string } | null {
  try {
    const raw = getLS(LS_INFO);
    if (!raw) return null;
    const info: unknown = JSON.parse(raw);
    if (!info || typeof info !== 'object' || Array.isArray(info)) return null;
    return { info: info as StoredInfo, updatedAt: getLS(LS_UPDATED) || '' };
  } catch { return null; }
}

function getContainer(obj: Record<string, unknown>, subPath?: string): Record<string, unknown> | null {
  if (!subPath) return obj;
  let cur: unknown = obj;
  for (const part of subPath.split('.')) {
    if (!cur || typeof cur !== 'object') return null;
    cur = (cur as Record<string, unknown>)[part];
  }
  if (!cur || typeof cur !== 'object' || Array.isArray(cur)) return null;
  return cur as Record<string, unknown>;
}

// مثل getContainer لكنه ينشئ المسار إن غاب (لمفتاح جديد لم يُحفظ بعد)
function ensureContainer(obj: Record<string, unknown>, subPath?: string): Record<string, unknown> | null {
  if (!subPath) return obj;
  let cur: Record<string, unknown> = obj;
  for (const part of subPath.split('.')) {
    const next = cur[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      const fresh: Record<string, unknown> = {};
      cur[part] = fresh;
      cur = fresh;
    } else {
      cur = next as Record<string, unknown>;
    }
  }
  return cur;
}

function applyInfo(targets: InstInfoTarget[], info: StoredInfo): string[] {
  const applied: string[] = [];
  for (const t of targets) {
    // مفتاح جديد: أنشئ الكائن ومسار الحاوية من الصفر حتى تُطبَّق المعطيات دون انتظار أول حفظ
    let obj: Record<string, unknown>;
    const raw = getLS(t.storageKey);
    if (!raw) {
      obj = {};
    } else {
      try {
        obj = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        continue;
      }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue;
    }
    try {
      const container = ensureContainer(obj, t.subPath);
      if (!container) continue;
      Object.entries(t.fields).forEach(([infoField, appField]) => {
        const v = info[infoField];
        if (v === undefined || v === null || String(v).trim() === '') return;
        if (t.numeric && t.numeric.indexOf(appField) !== -1) {
          const n = parseInt(String(v), 10);
          if (!isNaN(n)) container[appField] = n;
        } else {
          container[appField] = String(v);
        }
        applied.push(appField);
      });
      setLS(t.storageKey, JSON.stringify(obj));
    } catch { /* تجاهل مفتاحًا تالفًا */ }
  }
  return applied;
}

export function InstInfoWidget({ appName, targets, placement = 'floating' }: { appName: string; targets: InstInfoTarget[]; placement?: 'floating' | 'topbar' }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<StoredInfo | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // أيقونة المبنى — مشتركة بين الزر العائم وزر الشريط العلوي
  const buildingIcon = (cls: string) => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
  );

  // تطبيق صامت تلقائي عند الإقلاع: معطيات البوابة الواصلة عبر الرابط أو المحفوظة
  // محلياً تُكتب مباشرة في مفاتيح التطبيق (طلب صريح من المستخدم) — دون أي شبكة
  useEffect(() => {
    const boot = () => {
      // رقم ميكانوغرافي يمرَّر من البوابة في الرابط (?mecano=...) — يُحفظ محلياً ويُنظَّف الرابط
      try {
        const q = new URLSearchParams(window.location.search).get('mecano');
        if (q) {
          const m = normalizeMecano(q);
          if (/^[a-z0-9._-]{3,32}$/.test(m)) {
            setLS(LS_MECANO, m);
            const u = new URL(window.location.href);
            u.searchParams.delete('mecano');
            window.history.replaceState(null, '', u.pathname + u.search + u.hash);
          }
        }
      } catch { /* تجاهل */ }
      // حمولة البوابة في جزء الرابط (#inst=...) — تُحفظ محلياً ثم يُزال الجزء من شريط العنوان
      const hp = readHashPayload();
      if (hp) {
        setLS(LS_INFO, JSON.stringify(hp.info));
        const m = normalizeMecano(hp.info.mecano);
        if (m) setLS(LS_MECANO, m);
        setLS(LS_UPDATED, hp.updatedAt || new Date().toISOString());
        try {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch { /* تجاهل */ }
      }
      // تطبيق المعطيات المحفوظة محلياً إن كانت أحدث مما طُبّق سابقاً
      const stored = loadStoredInfo();
      if (!stored) return;
      const updatedAt = stored.updatedAt;
      const mine = getLS(LS_APPLIED) || '';
      if (updatedAt && mine && new Date(updatedAt) <= new Date(mine)) return;
      const applied = applyInfo(targets, stored.info);
      setLS(LS_APPLIED, updatedAt || new Date().toISOString());
      if (applied.length > 0) { location.reload(); return; }
    };
    boot();
  }, []);

  const doApply = (infoToApply: StoredInfo) => {
    const applied = applyInfo(targets, infoToApply);
    setLS(LS_APPLIED, getLS(LS_UPDATED) || new Date().toISOString());
    setMsg({ text: `✓ طُبّقت الحقول على ${appName}: ${applied.length ? applied.join('، ') : 'لا حقول مطابقة'}`, ok: true });
    setTimeout(() => location.reload(), 800);
  };

  const fields: [string, string][] = [
    ['institution', 'اسم المؤسسة'],
    ['wilaya', 'الولاية'],
    ['direction', 'المديرية'],
    ['daira', 'الدائرة'],
    ['commune', 'البلدية'],
    ['mecano', 'الرقم الميكانوغرافي'],
    ['account', 'رقم الحساب'],
    ['ordonnateurCode', 'رمز الآمر بالصرف'],
    ['academicYear', 'السنة الدراسية/المالية'],
  ];

  const openPanel = () => {
    const stored = loadStoredInfo();
    setInfo(stored ? stored.info : null);
    setOpen(true);
    setMsg(null);
  };

  return (
    <>
      {/* الزر في الشريط العلوي (paie) + زر عائم بتسمية «معطيات المؤسسة» في كل الحالات */}
      {placement === 'topbar' && (
        <button
          onClick={openPanel}
          title="معطيات المؤسسة الرسمية — محفوظة محلياً في هذا المتصفح"
          className="no-print inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow border-2 border-amber-400 transition-transform hover:-translate-y-0.5 shrink-0"
          style={{ background: 'linear-gradient(145deg,#065f46,#047857 55%,#134e4a)' }}
          dir="rtl"
        >
          {buildingIcon('w-4 h-4 text-amber-300 shrink-0')}
          <span className="whitespace-nowrap">معطيات المؤسسة</span>
        </button>
      )}
      {/* الزر العائم واللوحة عبر بوابة إلى body: الترويسة اللاصقة فيها backdrop-filter
          فيجعل أي عنصر fixed داخلها يتموضع نسبةً إليها لا إلى الشاشة (الزر يظهر أعلى
          الصفحة واللوحة تُقطع) — البوابة تحررهما منها */}
      {createPortal(
        <>
      <button
        onClick={openPanel}
        title="معطيات المؤسسة الرسمية — محفوظة محلياً في هذا المتصفح"
        className="no-print fixed bottom-[18px] left-[140px] h-[52px] z-[9999] rounded-2xl grid place-items-center text-white shadow-lg border-2 border-amber-400 transition-transform hover:-translate-y-0.5 px-3"
        style={{ background: 'linear-gradient(145deg,#065f46,#047857 55%,#134e4a)' }}
        dir="rtl"
      >
        <span className="flex items-center gap-2 text-[13px] font-black whitespace-nowrap">
          {buildingIcon('w-6 h-6 text-amber-300')}
          معطيات المؤسسة
        </span>
      </button>

      {/* اللوحة */}
      {open && (
        <div className="no-print fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} dir="rtl">
          <div className="bg-white w-full max-w-md rounded-2xl border border-emerald-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white border-b-4 border-amber-500 px-4 py-2.5 flex items-center justify-between">
              <h3 className="font-bold text-sm">🏛 معطيات المؤسسة — {appName}</h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-xs">✕</button>
            </div>
            <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
              {!info && (
                <div className="text-xs font-bold px-3 py-2 rounded-xl border bg-rose-50 text-rose-700 border-rose-200">
                  لا توجد معطيات محفوظة في هذا المتصفح — افتح هذا التطبيق من البوابة بعد حفظ معطيات المؤسسة فيها
                </div>
              )}
              {info && (
                <div className="border border-slate-200 rounded-xl p-3 space-y-1.5 bg-slate-50">
                  {fields.map(([k, label]) => (
                    <div key={k} className="flex justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 font-bold whitespace-nowrap">{label}:</span>
                      <span className="text-slate-800 font-bold break-all text-left">{String(info[k] ?? '—') || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
              {info && (
                <button
                  onClick={() => doApply(info)}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm px-3 py-2 rounded-xl transition-colors"
                >
                  تطبيق هذه المعطيات على {appName}
                </button>
              )}
              {msg && (
                <div className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {msg.text}
                </div>
              )}
              <p className="text-[10px] text-slate-400 leading-5">
                المعطيات تصل من البوابة عبر رابط الفتح وتُحفظ في هذا المتصفح فقط — لا تُرفع إلى أي خادم ولا تظهر لمستخدمين آخرين.
              </p>
            </div>
          </div>
        </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
