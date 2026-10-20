import React, { useRef, useState } from 'react';
import {
  Users,
  FileSpreadsheet,
  FileText,
  Settings as SettingsIcon,
  ChevronDown,
  Menu,
  X,
  Scroll,
  Award,
  Monitor,
  Smartphone,
  DoorOpen,
  LayoutDashboard,
  Database,
  ShieldCheck,
  ClipboardList,
  Download,
  Upload
} from 'lucide-react';

/** بوابة التطبيقات المدرسية — لوحة التحكم المركزية */
const PORTAL_URL = 'https://service-intendance.pages.dev';

/** مفاتيح بيانات النظام في التخزين المحلي (الموظفون + الإعدادات) */
const DATA_KEYS = ['dz_payroll_employees_v3', 'dz_payroll_settings_v3', 'dz_payroll_last_modified_v3'];

interface NavbarProps {
  activeTab: string;
  activeDoc: string;
  deviceMode?: 'desktop' | 'mobile';
  onSelectDeviceMode?: (mode: 'desktop' | 'mobile') => void;
  onSelectTab: (tab: string) => void;
  onSelectDoc: (doc: string) => void;
  institutionName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  activeDoc,
  deviceMode = 'desktop',
  onSelectDeviceMode,
  onSelectTab,
  onSelectDoc,
  institutionName
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    setDropdownOpen(false);
  };

  const handleDocClick = (doc: string) => {
    onSelectDoc(doc);
    setDropdownOpen(false);
  };

  const handleDeviceToggle = () => {
    if (onSelectDeviceMode) {
      onSelectDeviceMode(deviceMode === 'mobile' ? 'desktop' : 'mobile');
    }
  };

  const importInputRef = useRef<HTMLInputElement>(null);

  /** تصدير كل بيانات النظام (الموظفون + الإعدادات) إلى ملف JSON */
  const handleExportData = () => {
    const data: Record<string, unknown> = {
      _app: 'service-paie',
      _exported: new Date().toISOString()
    };
    DATA_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) data[k] = v;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-paie-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** استيراد ملف بيانات: استبدال المحتوى الحالي وإعادة التحميل */
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        if (!obj['dz_payroll_employees_v3']) {
          throw new Error('missing employees');
        }
        DATA_KEYS.forEach(k => {
          if (k in obj) {
            const v = typeof obj[k] === 'string' ? obj[k] : JSON.stringify(obj[k]);
            localStorage.setItem(k, v);
          }
        });
        window.location.reload();
      } catch (err) {
        alert('الملف غير صالح — تأكد أنه ملف تصدير صادر من هذا التطبيق (service-paie).');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const tabs: { id: string; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'landing',
      label: 'بوابة الدخول والشاشة الرئيسية',
      icon: <DoorOpen className="w-4 h-4 text-amber-400" />,
      desc: 'الإحصائيات العامة والدمغة الرسمية'
    },
    {
      id: 'employees',
      label: 'سجل الموظفين وإدخال البيانات',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      desc: 'إضافة وتعديل الموظفين والبحث'
    },
    {
      id: 'payslip',
      label: 'كشف الراتب الفردي (نموذج 3)',
      icon: <FileText className="w-4 h-4 text-sky-300" />,
      desc: 'إصدار كشف الراتب الرسمي لأي موظف'
    },
    {
      id: 'payrollTables',
      label: 'طلائح الرواتب (3 أسلاك)',
      icon: <FileSpreadsheet className="w-4 h-4 text-orange-300" />,
      desc: 'جداول الرواتب الشهرية حسب الأسلاك'
    },
    {
      id: 'pension',
      label: 'وثائق التقاعد الرسمية (CNR)',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      desc: 'شهادة الأجور وجهها الاثنان + 60 شهراً'
    },
    {
      id: 'cnr-annex',
      label: 'وثائق CNR الملحقة (4 وثائق طبق الأصل)',
      icon: <FileText className="w-4 h-4 text-amber-300" />,
      desc: 'استنفاء الاشتراكات + توقيف المنح + المدة المأجورة + شهادة عمل'
    },
    {
      id: 'datahub',
      label: 'مركز الجداول والمعطيات (النقاط والمنح)',
      icon: <Database className="w-4 h-4 text-amber-400" />,
      desc: 'جداول النقاط والمنح — تسري على كل الوثائق'
    },
    {
      id: 'docs',
      label: 'الوثائق الإدارية والضمان الاجتماعي',
      icon: <Scroll className="w-4 h-4 text-teal-300" />,
      desc: 'ATS واستئناف العمل والشهادات الإدارية'
    },
    {
      id: 'settings',
      label: 'إعدادات المؤسسة والنظام',
      icon: <SettingsIcon className="w-4 h-4 text-slate-300" />,
      desc: 'بيانات المؤسسة والنقطة الاستدلالية'
    }
  ];

  const docItems: { id: string; label: string; tag?: string; tagColor?: string }[] = [
    { id: 'cert_recto', label: 'ATS Recto (الوجه الأول)', tag: 'CNAS', tagColor: 'text-emerald-300' },
    { id: 'cert_verso', label: 'ATS Verso (الوجه الثاني)', tag: 'CNAS', tagColor: 'text-emerald-300' },
    { id: 'res', label: 'استئناف العمل (AS-09)', tag: 'DRT', tagColor: 'text-sky-300' },
    { id: 'form', label: 'استمارة الموظف السنوية' },
    { id: 'req', label: 'طلب وثائق الملف الإداري' },
    { id: 'nr', label: 'شهادة عدم تقاضي المنح العائلية' },
    { id: 'salary_disclosure', label: 'استمارة كشف المرتبات (منحة دراسية)' },
    { id: 'fam_withdraw', label: 'جدول سحب المنح العائلية' },
    { id: 'fam_insert', label: 'جدول التكفل بالمنح العائلية (ادراج)' },
    { id: 'expl_letter', label: 'رسالة توضيحية (36 شهرا)' },
    { id: 'mut_cert', label: 'التعاضدية الوطنية لعمال التربية والثقافة' },
    { id: 'munatec', label: '1 — شهادة استنفاء الاشتراكات', tag: 'MUNATEC', tagColor: 'text-amber-300' },
    { id: 'af_stop', label: '2 — شهادة توقيف الدفع للمنح العائلية', tag: 'CNR', tagColor: 'text-amber-300' },
    { id: 'periodes', label: '3 — المدة المأجورة (جدول السنوات)', tag: 'CNR', tagColor: 'text-amber-300' },
    { id: 'attestation_travail', label: '4 — شهادة عمل Attestation', tag: 'CNR', tagColor: 'text-amber-300' }
  ];

  const dayButtons: { ar: string; tag: string; icon: React.ReactNode; active: boolean; go: () => void }[] = [
    { ar: 'سجل الموظفين', tag: 'سجل', icon: <FileText className="w-3.5 h-3.5" />, active: activeTab === 'employees', go: () => handleTabClick('employees') },
    { ar: 'كشف الراتب', tag: 'كشف', icon: <FileText className="w-3.5 h-3.5" />, active: activeTab === 'payslip', go: () => handleTabClick('payslip') },
    { ar: 'طلائح الرواتب', tag: 'طلائح', icon: <FileSpreadsheet className="w-3.5 h-3.5" />, active: activeTab === 'payrollTables', go: () => handleTabClick('payrollTables') },
    { ar: 'التوقف عن العمل', tag: 'ATS', icon: <ShieldCheck className="w-3.5 h-3.5" />, active: activeTab === 'docs' && activeDoc === 'ats-front', go: () => handleDocClick('cert_recto') },
    { ar: 'استئناف العمل', tag: 'DRT', icon: <ShieldCheck className="w-3.5 h-3.5" />, active: activeTab === 'docs' && activeDoc === 'drt', go: () => handleDocClick('res') },
    { ar: 'وثائق التقاعد', tag: 'CNR', icon: <Award className="w-3.5 h-3.5" />, active: activeTab === 'pension', go: () => handleTabClick('pension') },
    { ar: 'استمارات CNR', tag: 'فرم', icon: <FileText className="w-3.5 h-3.5" />, active: activeTab === 'cnr-annex', go: () => handleTabClick('cnr-annex') },
    { ar: 'متابعة المنح العائلية', tag: 'المنح', icon: <Users className="w-3.5 h-3.5" />, active: activeTab === 'familyfollow', go: () => handleTabClick('familyfollow') },
    { ar: 'استمارات', tag: 'سنوية', icon: <ClipboardList className="w-3.5 h-3.5" />, active: activeTab === 'docs' && activeDoc === 'form', go: () => handleDocClick('form') }
  ];

  return (
    <header
      className="sticky top-0 z-50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white border-b-4 border-amber-500 shadow-xl backdrop-blur-md transition-all duration-200"
      dir="rtl"
    >
      <style>{`
        .dz-sphere-wrap { width: 30px; height: 30px; perspective: 420px; }
        .dz-sphere { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; animation: dz-spin 6s linear infinite; }
        @keyframes dz-spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        .dz-face {
          position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
          backface-visibility: hidden; -webkit-backface-visibility: hidden; background: #fff;
          box-shadow: inset -4px -6px 10px rgba(0,0,0,.35), inset 3px 4px 6px rgba(255,255,255,.5), 0 2px 6px rgba(0,0,0,.45);
        }
        .dz-face-back { transform: rotateY(180deg); }
        .dz-half-green { position: absolute; inset: 0; background: linear-gradient(90deg, #006233 0%, #006233 50%, #ffffff 50%, #ffffff 100%); }
        .dz-star { position: relative; z-index: 2; color: #d21034; font-size: 11px; font-weight: 900; line-height: 1; }
        .dz-gloss {
          position: absolute; inset: 0; border-radius: 50%; z-index: 3; pointer-events: none;
          background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.85), rgba(255,255,255,.12) 42%, rgba(0,0,0,.18) 78%, rgba(0,0,0,.38) 100%);
        }
        @media (prefers-reduced-motion: reduce) { .dz-sphere { animation: none; } }

        /* بتصميم أزرار مفتوحة قليلاً — عربية فوق واختصار الوثيقة تحت — ذهبية عند التحويم أو الاختيار */
        .dailydoc-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 11px; border-radius: 12px; cursor: pointer; white-space: nowrap;
          background: #0f231d; border: 1px solid #2c4a40;
          color: #cfe9df; transition: all .15s ease; flex-shrink: 0;
        }
        .dailydoc-btn .ic { color: #f2d488; line-height: 0; transition: color .15s ease; }
        .dailydoc-btn .ar { display: block; font-size: 12px; font-weight: 700; line-height: 1.4; }
        .dailydoc-btn .tag {
          display: block; font-size: 10px; font-weight: 700; line-height: 1.3;
          letter-spacing: .05em; color: rgba(242,212,136,.85);
        }
        .dailydoc-btn:hover { background: #d4a537; border-color: #e7c05a; color: #1c1505; }
        .dailydoc-btn:hover .ic { color: #1c1505; }
        .dailydoc-btn:hover .tag { color: rgba(28,21,5,.8); }
        .dailydoc-btn.active { background: #d4a537; color: #1c1505; border-color: #e7c05a; }
        .dailydoc-btn.active .ic { color: #1c1505; }
        .dailydoc-btn.active .ar { font-weight: 800; }
        .dailydoc-btn.active .tag { color: rgba(28,21,5,.8); }

        .minibtn {
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          padding: 6px 9px; border-radius: 10px; cursor: pointer;
          background: #0f231d; border: 1px solid #2c4a40; color: #cfe9df;
        }
        .minibtn:hover { background: #153028; border-color: rgba(212,165,55,.55); color: #e8f5f0; }
      `}</style>

      {/* ===== 1) شريط الجمهورية ===== */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-b border-amber-500/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 text-[11px] sm:text-xs text-emerald-100">
            <span className="whitespace-nowrap font-bold text-amber-300">الجمهورية الجزائرية الديمقراطية الشعبية</span>
            <span className="text-emerald-500 shrink-0">•</span>
            <span className="whitespace-nowrap hidden sm:inline">وزارة التربية الوطنية</span>
            <span className="text-emerald-500 shrink-0 hidden sm:inline">•</span>
            <span className="truncate opacity-80 hidden md:inline">{institutionName}</span>
          </div>
          {/* أدوات ثابتة في نهاية شريط الجمهورية */}
          <div className="shrink-0 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportData}
            className="minibtn"
            title="تصدير البيانات — نسخة احتياطية (Sauvegarde des données)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current && importInputRef.current.click()}
            className="minibtn"
            title="استيراد البيانات من ملف نسخة احتياطية (Restauration des données)"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportData}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={handleDeviceToggle}
            className={`minibtn ${deviceMode === 'mobile' ? '!bg-amber-400 !text-slate-950 !border-amber-300' : ''}`}
            title={deviceMode === 'mobile' ? 'التبديل إلى وضع الكمبيوتر' : 'التبديل إلى وضع الهاتف'}
          >
            {deviceMode === 'mobile' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="minibtn"
            title="القائمة الكاملة — أقسام النظام والوثائق"
          >
            {dropdownOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <a
            href={PORTAL_URL}
            className="minibtn hidden sm:inline-flex"
            title="العودة إلى لوحة التحكم (بوابة التطبيقات المدرسية)"
          >
            <LayoutDashboard className="w-4 h-4" />
          </a>

          {/* العلم الوطني */}
          <div className="dz-sphere-wrap shrink-0 hidden sm:block" title="الجمهورية الجزائرية الديمقراطية الشعبية">
            <div className="dz-sphere">
              <div className="dz-face">
                <span className="dz-half-green" />
                <span className="dz-star">★</span>
                <span className="dz-gloss" />
              </div>
              <div className="dz-face dz-face-back">
                <span className="dz-half-green" />
                <span className="dz-star">★</span>
                <span className="dz-gloss" />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ===== 2) شريط الأزرار — تحت شريط الجمهورية ===== */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-[11px] sm:text-xs font-black text-amber-300 whitespace-nowrap shrink-0 flex items-center gap-1.5">
            <span className="text-sm">★</span> وثائق يومية:
          </span>
          {dayButtons.map(b => (
            <button
              key={b.tag + b.ar}
              type="button"
              onClick={b.go}
              className={`dailydoc-btn ${b.active ? 'active' : ''}`}
              title={b.ar}
            >
              <span className="ic">{b.icon}</span>
              <span>
                <span className="ar">{b.ar}</span>
                <span className="tag">{b.tag}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* القائمة الكاملة — تفتح من زر القائمة في شريط الجمهورية */}
      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-3 left-3 sm:left-auto sm:w-96 top-full mt-2 bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[420px] overflow-y-auto">
            <div className="text-[11px] font-bold text-amber-400 px-3 py-1.5 border-b border-slate-800 mb-1 flex items-center justify-between">
              <span>الانتقال السريع بين أقسام النظام:</span>
              <span className="text-[10px] text-slate-400">{tabs.length} أقسام</span>
            </div>
            <div className="space-y-1">
              {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full text-right p-2.5 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'hover:bg-emerald-950 text-slate-200'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-slate-950/20' : 'bg-slate-800'}`}>
                      {tab.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm font-bold ${isActive ? 'text-slate-950' : 'text-white'}`}>
                        {tab.label}
                      </div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                        {tab.desc}
                      </div>
                    </div>
                    {isActive && (
                      <span className="bg-slate-950 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        النشط
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* الوثائق الإدارية السريعة */}
            <div className="pt-2 mt-2 border-t border-slate-800">
              <div className="text-[11px] font-bold text-amber-400 px-3 py-1.5 flex items-center justify-between">
                <span>وثائق إدارية سريعة:</span>
                {activeDoc && activeTab === 'docs' && (
                  <span className="text-[10px] text-slate-400">اختيار مباشر</span>
                )}
              </div>
              {docItems.map(doc => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleDocClick(doc.id)}
                  className="w-full text-right px-3 py-1.5 rounded-lg text-xs sm:text-[13px] text-slate-200 hover:bg-emerald-950 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>{doc.label}</span>
                  {doc.tag && (
                    <span className={`text-[10px] font-mono ${doc.tagColor}`}>{doc.tag}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
};
