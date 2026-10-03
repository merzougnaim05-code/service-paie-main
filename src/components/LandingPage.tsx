import React from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';
import { isProfessionalWorkerJob, computePayslip, fmt } from '../utils/salaryCalculator';
import {
  Users,
  Award,
  FileSpreadsheet,
  Calendar,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Building2,
  Landmark,
  CheckCircle2,
  Wallet,
  LayoutDashboard
} from 'lucide-react';

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

  const totalCount = employees.length;

  return (
    <div
      dir="rtl"
      className="min-h-full bg-gradient-to-b from-slate-100 via-stone-50 to-emerald-50 text-slate-800 flex flex-col"
    >
      {/* Top Algerian Republic Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-md border-b-4 border-amber-500 py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3 text-xs md:text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>نظام تسيير الرواتب والتقاعد — الوظيفة العمومية والتربية الوطنية</span>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-emerald-100">
            <span>الجمهورية الجزائرية الديمقراطية الشعبية</span>
            <span>•</span>
            <span>وزارة التربية الوطنية</span>
          </div>
        </div>
      </div>

      {/* Main Gateway Card */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-10 w-full">
        <div className="max-w-6xl w-full bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-200/80 p-6 md:p-12 relative">

          {/* Subtle Background Ornament */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
          </div>

          <div className="relative">
            {/* ==================================================== */}
            {/* 1. الدمغة الرسمية الكاملة (Official Seal & Stamp)     */}
            {/* ==================================================== */}
            <div className="border-b border-emerald-100 pb-6 mb-8 text-center relative">
              <div className="flex flex-col items-center">

                {/* Emblem / Stamp Visual */}
                <div className="relative mb-3 group">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-amber-500/80 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 flex flex-col items-center justify-center shadow-lg text-white p-2">
                    <div className="w-16 h-16 rounded-full border border-amber-300/40 flex items-center justify-center bg-emerald-950/40">
                      <Landmark className="w-8 h-8 text-amber-400" />
                    </div>
                  </div>
                  {/* Official seal badge */}
                  <div className="absolute -bottom-2 bg-amber-500 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full shadow-md border border-amber-200 flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    نظام معتمد رسمياً
                  </div>
                </div>

                {/* Official Algerian Republic Header */}
                <h2 className="text-sm md:text-base font-bold text-slate-700 tracking-wide mb-1">
                  الجمهورية الجزائرية الديمقراطية الشعبية
                </h2>
                <h3 className="text-xs md:text-sm font-semibold text-emerald-800 mb-2">
                  وزارة التربية الوطنية
                </h3>

                <div className="flex items-center justify-center gap-3 text-xs md:text-sm text-slate-600 font-medium flex-wrap">
                  <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    مديرية التربية لولاية: <b className="text-slate-900">{settings.wilaya || 'باتنة'}</b>
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    المؤسسة: <b className="text-emerald-800">{settings.institution || 'المؤسسة التعليمية'}</b>
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-slate-900 mt-4 tracking-tight">
                  برنامج تسيير الرواتب والتقاعد
                </h1>
                <p className="text-sm md:text-lg text-slate-500 max-w-2xl mt-2 leading-relaxed">
                  النظام الرقمي المعتمد لحساب أجور الوظيفة العمومية وفق الشبكة الاستدلالية الرسمية، واستخراج كشوف الرواتب ووثائق التقاعد (CNR) والوثائق الإدارية (CNAS)
                </p>
              </div>
            </div>

            {/* ==================================================== */}
            {/* 2. إحصاء الموظفين (The Official Count Cadre)          */}
            {/* ==================================================== */}
            <div className="mb-8">
              <div className="relative rounded-2xl p-1 bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-500 shadow-xl">
                <div className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 rounded-[14px] p-6 md:p-8 text-white relative overflow-hidden">

                  {/* Decorative corner badges */}
                  <div className="absolute top-2 right-2 text-amber-400/30 text-xs font-mono select-none">❖ ❖ ❖</div>
                  <div className="absolute bottom-2 left-2 text-amber-400/30 text-xs font-mono select-none">❖ ❖ ❖</div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Cadre Main Number */}
                    <div className="flex items-center gap-5 text-center md:text-right">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
                        <Users className="w-9 h-9 md:w-11 md:h-11 text-slate-950" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                            إحصاء الموظفين
                          </span>
                          <span className="text-[11px] text-emerald-300">محدث ومطابق</span>
                        </div>
                        <div className="text-3xl md:text-5xl font-black text-white mt-1 tracking-tight">
                          {totalCount.toLocaleString('ar-DZ')}
                          <span className="text-lg md:text-2xl font-bold text-amber-400 mr-2">موظف مسجل</span>
                        </div>
                        <p className="text-xs md:text-sm text-emerald-200/80 mt-1">
                          إجمالي الموظفين المقيد في سجل أجور المؤسسة
                        </p>
                      </div>
                    </div>

                    {/* Cadre Sub-metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto border-t md:border-t-0 md:border-r border-emerald-800/80 pt-4 md:pt-0 md:pr-6">
                      <button
                        type="button"
                        onClick={() => onEnter('payrollTables', undefined, 'admin')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-center transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-1 text-xs text-emerald-300 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>الإداريون</span>
                        </div>
                        <div className="text-lg md:text-xl font-bold text-white">
                          {adminCount.toLocaleString('ar-DZ')}
                        </div>
                        <div className="text-[10px] text-slate-400">الإدارة والاقتصاد والتربية</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEnter('payrollTables', undefined, 'teach')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-center transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-1 text-xs text-emerald-300 mb-1">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>سلك التعليم</span>
                        </div>
                        <div className="text-lg md:text-xl font-bold text-white">
                          {teachCount.toLocaleString('ar-DZ')}
                        </div>
                        <div className="text-[10px] text-slate-400">أساتذة ومعلمو الأطوار</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEnter('payrollTables', undefined, 'workers')}
                        className="col-span-2 sm:col-span-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 text-center transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-center gap-1 text-xs text-emerald-300 mb-1">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>العمال المهنيون</span>
                        </div>
                        <div className="text-lg md:text-xl font-bold text-white">
                          {workersCount.toLocaleString('ar-DZ')}
                        </div>
                        <div className="text-[10px] text-slate-400">سائقون وحراس وخدمات</div>
                      </button>
                    </div>

                  </div>

                  {/* Cadre Footer Note */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap text-[11px] text-slate-300 gap-2">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      مطابق للشبكة الاستدلالية الرسمية وسلم الضريبة على الدخل IRG 2022
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Calendar className="w-3 h-3" />
                      السنة المالية: {currentYear}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* ==================================================== */}
            {/* 2-b. كتلة الأجور الشهرية (Wage Mass Cadre)            */}
            {/* ==================================================== */}
            <div className="mb-8">
              <div className="relative rounded-2xl p-1 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 shadow-lg">
                <div className="bg-gradient-to-b from-slate-900 via-stone-900 to-slate-900 rounded-[14px] p-5 md:p-6 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-5 text-center md:text-right">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
                      <Wallet className="w-8 h-8 md:w-9 md:h-9 text-slate-950" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                        كتلة الأجور الإجمالية الشهرية
                      </span>
                      <div className="text-2xl md:text-4xl font-black text-white mt-1 tracking-tight">
                        {fmt(totalGross)}
                        <span className="text-base md:text-xl font-bold text-amber-400 mr-2">دج (خام)</span>
                      </div>
                      <p className="text-xs md:text-sm text-stone-300/80 mt-1">
                        الاقتطاعات: {fmt(totalDeductions)} دج • آخر تحديث: {formattedDate()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnter('payrollTables')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm shadow-md transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    فتح جداول الرواتب
                  </button>
                </div>
              </div>
            </div>

            {/* ==================================================== */}
            {/* 3. واجهة الدخول: زرّان كبيران                          */}
            {/* ==================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* زر سجل الموظفين */}
              <button
                type="button"
                onClick={() => onEnter('employees')}
                className="group min-h-[180px] md:min-h-[220px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white rounded-3xl shadow-xl shadow-emerald-700/30 p-8 flex flex-col items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer border-2 border-emerald-500/50"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center shadow-inner">
                  <Users className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
                <span className="text-2xl md:text-3xl font-black">سجل الموظفين</span>
                <span className="text-sm md:text-base text-emerald-100 font-medium">
                  {totalCount.toLocaleString('ar-DZ')} موظف • السجل الكامل والبحث والتعديل
                </span>
                <span className="mt-1 flex items-center gap-2 bg-white/15 px-4 py-1.5 rounded-full text-sm font-bold">
                  الدخول إلى السجل
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </span>
              </button>

              {/* زر وثائق التقاعد */}
              <button
                type="button"
                onClick={() => onEnter('pension')}
                className="group min-h-[180px] md:min-h-[220px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 hover:from-amber-500 hover:to-orange-700 text-slate-950 rounded-3xl shadow-xl shadow-amber-500/30 p-8 flex flex-col items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer border-2 border-amber-300/70"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-slate-950/10 border border-slate-950/15 flex items-center justify-center shadow-inner">
                  <Award className="w-10 h-10 md:w-12 md:h-12 text-slate-950" />
                </div>
                <span className="text-2xl md:text-3xl font-black">وثائق التقاعد (CNR)</span>
                <span className="text-sm md:text-base text-slate-800 font-medium">
                  شهادة الأجور الرسمية • الوجهان + 60 شهراً والمردودية
                </span>
                <span className="mt-1 flex items-center gap-2 bg-slate-950/10 px-4 py-1.5 rounded-full text-sm font-bold">
                  برمجة شهادة الأجور
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </span>
              </button>
            </div>

            {/* رابط ثانوي صغير لكشف الراتب */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => onEnter('payslip')}
                className="text-sm text-slate-500 hover:text-emerald-800 font-bold underline underline-offset-4 cursor-pointer"
              >
                كشف الراتب الفردي (Fiche de Paie)
              </button>
            </div>

            {/* زر العودة إلى بوابة التطبيقات المدرسية */}
            <div className="mt-4 text-center">
              <a
                href="https://service-intendance.pages.dev"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors cursor-pointer border-2 border-amber-500/70"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>العودة إلى لوحة التحكم — بوابة التطبيقات المدرسية</span>
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
