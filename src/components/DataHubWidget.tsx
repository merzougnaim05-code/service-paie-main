// مركز المعطيات الموحّد — ودجت عائم عام لأي تطبيق React
// يرفع نسخة كاملة من مفاتيح localStorage المحددة إلى service-data-hub ويحمّلها منه.
// لا استبدال تلقائي أبدًا: التحميل دائمًا بتأكيد المستخدم.
import { useEffect, useState } from 'react';

const HUB_URL = 'https://service-data-hub.merzougnaim05.workers.dev';
const TOKEN_KEY = 'dataHubTokenV1';
const SYNC_KEY = 'dataHubLastSyncV1';

export interface DataHubWidgetProps {
  appKey: string;
  appName: string;
  /** slot → مفتاح localStorage */
  storageKeys: { [slot: string]: string };
  accent?: string;
}

interface HubAppMeta {
  key: string;
  updatedAt: string | null;
  size: number;
  by: string | null;
  hasData: boolean;
}

interface HubPayload {
  version: number;
  keys: { [slot: string]: string | null };
}

function getLS(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function setLS(k: string, v: string | null) {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignore */ }
}
function askToken(): string | null {
  let t = getLS(TOKEN_KEY) || '';
  if (t) return t;
  t = window.prompt('أدخل توكن مركز المعطيات (مرة واحدة لهذا المتصفح):', '') || '';
  if (!t.trim()) return null;
  setLS(TOKEN_KEY, t.trim());
  return t.trim();
}
function markSync(iso: string) { setLS(SYNC_KEY, iso); }
function getLastSync(): string { return getLS(SYNC_KEY) || ''; }

function collectPayload(keys: { [slot: string]: string }): string {
  const out: { [slot: string]: string | null } = {};
  Object.entries(keys).forEach(([slot, k]) => { out[slot] = getLS(k); });
  return JSON.stringify({ version: 1, keys: out });
}

async function pushToHub(appKey: string, appName: string, keys: { [slot: string]: string }): Promise<{ ok: boolean; error?: string; updatedAt?: string }> {
  const token = askToken();
  if (!token) return { ok: false, error: 'لم يُدخل التوكن' };
  try {
    const res = await fetch(`${HUB_URL}/api/data/${appKey}?by=${encodeURIComponent(appName)}`, {
      method: 'PUT',
      headers: { 'X-Hub-Token': token, 'Content-Type': 'application/json' },
      body: collectPayload(keys),
    });
    const j = await res.json();
    if (!j.ok) return { ok: false, error: j.error || 'فشل الرفع' };
    markSync(j.updatedAt);
    return { ok: true, updatedAt: j.updatedAt };
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بمركز المعطيات' };
  }
}

async function pullFromHub(appKey: string, keys: { [slot: string]: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${HUB_URL}/api/data/${appKey}`, { cache: 'no-store' });
    if (res.status === 404) return { ok: false, error: 'لا توجد نسخة على المركز بعد' };
    if (!res.ok) return { ok: false, error: 'فشل الجلب من المركز' };
    const payload: HubPayload = await res.json();
    if (!payload || payload.version !== 1 || typeof payload.keys !== 'object') {
      return { ok: false, error: 'النسخة على المركز بصيغة غير متوافقة' };
    }
    Object.entries(keys).forEach(([slot, k]) => { setLS(k, payload.keys[slot] ?? null); });
    try {
      const apps = await (await fetch(`${HUB_URL}/api/apps`, { cache: 'no-store' })).json();
      const a = (apps.apps || []).find((x: HubAppMeta) => x.key === appKey);
      if (a && a.updatedAt) markSync(a.updatedAt);
    } catch { /* ignore */ }
    location.reload();
    return { ok: true };
  } catch {
    return { ok: false, error: 'تعذّر الاتصال بمركز المعطيات' };
  }
}

async function checkNewer(appKey: string): Promise<HubAppMeta | null> {
  try {
    const j = await (await fetch(`${HUB_URL}/api/apps`, { cache: 'no-store' })).json();
    const a = (j.apps || []).find((x: HubAppMeta) => x.key === appKey);
    if (!a || !a.updatedAt || !a.hasData) return null;
    const mine = getLastSync();
    if (mine && new Date(a.updatedAt) <= new Date(mine)) return null;
    return a;
  } catch {
    return null;
  }
}

export function DataHubWidget({ appKey, appName, storageKeys }: DataHubWidgetProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<'idle' | 'push' | 'pull'>('idle');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [token, setToken] = useState('');
  const [hubUpdate, setHubUpdate] = useState<HubAppMeta | null>(null);

  // فحص النسخة الأحدث عند الإقلاع
  useEffect(() => {
    let alive = true;
    checkNewer(appKey).then(m => { if (alive && m) setHubUpdate(m); }).catch(() => { /* اختياري */ });
    return () => { alive = false; };
  }, [appKey]);

  const handlePush = async () => {
    const t = token.trim() || getLS(TOKEN_KEY) || '';
    if (!t) { setMsg({ text: 'أدخل توكن الرفع أولًا في الأسفل', ok: false }); return; }
    if (token.trim()) setLS(TOKEN_KEY, token.trim());
    setBusy('push'); setMsg(null);
    const r = await pushToHub(appKey, appName, storageKeys);
    setBusy('idle');
    setMsg(r.ok ? { text: `✓ رُفعت المعطيات (${new Date(r.updatedAt!).toLocaleString('ar-DZ')})`, ok: true } : { text: `✗ ${r.error}`, ok: false });
  };

  const handlePull = async () => {
    if (!window.confirm(`استبدال بيانات ${appName} في هذا الجهاز بنسخة المركز؟\n(آخر مزامنة محلية: ${getLastSync() ? new Date(getLastSync()).toLocaleString('ar-DZ') : 'لا توجد'})`)) return;
    setBusy('pull'); setMsg(null);
    const r = await pullFromHub(appKey, storageKeys);
    if (!r.ok) { setBusy('idle'); setMsg({ text: `✗ ${r.error}`, ok: false }); }
    // عند النجاح تعيد الصفحة تحميل نفسها
  };

  const slots = Object.entries(storageKeys);

  return (
    <>
      {/* شارة نسخة أحدث */}
      {hubUpdate && !open && (
        <div className="no-print fixed top-0 inset-x-0 z-[9998] bg-emerald-950 text-white text-xs px-3 py-1.5 flex items-center justify-center gap-2 flex-wrap border-b-2 border-amber-500" dir="rtl">
          <span>☁ توجد نسخة معطيات أحدث لـ {appName} على مركز البوابة ({new Date(hubUpdate.updatedAt!).toLocaleString('ar-DZ')})</span>
          <button onClick={() => { setOpen(true); }} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded-full text-[11px]">فتح مركز المعطيات</button>
          <button onClick={() => setHubUpdate(null)} className="bg-white/15 hover:bg-white/25 font-bold px-2.5 py-0.5 rounded-full text-[11px]">لاحقًا</button>
        </div>
      )}

      {/* الزر العائم */}
      <button
        onClick={() => { setToken(getLS(TOKEN_KEY) || ''); setOpen(true); setMsg(null); }}
        title="مركز المعطيات — رفع وتحميل نسخة البيانات"
        className="no-print fixed bottom-[18px] left-[80px] w-[52px] h-[52px] z-[9999] rounded-2xl grid place-items-center text-slate-900 shadow-lg border-2 border-emerald-600 transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
        style={{ background: 'linear-gradient(145deg,#fbbf24,#f59e0b 55%,#d97706)' }}
        dir="rtl"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      </button>

      {/* اللوحة */}
      {open && (
        <div className="no-print fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }} dir="rtl">
          <div className="bg-white w-full max-w-md rounded-2xl border border-emerald-200 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white border-b-4 border-amber-500 px-4 py-2.5 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
                مركز المعطيات — {appName}
              </h3>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-xs">✕</button>
            </div>
            <div className="p-4 space-y-3 max-h-[55vh] overflow-y-auto">
              <p className="text-[11px] text-slate-500 leading-5">
                الخانات المشمولة بالنسخة: {slots.map(([slot, k]) => <code key={slot} className="bg-slate-100 px-1 rounded text-[10px]" dir="ltr">{k}</code>)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePush}
                  disabled={busy !== 'idle'}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                >
                  {busy === 'push' ? 'جارٍ الرفع…' : '☁ رفع المعطيات إلى المركز'}
                </button>
                <button
                  onClick={handlePull}
                  disabled={busy !== 'idle'}
                  className="flex-1 bg-white hover:bg-blue-50 disabled:opacity-50 text-blue-700 font-bold text-xs px-3 py-2 rounded-xl border border-blue-200 transition-colors"
                >
                  {busy === 'pull' ? 'جارٍ التحميل…' : '⬇ تحميل المعطيات من المركز'}
                </button>
              </div>
              {msg && (
                <div className={`text-xs font-bold px-3 py-2 rounded-xl border ${msg.ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {msg.text}
                </div>
              )}
              <div className="text-[11px] text-slate-400">
                آخر مزامنة محلية: {getLastSync() ? new Date(getLastSync()).toLocaleString('ar-DZ') : 'لا توجد'}
              </div>
            </div>
            <div className="border-t border-dashed border-slate-200 bg-emerald-50/50 px-4 py-3">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-2 flex-wrap" dir="rtl">
                🗄 توكن الرفع (يُحفظ في هذا المتصفح):
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="HUB_TOKEN"
                  className="flex-1 min-w-[140px] border border-slate-300 rounded-lg px-2 py-1 text-xs"
                  dir="ltr"
                />
                <button
                  onClick={() => { if (token.trim()) { setLS(TOKEN_KEY, token.trim()); setMsg({ text: '✓ حُفظ التوكن', ok: true }); } }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1 rounded-lg"
                >
                  حفظ
                </button>
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
