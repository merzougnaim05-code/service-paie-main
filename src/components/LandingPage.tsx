import React from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';
import { isProfessionalWorkerJob, computePayslip, fmt } from '../utils/salaryCalculator';
import { Users, FileSpreadsheet, Award, Calendar, ArrowLeft, Building2 } from 'lucide-react';

interface LandingPageProps {
  employees: Employee[];
  settings: Settings;
  lastModified: string;
  onEnter: (tab: string, doc?: string, sector?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  employees,
  settings,
  lastModified,
  onEnter
}) => {
  // Sector breakdowns
  const adminCount = employees.filter(e => {
    const j = JOBS[e.jobIdx];
    return j && !isProfessionalWorkerJob(j) && j.domain !== 'teach';
  }).length;

  const teachCount = employees.filter(e => {
    const j = JOBS[e.jobIdx];
    return j && j.domain === 'teach';
  }).length;

  const workersCount = employees.filter(e => {
    const j = JOBS[e.jobIdx];
    return j && isProfessionalWorkerJob(j);
  }).length;

  // Monthly totals
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  let totalGross = 0;
  let totalDeductions = 0;

  employees.forEach(emp => {
    try {
      const r = computePayslip(emp, currentMonth, currentYear, settings);
      totalGross += r.gross;
      totalDeductions += r.cnasDeduction + r.mutDeduction + r.irgTax + r.perfBonusTax;
    } catch {
      // ignore individual calculation errors
    }
  });

  const formattedDate = () => {
    try {
      const d = new Date(lastModified);
      return d.toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="py-6 sm:py-10 max-w-5xl mx-auto px-4">
      {/* Official Emblem & Header Card */}
      <div className="bg-[#fffdfa] border-2 border-[#c9a24a] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden text-center mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-100/50 to-transparent rounded-tr-full pointer-events-none" />

        {/* Flag Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-white border-4 border-[#fff] shadow-md flex items-center justify-center text-4xl sm:text-5xl mb-4 select-none">
          🇩🇿
        </div>

        <div className="text-xs uppercase tracking-widest text-[#a9782f] font-['Amiri'] font-bold mb-1">
          الجمهورية الجزائرية الديمقراطية الشعبية
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1a3d2b] font-['Cairo'] mb-2">
          وزارة التربية الوطنية
        </h1>
        <div className="text-base sm:text-xl font-bold text-[#5c5647] mb-2 font-['Cairo']">
          مديرية التربية لولاية {settings.wilaya || '—'}
        </div>
        <div className="inline-flex items-center gap-2 bg-[#f4efe4] px-4 py-1.5 rounded-full text-sm font-bold text-[#25543b] border border-[#d9ceb4] mb-6">
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span>{settings.institution || 'اسم المؤسسة التعليمية أو الإدارية'}</span>
        </div>

        <p className="text-xs sm:text-sm text-[#736c5b] max-w-2xl mx-auto mb-8 leading-relaxed">
          نظام رقمي معتمد لحساب أجور موظفي الوظيفة العمومية والتربية الوطنية وفق الشبكة الاستدلالية الرسمية وسلم الضريبة على الدخل IRG 2022، مع منظومة كاملة لاستخراج كشوف الرواتب، وبرمجة وثائق التقاعد الرسمية (CNR)، والوثائق الإدارية والضمان الاجتماعي (CNAS).
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => onEnter('payrollTables', undefined, 'admin')}
            className="bg-[#faf8f2] hover:bg-[#f1ebe0] border border-[#d8d0bc] rounded-2xl p-4 text-center transition-all group cursor-pointer"
          >
            <div className="text-3xl font-black text-[#176b4a] group-hover:scale-105 transition-transform font-mono">
              {adminCount}
            </div>
            <div className="text-sm font-bold text-[#443f34] mt-1">الإداريون</div>
            <div className="text-[11px] text-[#807662]">المصالح الاقتصادية والإدارة والتربية</div>
          </button>

          <button
            onClick={() => onEnter('payrollTables', undefined, 'teach')}
            className="bg-[#faf8f2] hover:bg-[#f1ebe0] border border-[#d8d0bc] rounded-2xl p-4 text-center transition-all group cursor-pointer"
          >
            <div className="text-3xl font-black text-[#176b4a] group-hover:scale-105 transition-transform font-mono">
              {teachCount}
            </div>
            <div className="text-sm font-bold text-[#443f34] mt-1">سلك التعليم</div>
            <div className="text-[11px] text-[#807662]">أساتذة ومعلمو الأطوار الثلاثة</div>
          </button>

          <button
            onClick={() => onEnter('payrollTables', undefined, 'workers')}
            className="bg-[#faf8f2] hover:bg-[#f1ebe0] border border-[#d8d0bc] rounded-2xl p-4 text-center transition-all group cursor-pointer"
          >
            <div className="text-3xl font-black text-[#176b4a] group-hover:scale-105 transition-transform font-mono">
              {workersCount}
            </div>
            <div className="text-sm font-bold text-[#443f34] mt-1">العمال المهنيون</div>
            <div className="text-[11px] text-[#807662]">السائقون والحراس وعمال الخدمات</div>
          </button>
        </div>

        {/* Financial Mass Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right bg-[#f7f4ea] p-4 rounded-2xl border border-[#ded5be] mb-8">
          <div className="p-2">
            <div className="text-xs text-[#807662] font-semibold mb-1">كتلة الأجور الإجمالية الشهرية (خام)</div>
            <div className="text-lg font-black text-[#1a3d2b] font-mono">{fmt(totalGross)} دج</div>
          </div>
          <div className="p-2 border-t sm:border-t-0 sm:border-r border-[#e0d7c2]">
            <div className="text-xs text-[#807662] font-semibold mb-1">كتلة الاقتطاعات (ضمان + ضريبة + تعاضدية)</div>
            <div className="text-lg font-black text-[#8c3b2d] font-mono">{fmt(totalDeductions)} دج</div>
          </div>
          <div className="p-2 border-t sm:border-t-0 sm:border-r border-[#e0d7c2]">
            <div className="text-xs text-[#807662] font-semibold mb-1">تاريخ آخر تعديل في النظام</div>
            <div className="text-sm font-bold text-[#4a4335] mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>{formattedDate()}</span>
            </div>
          </div>
        </div>

        {/* Main Action Shortcuts */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onEnter('employees')}
            className="bg-[#176b4a] hover:bg-[#12553b] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
          >
            <Users className="w-4 h-4" />
            <span>سجل الموظفين وإدخال البيانات</span>
            <ArrowLeft className="w-4 h-4 mr-1 opacity-70" />
          </button>

          <button
            onClick={() => onEnter('pension')}
            className="bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
          >
            <Award className="w-4 h-4" />
            <span>وثائق التقاعد الرسمية (CNR)</span>
            <span className="text-xs bg-amber-900/60 px-2 py-0.5 rounded">الوجهان 60 شهراً</span>
          </button>

          <button
            onClick={() => onEnter('payslip')}
            className="bg-[#fff] hover:bg-[#f6f2e8] text-[#25543b] border border-[#25543b] px-5 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>كشف الراتب (Fiche)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
