import React, { useState } from 'react';
import {
  Users,
  FileSpreadsheet,
  FileText,
  Settings as SettingsIcon,
  Home,
  ChevronDown,
  Menu,
  X,
  Scroll,
  Award,
  Monitor,
  Smartphone,
  DoorOpen,
  LayoutDashboard
} from 'lucide-react';

/** بوابة التطبيقات المدرسية — لوحة التحكم المركزية */
const PORTAL_URL = 'https://service-intendance.pages.dev';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const closeAll = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    closeAll();
  };

  const handleDocClick = (doc: string) => {
    onSelectDoc(doc);
    closeAll();
  };

  const handleDeviceToggle = () => {
    if (onSelectDeviceMode) {
      onSelectDeviceMode(deviceMode === 'mobile' ? 'desktop' : 'mobile');
    }
  };

  const tabs: { id: string; label: string; shortLabel: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'landing',
      label: 'بوابة الدخول والشاشة الرئيسية',
      shortLabel: 'الرئيسية',
      icon: <DoorOpen className="w-4 h-4 text-amber-400" />,
      desc: 'الإحصائيات العامة والدمغة الرسمية'
    },
    {
      id: 'employees',
      label: 'سجل الموظفين وإدخال البيانات',
      shortLabel: 'الموظفون',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      desc: 'إضافة وتعديل الموظفين والبحث'
    },
    {
      id: 'payslip',
      label: 'كشف الراتب الفردي (نموذج 3)',
      shortLabel: 'كشف الراتب',
      icon: <FileText className="w-4 h-4 text-sky-300" />,
      desc: 'إصدار كشف الراتب الرسمي لأي موظف'
    },
    {
      id: 'payrollTables',
      label: 'طلائح الرواتب (3 أسلاك)',
      shortLabel: 'طلائح الرواتب',
      icon: <FileSpreadsheet className="w-4 h-4 text-orange-300" />,
      desc: 'جداول الرواتب الشهرية حسب الأسلاك'
    },
    {
      id: 'pension',
      label: 'وثائق التقاعد الرسمية (CNR)',
      shortLabel: 'وثائق التقاعد',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      desc: 'شهادة الأجور وجهها الاثنان + 60 شهراً'
    },
    {
      id: 'docs',
      label: 'الوثائق الإدارية والضمان الاجتماعي',
      shortLabel: 'الوثائق الإدارية',
      icon: <Scroll className="w-4 h-4 text-teal-300" />,
      desc: 'ATS واستئناف العمل والشهادات الإدارية'
    },
    {
      id: 'settings',
      label: 'إعدادات المؤسسة والنظام',
      shortLabel: 'الإعدادات',
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
    { id: 'salary_disclosure', label: 'استمارة كشف المرتبات (منحة دراسية)' }
  ];

  const currentTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  const navMenuContent = (compact: boolean) => (
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

      {/* Quick administrative documents */}
      <div className={`pt-2 mt-2 border-t ${compact ? 'border-slate-800' : 'border-slate-800'}`}>
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
  );

  return (
    <header
      className="sticky top-0 z-50 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white border-b-4 border-amber-500 shadow-xl backdrop-blur-md transition-all duration-200"
      dir="rtl"
    >
      <style>{`
        .dz-sphere-wrap { width: 36px; height: 36px; perspective: 420px; }
        .dz-sphere { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; animation: dz-spin 6s linear infinite; }
        @keyframes dz-spin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
        .dz-face {
          position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
          backface-visibility: hidden; -webkit-backface-visibility: hidden; background: #fff;
          box-shadow: inset -4px -6px 10px rgba(0,0,0,.35), inset 3px 4px 6px rgba(255,255,255,.5), 0 2px 6px rgba(0,0,0,.45);
        }
        .dz-face-back { transform: rotateY(180deg); }
        .dz-half-green { position: absolute; inset: 0; background: linear-gradient(90deg, #006233 0%, #006233 50%, #ffffff 50%, #ffffff 100%); }
        .dz-star { position: relative; z-index: 2; color: #d21034; font-size: 13px; font-weight: 900; line-height: 1; }
        .dz-gloss {
          position: absolute; inset: 0; border-radius: 50%; z-index: 3; pointer-events: none;
          background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.85), rgba(255,255,255,.12) 42%, rgba(0,0,0,.18) 78%, rgba(0,0,0,.38) 100%);
        }
        @media (prefers-reduced-motion: reduce) { .dz-sphere { animation: none; } }
      `}</style>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">

        {/* Brand */}
        <div
          className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer"
          onClick={() => handleTabClick('landing')}
          title="العودة إلى البوابة الرئيسية"
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white whitespace-nowrap">
                نظام تسيير الرواتب والتقاعد
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-emerald-200/80">
              <span className="truncate max-w-[140px] sm:max-w-[220px] md:max-w-none">
                {institutionName || 'الوظيفة العمومية والتربية الوطنية'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Dropdown Navigation */}
        <div className="relative hidden md:block flex-1 max-w-xs sm:max-w-sm md:max-w-md min-w-[160px]">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-emerald-900/90 hover:bg-emerald-800/95 border-2 border-amber-400/70 text-white rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            title="انقر لفتح قائمة الأقسام والانتقال السريع"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <div className="p-1 rounded-lg bg-amber-500/20 shrink-0">
                {currentTabObj.icon}
              </div>
              <span className="text-amber-300 truncate font-black whitespace-nowrap">
                {currentTabObj.shortLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 shrink-0 mr-1.5">
              <span className="text-[10px] text-emerald-200 font-normal hidden lg:inline whitespace-nowrap">تبديل القسم</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Navigation Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 left-0 top-full mt-2 bg-slate-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[420px] overflow-y-auto">
                <div className="text-[11px] font-bold text-amber-400 px-3 py-1.5 border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>الانتقال السريع بين أقسام النظام:</span>
                  <span className="text-[10px] text-slate-400">{tabs.length} أقسام</span>
                </div>
                {navMenuContent(false)}
              </div>
            </>
          )}
        </div>

        {/* Right Tools: Portal Button, Device Toggle, 3D Flag & Mobile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* زر العودة إلى لوحة التحكم (بوابة التطبيقات المدرسية) */}
          <a
            href={PORTAL_URL}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer whitespace-nowrap shrink-0 bg-white/10 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border-amber-400/40"
            title="العودة إلى بوابة التطبيقات المدرسية (لوحة التحكم)"
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">لوحة التحكم</span>
          </a>

          {/* Phone / Desktop View Mode Toggle */}
          <button
            type="button"
            onClick={handleDeviceToggle}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer whitespace-nowrap shrink-0 ${
              deviceMode === 'mobile'
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                : 'bg-emerald-950/80 hover:bg-emerald-800 text-emerald-100 border-emerald-600/50'
            }`}
            title={deviceMode === 'mobile' ? 'التبديل إلى وضع الكمبيوتر (كامل العرض)' : 'التبديل إلى وضع الهاتف المحمول'}
          >
            {deviceMode === 'mobile' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span className="whitespace-nowrap">وضع الهاتف</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="whitespace-nowrap">وضع الكمبيوتر</span>
              </>
            )}
          </button>

          {/* العلم الوطني — كرة ثلاثية الأبعاد قابلة للدوران (أقصى اليسار) */}
          <div className="dz-sphere-wrap shrink-0" title="الجمهورية الجزائرية الديمقراطية الشعبية">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-800 text-amber-300 border border-emerald-600/50 focus:outline-none"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-amber-500/70 bg-slate-900 px-3 pt-2 pb-4 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[11px] font-bold text-amber-400 px-2 py-1.5 border-b border-slate-800 mb-1">
            الانتقال السريع بين أقسام النظام:
          </div>
          {navMenuContent(true)}

          <a
            href={PORTAL_URL}
            className="mt-2 w-full text-right p-2.5 rounded-xl flex items-center gap-2.5 bg-white/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-400/40 transition-all cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-slate-800">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-bold">العودة إلى لوحة التحكم</div>
              <div className="text-[10px] opacity-80">بوابة التطبيقات المدرسية — service-intendance</div>
            </div>
          </a>
        </div>
      )}
    </header>
  );
};
