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
  FileCheck,
  Award,
  Monitor,
  Smartphone
} from 'lucide-react';

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
  const [salaryDropdownOpen, setSalaryDropdownOpen] = useState(false);
  const [docsDropdownOpen, setDocsDropdownOpen] = useState(false);
  const [pensionDropdownOpen, setPensionDropdownOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    onSelectTab(tab);
    setSalaryDropdownOpen(false);
    setDocsDropdownOpen(false);
    setPensionDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const handleDocClick = (doc: string) => {
    onSelectDoc(doc);
    setDocsDropdownOpen(false);
    setPensionDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#fffdfa]/95 backdrop-blur-md border-b border-[#d8d0bc] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleTabClick('landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-[#176b4a] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#12583c] transition-colors">
              🇩🇿
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base text-[#176b4a] leading-tight font-['Cairo']">
                نظام تسيير الرواتب والتقاعد
              </div>
              <div className="text-xs text-[#706856] truncate max-w-[200px] sm:max-w-xs">
                {institutionName || 'الوظيفة العمومية والتربية الوطنية'}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            {/* Home / Landing */}
            <button
              onClick={() => handleTabClick('landing')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'landing'
                  ? 'bg-[#176b4a] text-white shadow-sm'
                  : 'text-[#4a4437] hover:bg-[#ede7d8]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>

            {/* Employees */}
            <button
              onClick={() => handleTabClick('employees')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'employees'
                  ? 'bg-[#176b4a] text-white shadow-sm'
                  : 'text-[#4a4437] hover:bg-[#ede7d8]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>سجل الموظفين</span>
            </button>

            {/* Salary Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setSalaryDropdownOpen(!salaryDropdownOpen);
                  setDocsDropdownOpen(false);
                  setPensionDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'payslip' || activeTab === 'payrollTables'
                    ? 'bg-[#176b4a] text-white shadow-sm'
                    : 'text-[#4a4437] hover:bg-[#ede7d8]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>الرواتب</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {salaryDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#d8d0bc] py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <button
                    onClick={() => handleTabClick('payslip')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8] flex items-center justify-between"
                  >
                    <span>كشف الراتب (Fiche)</span>
                    <span className="text-xs bg-[#e8e2d2] px-1.5 py-0.5 rounded text-[#554e3f]">
                      نموذج 3
                    </span>
                  </button>
                  <button
                    onClick={() => handleTabClick('payrollTables')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8] flex items-center justify-between"
                  >
                    <span>طلائح الرواتب</span>
                    <span className="text-xs bg-[#e8e2d2] px-1.5 py-0.5 rounded text-[#554e3f]">
                      3 أسلاك
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Retirement / Pension Documents (CNR) */}
            <button
              onClick={() => handleTabClick('pension')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'pension'
                  ? 'bg-[#176b4a] text-white shadow-sm'
                  : 'text-[#4a4437] hover:bg-[#ede7d8]'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>وثائق التقاعد (CNR)</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                جديد
              </span>
            </button>

            {/* Administrative Documents */}
            <div className="relative">
              <button
                onClick={() => {
                  setDocsDropdownOpen(!docsDropdownOpen);
                  setSalaryDropdownOpen(false);
                  setPensionDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'docs'
                    ? 'bg-[#176b4a] text-white shadow-sm'
                    : 'text-[#4a4437] hover:bg-[#ede7d8]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>الوثائق الإدارية</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {docsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#d8d0bc] py-1.5 z-50">
                  <button
                    onClick={() => handleDocClick('cert_recto')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8] flex items-center justify-between"
                  >
                    <span>ATS Recto (الوجه الأول)</span>
                    <span className="text-xs text-emerald-700 font-mono">CNAS</span>
                  </button>
                  <button
                    onClick={() => handleDocClick('cert_verso')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8] flex items-center justify-between"
                  >
                    <span>ATS Verso (الوجه الثاني)</span>
                    <span className="text-xs text-emerald-700 font-mono">CNAS</span>
                  </button>
                  <button
                    onClick={() => handleDocClick('res')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8] flex items-center justify-between"
                  >
                    <span>استئناف العمل (AS-09)</span>
                    <span className="text-xs text-blue-700 font-mono">DRT</span>
                  </button>
                  <button
                    onClick={() => handleDocClick('form')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8]"
                  >
                    <span>استمارة الموظف السنوية</span>
                  </button>
                  <button
                    onClick={() => handleDocClick('req')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8]"
                  >
                    <span>طلب وثائق الملف الإداري</span>
                  </button>
                  <button
                    onClick={() => handleDocClick('nr')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8]"
                  >
                    <span>شهادة عدم تقاضي المنح العائلية</span>
                  </button>
                  <button
                    onClick={() => handleDocClick('salary_disclosure')}
                    className="w-full text-right px-4 py-2 text-sm text-[#383329] hover:bg-[#f5f2e8]"
                  >
                    <span>استمارة كشف المرتبات (منحة دراسية)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Device Mode Switch (phone / desktop preview) */}
            <div
              className="hidden lg:flex items-center rounded-xl border border-[#d8d0bc] bg-[#f5f2e8] p-0.5 gap-0.5"
              title="التبديل بين وضع الهاتف ووضع الكمبيوتر"
            >
              <button
                onClick={() => onSelectDeviceMode && onSelectDeviceMode('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  deviceMode === 'desktop'
                    ? 'bg-[#176b4a] text-white shadow-sm'
                    : 'text-[#4a4437] hover:bg-[#ede7d8]'
                }`}
                title="وضع الكمبيوتر"
              >
                <Monitor className="w-4 h-4" />
                <span>كمبيوتر</span>
              </button>
              <button
                onClick={() => onSelectDeviceMode && onSelectDeviceMode('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  deviceMode === 'mobile'
                    ? 'bg-[#176b4a] text-white shadow-sm'
                    : 'text-[#4a4437] hover:bg-[#ede7d8]'
                }`}
                title="وضع الهاتف"
              >
                <Smartphone className="w-4 h-4" />
                <span>هاتف</span>
              </button>
            </div>

            {/* Settings */}
            <button
              onClick={() => handleTabClick('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#176b4a] text-white shadow-sm'
                  : 'text-[#4a4437] hover:bg-[#ede7d8]'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>الإعدادات</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#3b3529] hover:bg-[#ede7d8] focus:outline-none"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#d8d0bc] bg-[#fffdfa] px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => handleTabClick('landing')}
            className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm ${
              activeTab === 'landing' ? 'bg-[#176b4a] text-white' : 'text-[#433e31]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية والإحصائيات</span>
          </button>

          <button
            onClick={() => handleTabClick('employees')}
            className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm ${
              activeTab === 'employees' ? 'bg-[#176b4a] text-white' : 'text-[#433e31]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>سجل الموظفين وإدخال البيانات</span>
          </button>

          <div className="pt-2 pb-1 border-t border-[#ede7d8]">
            <div className="text-xs font-bold text-[#807661] px-3 mb-1">الرواتب</div>
            <button
              onClick={() => handleTabClick('payslip')}
              className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'payslip' ? 'bg-[#176b4a] text-white' : 'text-[#433e31]'
              }`}
            >
              <span>كشف الراتب (Fiche de Paie)</span>
              <span className="text-xs opacity-75">نموذج 3</span>
            </button>
            <button
              onClick={() => handleTabClick('payrollTables')}
              className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'payrollTables' ? 'bg-[#176b4a] text-white' : 'text-[#433e31]'
              }`}
            >
              <span>طلائح الرواتب (3 أسلاك)</span>
              <span className="text-xs opacity-75">Excel</span>
            </button>
          </div>

          <div className="pt-2 pb-1 border-t border-[#ede7d8]">
            <div className="text-xs font-bold text-[#b45309] px-3 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>وثائق التقاعد الرسمية (CNR)</span>
            </div>
            <button
              onClick={() => handleTabClick('pension')}
              className={`w-full text-right flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'pension' ? 'bg-amber-700 text-white font-bold' : 'text-[#433e31]'
              }`}
            >
              <span>شهادة الأجور (الوجه الأول والوجه الثاني 60 شهراً)</span>
              <span className="text-xs bg-amber-100 text-amber-900 px-1 rounded">معاينة وبرمجة</span>
            </button>
          </div>

          <div className="pt-2 pb-1 border-t border-[#ede7d8]">
            <div className="text-xs font-bold text-[#807661] px-3 mb-1">الوثائق الإدارية</div>
            <button
              onClick={() => handleDocClick('cert_recto')}
              className="w-full text-right px-3 py-1.5 text-sm text-[#433e31] flex justify-between"
            >
              <span>ATS Recto (الوجه الأول)</span>
              <span className="text-xs text-emerald-700">CNAS</span>
            </button>
            <button
              onClick={() => handleDocClick('cert_verso')}
              className="w-full text-right px-3 py-1.5 text-sm text-[#433e31] flex justify-between"
            >
              <span>ATS Verso (الوجه الثاني)</span>
              <span className="text-xs text-emerald-700">CNAS</span>
            </button>
            <button
              onClick={() => handleDocClick('res')}
              className="w-full text-right px-3 py-1.5 text-sm text-[#433e31] flex justify-between"
            >
              <span>استئناف العمل (AS-09)</span>
              <span className="text-xs text-blue-700">DRT</span>
            </button>
            <button
              onClick={() => handleDocClick('form')}
              className="w-full text-right px-3 py-1.5 text-sm text-[#433e31]"
            >
              <span>استمارة الموظف</span>
            </button>
            <button
              onClick={() => handleDocClick('req')}
              className="w-full text-right px-3 py-1.5 text-sm text-[#433e31]"
            >
              <span>طلب وثائق الملف</span>
            </button>
            <button
              onClick={() => handleDocClick('nr')}
              className="w-full text-right px-3 py-1.5 text-sm text-[#433e31]"
            >
              <span>شهادة عدم تقاضي المنح</span>
            </button>
            <button
              onClick={() => handleDocClick('salary_disclosure')}
              className="w-full text-right px-3 py-1.5 text-sm text-[#433e31]"
            >
              <span>استمارة كشف المرتبات</span>
            </button>
          </div>

          <div className="pt-2 pb-1 border-t border-[#ede7d8]">
            <div className="text-xs font-bold text-[#807661] px-3 mb-1">وضع العرض</div>
            <div className="flex gap-2 px-3">
              <button
                onClick={() => onSelectDeviceMode && onSelectDeviceMode('desktop')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold ${
                  deviceMode === 'desktop' ? 'bg-[#176b4a] text-white' : 'bg-[#f5f2e8] text-[#433e31]'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>كمبيوتر</span>
              </button>
              <button
                onClick={() => onSelectDeviceMode && onSelectDeviceMode('mobile')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold ${
                  deviceMode === 'mobile' ? 'bg-[#176b4a] text-white' : 'bg-[#f5f2e8] text-[#433e31]'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>هاتف</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => handleTabClick('settings')}
            className={`w-full text-right flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm border-t border-[#ede7d8] ${
              activeTab === 'settings' ? 'bg-[#176b4a] text-white' : 'text-[#433e31]'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>إعدادات المؤسسة والنظام</span>
          </button>
        </div>
      )}
    </header>
  );
};
