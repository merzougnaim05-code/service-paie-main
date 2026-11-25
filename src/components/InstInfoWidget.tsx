// زر «معطيات المؤسسة» — ودجت عام لأي تطبيق React
// يسحب الهوية الرسمية للمؤسسة من مركز service-info-hub بمفتاح الرقم الميكانوغرافي
// ويطبّقها على مفاتيح localStorage التي يحددها التطبيق (كل مؤسسة بسجلها، لا تداخل).
// التطبيق يدوي بضغطة تأكيد + شارة تلقائية إن وُجد تحديث أحدث على المركز.
import { useEffect, useState } from 'react';

const HUB_URL = 'https://service-info-hub.merzougnaim05.workers.dev';
const LS_MECANO = 'instInfoMecanoV1';
const LS_APPLIED = 'instInfoAppliedAtV1';

export interface InstInfoTarget {
  /** مفتاح localStorage الذي يحوي بيانات التطبيق */
  storageKey: string;
  /** مسار الكائن داخل المفتاح (مثل institution أو settings أو meta) — فارغ = الجذر */
  subPath?: string;
  /** hubField → اسم الحقل في إعدادات التطبيق */
  fields: { [hubField: string]: string };
  /** الحقول الرقمية (يُستخرج منها العدد من سنة مثل 2025/2026) */
  numeric?: string[];
}

interface HubInfo {
  [field: string]: unknown;
  _updatedAt?: string;
}

function getLS(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function setLS(k: string, v: string | null) {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ }
}
function getMecano(): string {
  const m = (getLS(LS_MECANO) || '').trim().toLowerCase().replace(/\s+/g, '-');
  return m;
}
function askMecano(): string | null {
  let m = getMecano();
  if (m) return m;
  m = (window.prompt('أدخل الرقم الميكانوغرافي لمؤسستك (مفتاحها في مركز البوابة):', '') || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (!m) return null;
  setLS(LS_MECANO, m);
  return m;
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

async function fetchInfo(mecano: string): Promise<{ info: HubInfo } | { error: string }> {
  try {
    const res = await fetch(`${HUB_URL}/api/info/${encodeURIComponent(mecano)}`, { cache: 'no-store' });
    const j = await res.json();
    if (!j.ok) return { error: j.error || 'لا يوجد سجل' };
    return { info: j.info as HubInfo };
  } catch {
    return { error: 'تعذّر الاتصال بمركز البوابة' };
  }
}

function applyInfo(targets: InstInfoTarget[], info: HubInfo): string[] {
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
      Object.entries(t.fields).forEach(([hubField, appField]) => {
        const v = info[hubField];
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

export function InstInfoWidget({ appName, targets }: { appName: string; targets: InstInfoTarget[] }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<HubInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [mecanoInput, setMecanoInput] = useState(getMecano());

  // تطبيق صامت تلقائي عند الإقلاع: آخر معطيات من المركز تُكتب مباشرة (طلب صريح من المستخدم)
  useEffect(() => {
    let alive = true;
    const boot = async () => {
      // رقم ميكانوغرافي يمرَّر من البوابة في الرابط (?mecano=...) — يُحفظ ويُطبَّق تلقائياً دون الزر
      try {
        const q = new URLSearchParams(window.location.search).get('mecano');
        if (q) {
          const m = q.trim().toLowerCase().replace(/\s+/g, '-');
          if (/^[a-z0-9._-]{3,32}$/.test(m)) {
            setLS(LS_MECANO, m);
            const u = new URL(window.location.href);
            u.searchParams.delete('mecano');
            window.history.replaceState(null, '', u.pathname + u.search + u.hash);
          }
        }
      } catch { /* تجاهل */ }
      let mecano = getMecano();
      if (!mecano) {
        // تبني آلي: مؤسسة واحدة فقط مسجلة في المركز
        try {
          const j = await (await fetch(HUB_URL + '/api/orgs', { cache: 'no-store' })).json();
          if (j.ok && j.orgs && j.orgs.length === 1) {
            setLS(LS_MECANO, String(j.orgs[0].mecano));
            mecano = getMecano();
          }
        } catch { /* اختياري */ }
      }
      if (!mecano) return;
      const r = await fetchInfo(mecano);
      if (!alive || !('info' in r)) return;
      const hubAt = r.info._updatedAt || '';
      const mine = getLS(LS_APPLIED) || '';
      if (!hubAt || (mine && new Date(hubAt) <= new Date(mine))) return;
      const applied = applyInfo(targets, r.info);
      setLS(LS_APPLIED, hubAt);
      if (applied.length > 0) { location.reload(); return; }
    };
    boot();
    return () => { alive = false; };
  }, []);

  const doFetch = async (mecanoArg?: string) => {
    const mecano = mecanoArg || mecanoInput.trim() || getMecano();
    if (!mecano) { setMsg({ text: 'أدخل الرقم الميكانوغرافي أولًا', ok: false }); return; }
    if (!mecanoArg && mecanoInput.trim()) setLS(LS_MECANO, mecanoInput.trim().toLowerCase().replace(/\s+/g, '-'));
    setBusy(true); setMsg(null);
    const r = await fetchInfo(mecano);
    setBusy(false);
    if ('error' in r) { setMsg({ text: `✗ ${r.error}`, ok: false }); return; }
    setInfo(r.info);
    setMsg({ text: `✓ جُلبت معطيات المؤسسة${r.info.institution ? ` (${r.info.institution})` : ''} — اضغط «تطبيق» للكتابة في ${appName}`, ok: true });
  };

  const doApply = async (infoToApply: HubInfo) => {
    setBusy(true);
    const applied = applyInfo(targets, infoToApply);
    setLS(LS_APPLIED, infoToApply._updatedAt || new Date().toISOString());
    setBusy(false);
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

  return (
    <>
      {/* الزر العائم */}
      <button
        onClick={() => { setMecanoInput(getMecano()); setOpen(true); setMsg(null); }}
        title="معطيات المؤسسة الرسمية من مركز البوابة"
        className="no-print fixed bottom-[18px] left-[140px] w-[52px] h-[52px] z-[9999] rounded-2xl grid place-items-center text-white shadow-lg border-2 border-amber-400 transition-transform hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(145deg,#065f46,#047857 55%,#134e4a)' }}
        dir="rtl"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
        </svg>
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
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">الرقم الميكانوغرافي:</label>
                <input
                  type="text"
                  value={mecanoInput}
                  onChange={(e) => setMecanoInput(e.target.value)}
                  placeholder="مفتاح المؤسسة في المركز"
                  className="flex-1 min-w-0 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold"
                  dir="ltr"
                />
                <button
                  onClick={() => doFetch()}
                  disabled={busy}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap"
                >
                  {busy ? 'جارٍ الجلب…' : 'جلب من المركز'}
                </button>
              </div>
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
                  disabled={busy}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm px-3 py-2 rounded-xl transition-colors"
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
                المعطيات تُدار من زر «معطيات المؤسسة» في البوابة، وكل مؤسسة بسجلها حسب الرقم الميكانوغرافي — لا تداخل بين المؤسسات.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
