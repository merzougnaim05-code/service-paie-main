import React, { useEffect, useState } from 'react';
import { RefreshCw, Download, Upload, RotateCcw, MonitorSmartphone } from 'lucide-react';

/* =====================================================================
   بطاقة التحديثات والترخيص — داخل الإعدادات:
   - في تطبيق سطح المكتب: فحص التحديث من الموقع + تثبيت ملف تحديث
     + إعادة تشغيل لتطبيق التحديث المعلّق + عرض حالة الترخيص.
   - في المتصفح: زر يفتح تطبيق سطح المكتب لفحص التحديث عبر
     البروتوكول المخصص servicepaie://update
   ===================================================================== */

interface UpdateInfo {
  version: string | null;
  pending: string | null;
  staging: boolean;
}

interface CheckResult {
  available: boolean;
  current: string;
  latest: string;
  notes: string;
  error?: string;
}

export const AppUpdateCard: React.FC = () => {
  const w = window as unknown as {
    desktopUpdate?: {
      info(): Promise<UpdateInfo>;
      check(): Promise<CheckResult>;
      installFile(): Promise<{ ok?: boolean; canceled?: boolean; error?: string }>;
      apply(): Promise<void>;
      onProgress(cb: (p: { phase: string; pct?: number }) => void): void;
    };
  };
  const isDesktop = !!w.desktopUpdate;

  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');

  const refresh = async () => {
    if (w.desktopUpdate) setInfo(await w.desktopUpdate.info());
  };
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (w.desktopUpdate) {
      w.desktopUpdate.onProgress(p => {
        if (p.phase === 'download') setMsg(`جاري التنزيل… ${p.pct ?? 0}%`);
        else if (p.phase === 'staged') setMsg('تم تجهيز التحديث — أعد التشغيل لتطبيقه.');
        else if (p.phase === 'done') setMsg('');
      });
    }
  }, []);

  const check = async () => {
    setBusy('check'); setMsg('جاري التحقق من التحديثات…');
    const r = await w.desktopUpdate!.check();
    setBusy(null);
    setMsg(r.error ? 'تعذّر التحقق: ' + r.error
      : r.available ? `يتوفر إصدار جديد ${r.latest} — تم عرض نافذة التنزيل.`
      : 'أنت تستخدم أحدث إصدار (' + r.current + ') ✓');
    refresh();
  };

  const installFile = async () => {
    setBusy('file'); setMsg('اختر ملف حزمة التحديث (.zip)…');
    const r = await w.desktopUpdate!.installFile();
    setBusy(null);
    if (r.canceled) setMsg('');
    else if (r.error) setMsg('فشل التثبيت: ' + r.error);
    refresh();
  };

  const apply = async () => {
    setBusy('apply');
    await w.desktopUpdate!.apply();
  };

  return (
    <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5">
      <h3 className="text-sm font-bold text-[#047857] mb-3 flex items-center gap-2">
        <MonitorSmartphone className="w-4 h-4" />
        <span>تحديثات تطبيق سطح المكتب والترخيص</span>
      </h3>

      {isDesktop ? (
        <div className="space-y-3">
          <p className="text-xs text-[#64748b] leading-relaxed">
            الإصدار الحالي: <b className="text-[#0f172a]">{info?.version || '…'}</b>
            {info?.pending && (
              <> — التحديث <b className="text-[#047857]">{info.pending}</b> جاهز،
              سيُطبَّق عند إعادة التشغيل.</>
            )}
            {' '}الترخيص سنوي — عند انتهاء المدة يطلب التطبيق كود تفعيل جديد من المطوّر.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button" onClick={check} disabled={!!busy}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={'w-4 h-4' + (busy === 'check' ? ' animate-spin' : '')} />
              <span>التحقق من التحديثات (من الموقع)</span>
            </button>
            <button
              type="button" onClick={installFile} disabled={!!busy}
              className="bg-white hover:bg-slate-50 text-[#0f172a] border border-[#cbd5e1] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>تثبيت تحديث من ملف…</span>
            </button>
            {info?.pending && (
              <button
                type="button" onClick={apply} disabled={busy === 'apply'}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة التشغيل وتطبيق التحديث</span>
              </button>
            )}
          </div>
          {msg && <p className="text-xs font-bold text-[#047857]">{msg}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#64748b] leading-relaxed">
            هذه نسخة الويب. لتحديث تطبيق سطح المكتب: افتح التطبيق ثم
            «مساعدة ← التحقق من التحديثات»، أو اضغط الزر التالي لتشغيل فحص التحديث في التطبيق مباشرة،
            أو ثبّت حزمة تحديث بامتداد zip عبر «ملف ← تثبيت تحديث من ملف».
          </p>
          <a
            href="servicepaie://update"
            className="inline-flex items-center gap-1.5 bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>فحص التحديث في تطبيق سطح المكتب</span>
          </a>
        </div>
      )}
    </div>
  );
};
