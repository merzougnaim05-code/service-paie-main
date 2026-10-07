import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Settings, Job } from '../types';
import { JOBS, GRILLE, MONTHS_AR } from '../data/salaryGrids';
import { computePayslip, fmt, getClassificationCategory } from '../utils/salaryCalculator';
import { exportElementsToPdf } from '../utils/exportPdf';
import { CNR_LOGO } from '../data/cnrLogo';
import { AutoFitScale } from './DeviceScaler';
import {
  Award,
  Printer,
  Download,
  Settings2,
  Sparkles,
  Save,
  FileCheck
} from 'lucide-react';

interface PensionDocumentProps {
  employees: Employee[];
  settings: Settings;
  selectedEmpId?: string;
  onUpdateEmployee: (emp: Employee) => void;
}

interface MonthItem {
  key: string;       // YYYY-MM
  label: string;     // e.g. "جانفي 2021"
  salary: number;
  yieldVal: number;  // علاوة المردودية الفصلية (تدفع كل 3 أشهر ابتداء من جانفي)
}

// أشهر دفع المردودية: كل ثلاثة أشهر ابتداء من جانفي (جانفي، أفريل، جويلية، أكتوبر)
const isYieldMonth = (key: string) => {
  const m = Number(key.slice(5, 7));
  return m === 1 || m === 4 || m === 7 || m === 10;
};

// Split a full name into { lastName, firstName } — last token is the family name.
const splitName = (full: string) => {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: '', firstName: '' };
  if (parts.length === 1) return { lastName: parts[0], firstName: '' };
  return { lastName: parts[parts.length - 1], firstName: parts.slice(0, -1).join(' ') };
};

// Split YYYY-MM-DD into 3-cell date digits
const parseDate = (dStr?: string) => {
  if (!dStr) return { day: '', month: '', year: '' };
  const parts = dStr.split('-');
  if (parts.length === 3) return { day: parts[2], month: parts[1], year: parts[0] };
  return { day: '', month: '', year: '' };
};

export const PensionDocument: React.FC<PensionDocumentProps> = ({
  employees,
  settings,
  selectedEmpId,
  onUpdateEmployee
}) => {
  const [empId, setEmpId] = useState<string>(selectedEmpId || employees[0]?.id || '');
  const [refMonth, setRefMonth] = useState<number>(new Date().getMonth() + 1);
  const [refYear, setRefYear] = useState<number>(new Date().getFullYear());

  const [activeFace, setActiveFace] = useState<'both' | 'front' | 'back'>('both');
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // 60 months data state
  const [monthsData, setMonthsData] = useState<MonthItem[]>([]);

  // 5 Salary evolution rules
  const [salaryRules, setSalaryRules] = useState<Array<{
    from: string;
    to: string;
    rank: string;
    cat: string;
    grade: string;
    wage: string;
  }>>([
    { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
    { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
    { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
    { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
    { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
  ]);

  // 5 Yield (مردودية) programming rules — تدفع كل 3 أشهر ابتداء من جانفي
  const [yieldRules, setYieldRules] = useState<Array<{
    from: string;
    to: string;
    amount: string;
  }>>([
    { from: '', to: '', amount: '' },
    { from: '', to: '', amount: '' },
    { from: '', to: '', amount: '' },
    { from: '', to: '', amount: '' },
    { from: '', to: '', amount: '' },
  ]);

  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === empId) || employees[0];
  }, [employees, empId]);

  const currentJob: Job | undefined = currentEmployee ? JOBS[currentEmployee.jobIdx] : undefined;

  // Generate 60 consecutive months going backwards from refMonth / refYear
  const generateInitial60Months = (emp: Employee, rMonth: number, rYear: number) => {
    const list: MonthItem[] = [];
    const basePayslip = computePayslip(emp, rMonth, rYear, settings);
    const standardWage = basePayslip.cnasBase || basePayslip.gross || 50000;
    // المردودية الفصلية الافتراضية = مردودية 3 أشهر من كشف الراتب الحالي
    const quarterlyYield = Math.round((basePayslip.perfBonusTotal || 0) * 3 * 100) / 100;

    // Check if employee has saved history records
    const histMap = new Map<string, number>();
    const histPerf = new Map<string, number>();
    (emp.pensionHistory || []).forEach(h => {
      if (h.key) {
        if (h.wage) histMap.set(h.key, Number(h.wage));
        if (h.perf !== undefined && h.perf !== null && h.perf !== '') histPerf.set(h.key, Number(h.perf));
      }
    });

    for (let i = 59; i >= 0; i--) {
      const d = new Date(rYear, rMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${MONTHS_AR[m]} ${y}`;

      const savedWage = histMap.get(key);
      const finalSalary = savedWage !== undefined ? savedWage : standardWage;

      const savedPerf = histPerf.get(key);
      const yieldVal = savedPerf !== undefined
        ? savedPerf
        : (isYieldMonth(key) ? quarterlyYield : 0);

      list.push({
        key,
        label,
        salary: finalSalary,
        yieldVal
      });
    }

    return list;
  };

  // Re-generate months when employee or reference date changes
  useEffect(() => {
    if (currentEmployee) {
      const initial = generateInitial60Months(currentEmployee, refMonth, refYear);
      setMonthsData(initial);

      // Populate initial salary rule 1 from current employee state
      const firstMonth = initial[0]?.key || '';
      const lastMonth = initial[59]?.key || '';
      const basePayslip = computePayslip(currentEmployee, refMonth, refYear, settings);
      setSalaryRules([
        {
          from: firstMonth,
          to: lastMonth,
          rank: currentJob?.name || '',
          cat: String(GRILLE[currentEmployee.category]?.cat || ''),
          grade: String(currentEmployee.echelon),
          wage: String(basePayslip.cnasBase)
        },
        { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
        { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
        { from: '', to: '', rank: '', cat: '', grade: '', wage: '' },
        { from: '', to: '', rank: '', cat: '', grade: '', wage: '' }
      ]);

      // Populate initial yield rule 1: مردودية 3 أشهر من كشف الراتب الحالي
      const quarterlyYield = Math.round((basePayslip.perfBonusTotal || 0) * 3 * 100) / 100;
      setYieldRules([
        {
          from: firstMonth,
          to: lastMonth,
          amount: quarterlyYield > 0 ? String(quarterlyYield) : ''
        },
        { from: '', to: '', amount: '' },
        { from: '', to: '', amount: '' },
        { from: '', to: '', amount: '' },
        { from: '', to: '', amount: '' }
      ]);
    }
  }, [empId, refMonth, refYear]);

  // Apply salary + yield rules to the 60 months
  const applySalaryRules = () => {
    if (!monthsData.length) return;
    const updated = monthsData.map(m => {
      let salary = m.salary;
      for (const rule of salaryRules) {
        if (rule.from && rule.to && rule.wage) {
          if (m.key >= rule.from && m.key <= rule.to) {
            salary = Number(rule.wage) || salary;
          }
        }
      }

      // المردودية: تُطبق على أشهر جانفي/أفريل/جويلية/أكتوبر داخل الفترة
      let yieldVal = m.yieldVal;
      for (const rule of yieldRules) {
        if (rule.from && rule.to && rule.amount) {
          if (isYieldMonth(m.key) && m.key >= rule.from && m.key <= rule.to) {
            yieldVal = Number(rule.amount) || 0;
          }
        }
      }

      return { ...m, salary, yieldVal };
    });

    setMonthsData(updated);

    // Save history records into employee profile
    if (currentEmployee) {
      const newHistory = updated.map(m => ({
        key: m.key,
        wage: m.salary,
        perf: m.yieldVal || 0,
        note: 'مبرمج من كشف التقاعد'
      }));
      onUpdateEmployee({
        ...currentEmployee,
        pensionHistory: newHistory
      });
    }

    triggerToast('تم تطبيق وحفظ الأجور والمردودية على الـ 60 شهراً بنجاح ✓');
    setShowConfigPanel(false);
  };

  // Block Totals (5 Blocks of 12 months each) — تشمل المردودية
  const blockTotals = useMemo(() => {
    const totals: number[] = [0, 0, 0, 0, 0];
    monthsData.forEach((m, idx) => {
      const b = Math.floor(idx / 12);
      if (b >= 0 && b < 5) {
        totals[b] += (Number(m.salary) || 0) + (Number(m.yieldVal) || 0);
      }
    });
    return totals;
  }, [monthsData]);

  const grandTotal = useMemo(() => {
    return blockTotals.reduce((acc, curr) => acc + curr, 0);
  }, [blockTotals]);

  const averageMonthlySalary = useMemo(() => {
    return monthsData.length > 0 ? Math.round((grandTotal / monthsData.length) * 100) / 100 : 0;
  }, [grandTotal, monthsData]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download PDF file function — يلتقط الوجهين المعروضين بحجمهما الطبيعي دون تغيير تصميم الوثيقة
  const handleDownload = async () => {
    if (exportingPdf) return;
    const pick = (id: string): HTMLElement | null => {
      const el = document.getElementById(id);
      if (!el) return null;
      return (el.closest('.afs-inner') as HTMLElement) || el;
    };
    const els = [pick('cnr-front-wrapper'), pick('cnr-back-wrapper')]
      .filter((el): el is HTMLElement => !!el && el.offsetWidth > 0);
    if (els.length === 0) return;

    setExportingPdf(true);
    try {
      await exportElementsToPdf(els, `شهادة_الأجور_CNR_${currentEmployee?.name || 'موظف'}.pdf`);
      triggerToast('تم تحميل شهادة الأجور بصيغة PDF جاهزة للحفظ والطباعة');
    } catch (err) {
      console.error(err);
      triggerToast('تعذر توليد ملف PDF، يرجى المحاولة مرة أخرى');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!currentEmployee) {
    return (
      <div className="py-12 text-center text-[#64748b]">
        يرجى اختيار أو تسجيل موظف أولاً لعرض وثائق التقاعد.
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-2 sm:px-6">
      {/* Dynamic @page size depending on the active face */}
      <style>{`@page { size: ${activeFace === 'back' ? '297mm 210mm' : '210mm 297mm'}; margin: 0; }`}</style>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#047857] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm animate-in fade-in">
          <FileCheck className="w-5 h-5 text-amber-300" />
          <span>{toast}</span>
        </div>
      )}

      {/* Control & Selection Bar (No-Print) */}
      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-1">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>الصندوق الوطني للتقاعد (C.N.R) — النموذج الرسمي مطابق طبق الأصل</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f172a]">
              شهادة الأجور للتقاعد (الوجه الأمامي والخلفي 60 شهراً)
            </h2>
            <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
              وثيقة رسمية مبرمجة لحساب وتحديد أجور الـ 60 شهراً المعتمدة كأساس لتصفية منحة أو معاش التقاعد.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="bg-[#2c4e80] hover:bg-[#203a60] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
              <span>{showConfigPanel ? 'إخفاء لوحة البرمجة' : '⚙ ضبط وبرمجة الأجور والمردودية'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوثيقة</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={exportingPdf}
              className="bg-[#fff] hover:bg-[#f6f2e8] text-[#047857] border border-[#047857] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? 'جاري التوليد...' : 'تحميل (PDF)'}</span>
            </button>
          </div>
        </div>

        {/* Filters and Face Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">الموظف المعني بالتقاعد</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none focus:border-[#047857]"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — ({JOBS[e.jobIdx]?.name || 'موظف'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">الشهر المرجعي الأخير (نهاية الـ 60 شهراً)</label>
            <select
              value={refMonth}
              onChange={e => setRefMonth(Number(e.target.value))}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
            >
              {Object.entries(MONTHS_AR).map(([m, name]) => (
                <option key={m} value={m}>
                  {name} ({m})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">السنة المرجعية</label>
            <input
              type="number"
              value={refYear}
              onChange={e => setRefYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">عرض الصفحات</label>
            <div className="flex rounded-xl bg-[#e2e8f0] p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveFace('both')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFace === 'both' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#475569]'
                }`}
              >
                الوجهان معاً
              </button>
              <button
                type="button"
                onClick={() => setActiveFace('front')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFace === 'front' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#475569]'
                }`}
              >
                الوجه الأول
              </button>
              <button
                type="button"
                onClick={() => setActiveFace('back')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFace === 'back' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#475569]'
                }`}
              >
                الوجه الثاني (60)
              </button>
            </div>
          </div>
        </div>

        {/* Programming & Configuration Dropdown Panel */}
        {showConfigPanel && (
          <div className="mt-5 pt-5 border-t border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-[#d8cfb9] animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-[#047857] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>برمجة فترات الأجور وتطور الراتب عبر 5 فترات سابقة</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const regenerated = generateInitial60Months(currentEmployee, refMonth, refYear);
                  setMonthsData(regenerated);
                  triggerToast('تمت إعادة الضبط الآلي لجميع الأشهر');
                }}
                className="text-xs bg-[#e9f2ec] hover:bg-[#d5ebd9] text-[#047857] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>⚙ إعادة الضبط الآلي من الراتب الحالي</span>
              </button>
            </div>

            <p className="text-xs text-[#64748b] mb-4">
              حدد فترات الترقية أو تغير الراتب (من شهر/سنة إلى شهر/سنة) ومبلغ الراتب الخاضع للاشتراك لكل فترة، وسيتم تطبيقها فوراً على جدول الـ 60 شهراً وحساب المجاميع.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#0f172a] border-b border-[#e2e8f0]">
                    <th className="p-2.5">الفترة من (شهر/سنة)</th>
                    <th className="p-2.5">إلى (شهر/سنة)</th>
                    <th className="p-2.5">الرتبة</th>
                    <th className="p-2.5">الصنف</th>
                    <th className="p-2.5">الدرجة</th>
                    <th className="p-2.5">الأجر الخاضع للاشتراك (دج)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {salaryRules.map((rule, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.from}
                          onChange={e => {
                            const copy = [...salaryRules];
                            copy[idx].from = e.target.value;
                            setSalaryRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.to}
                          onChange={e => {
                            const copy = [...salaryRules];
                            copy[idx].to = e.target.value;
                            setSalaryRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="الرتبة"
                          value={rule.rank}
                          onChange={e => {
                            const copy = [...salaryRules];
                            copy[idx].rank = e.target.value;
                            setSalaryRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="الصنف"
                          value={rule.cat}
                          onChange={e => {
                            const copy = [...salaryRules];
                            copy[idx].cat = e.target.value;
                            setSalaryRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="الدرجة"
                          value={rule.grade}
                          onChange={e => {
                            const copy = [...salaryRules];
                            copy[idx].grade = e.target.value;
                            setSalaryRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="الأجر الخاضع"
                          value={rule.wage}
                          onChange={e => {
                            const copy = [...salaryRules];
                            copy[idx].wage = e.target.value;
                            setSalaryRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono font-bold text-center text-[#047857]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ===== جدول برمجة علاوة المردودية ===== */}
            <div className="flex items-center justify-between mb-3 mt-6">
              <div className="text-sm font-black text-[#b45309] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>برمجة علاوة المردودية — تدفع كل ثلاثة (3) أشهر ابتداء من جانفي</span>
              </div>
            </div>

            <p className="text-xs text-[#64748b] mb-4">
              تُضاف المردودية تلقائياً لأشهر <b>جانفي، أفريل، جويلية وأكتوبر</b> من كل سنة داخل الفترة المحددة، ويُعرض المبلغ في خانة الشهر مضافاً إلى الأجر الخاضع للاشتراك، مع احتسابه في المجاميع والمعدل العام.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#fde68a] bg-white">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fffbeb] text-[#92400e] border-b border-[#fde68a]">
                    <th className="p-2.5">الفترة من (شهر/سنة)</th>
                    <th className="p-2.5">إلى (شهر/سنة)</th>
                    <th className="p-2.5">مبلغ المردودية الفصلي (دج) — كل 3 أشهر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fef3c7]">
                  {yieldRules.map((rule, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.from}
                          onChange={e => {
                            const copy = [...yieldRules];
                            copy[idx].from = e.target.value;
                            setYieldRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.to}
                          onChange={e => {
                            const copy = [...yieldRules];
                            copy[idx].to = e.target.value;
                            setYieldRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="مبلغ المردودية الفصلي"
                          value={rule.amount}
                          onChange={e => {
                            const copy = [...yieldRules];
                            copy[idx].amount = e.target.value;
                            setYieldRules(copy);
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono font-bold text-center text-[#b45309]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={applySalaryRules}
                className="bg-[#047857] hover:bg-[#065f46] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق البرمجة (الأجور + المردودية) على الـ 60 شهراً</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DOCUMENT PREVIEW & PRINT SECTION (نسخة مطابقة طبق الأصل)  */}
      {/* ======================================================== */}
      <div className="space-y-8">
        {(activeFace === 'both' || activeFace === 'front') && (
          <div className="flex justify-center pb-4 print:break-after-page">
            <AutoFitScale docWidth={794}>
              <div id="cnr-front-wrapper">
                <CNRFront employee={currentEmployee} settings={settings} />
              </div>
            </AutoFitScale>
          </div>
        )}

        {(activeFace === 'both' || activeFace === 'back') && (
          <div className="flex justify-center pb-4">
            {/* قيد عرض الحاوية على نفس عرض الوجه الأمامي (794px) لتتساوى ورقتا الوثيقة المزدوجة وتتمركزان على نفس المحور */}
            <div className="w-full max-w-[794px]">
              <AutoFitScale docWidth={1123}>
                <div id="cnr-back-wrapper">
                  <CNRBack
                    employee={currentEmployee}
                    settings={settings}
                    monthsData={monthsData}
                    blockTotals={blockTotals}
                    grandTotal={grandTotal}
                    average={averageMonthlySalary}
                  />
                </div>
              </AutoFitScale>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================ */
/* CNR FRONT FACE — نسخة مطابقة تماماً للنموذج الرسمي               */
/* ================================================================ */

const DateBox3: React.FC<{ d: { day: string; month: string; year: string } }> = ({ d }) => (
  <span className="cnrf-db">
    <i className="day" contentEditable suppressContentEditableWarning>{d.day}</i>
    <i className="month" contentEditable suppressContentEditableWarning>{d.month}</i>
    <i className="year" contentEditable suppressContentEditableWarning>{d.year}</i>
  </span>
);

const CNRFront: React.FC<{ employee: Employee; settings: Settings }> = ({ employee, settings }) => {
  const job = JOBS[employee.jobIdx];
  const { lastName, firstName } = splitName(employee.name);
  const dob = parseDate(employee.birthDate);
  const startDate = parseDate(employee.hireDate);
  const endDate = parseDate(employee.lastWorkDate);

  const quality = getClassificationCategory(String(GRILLE[employee.category]?.cat ?? ''));

  const Chk: React.FC<{ q: string }> = ({ q }) => (
    <span
      className="cnrf-chk"
      onClick={e => {
        const el = e.currentTarget;
        el.textContent = el.textContent ? '' : '✕';
      }}
    >
      {quality === q ? '✕' : ''}
    </span>
  );

  return (
    <div className="cnr-front-root">
      <style>{`
        .cnrf-page * { box-sizing: border-box; }
        .cnrf-page {
          width: 210mm;
          height: 297mm;
          background: #fff;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          margin: 0 auto;
          font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 10.5pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          .cnrf-page { box-shadow: none !important; height: 296mm; overflow: hidden; }
        }
        .cnrf-page .ar { font-family: 'Traditional Arabic', 'Arabic Typesetting', 'Noto Naskh Arabic', 'Segoe UI', serif; direction: rtl; unicode-bidi: isolate; }
        .cnrf-page .fr { direction: ltr; unicode-bidi: isolate; }
        .cnrf-page p { margin: 0; }
        .cnrf-page .red { color: #c0392b; }
        .cnrf-page .cnrf-fill {
          display: inline-block;
          min-width: 1.1in;
          border-bottom: 1px dotted #000;
          min-height: 1em;
          text-align: center;
          unicode-bidi: plaintext;
          padding: 0 2mm;
        }
        .cnrf-page .cnrf-fill[contenteditable]:focus,
        .cnrf-page .cnrf-mbox[contenteditable]:focus,
        .cnrf-page .cnrf-db i[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .cnrf-page .cnrf-head { display: flex; align-items: flex-start; margin-bottom: 3mm; width: 100%; }
        .cnrf-page .cnrf-head-logo { flex: 0 0 28mm; }
        .cnrf-page .cnrf-logo-img { width: 26mm; height: 26mm; object-fit: contain; }
        .cnrf-page .cnrf-head-content { flex: 1; display: flex; flex-direction: column; }
        .cnrf-page .cnrf-head-title { font-size: 21pt; font-weight: 700; color: #1e3fae; text-align: center; letter-spacing: 1.5px; margin-bottom: 2mm; }
        .cnrf-page .cnrf-head-agency { text-align: right; color: #1e3fae; font-size: 12pt; font-weight: 700; padding-right: 4mm; }

        .cnrf-page .cnrf-title { text-align: center; margin: 1mm 0; display: block; }
        .cnrf-page .cnrf-title .a { font-size: 16pt; font-weight: 700; color: #000; letter-spacing: 1px; }
        .cnrf-page .cnrf-title .f { font-size: 14pt; font-weight: 700; letter-spacing: .5px; color: #000; }
        .cnrf-page .cnrf-subtitle { text-align: center; font-size: 8.5pt; margin-bottom: 3mm; line-height: 1.3; color: #000; display: block; }

        .cnrf-page .cnrf-box {
          border: 1.6px solid #1e3fae;
          padding: 3mm 4mm;
          margin-bottom: 3.5mm;
          line-height: 2.1;
          font-size: 10.5pt;
          display: block;
          clear: both;
          width: 100%;
        }
        .cnrf-page .cnrf-box .cnrf-hint { font-size: 8.5pt; color: #000; }

        .cnrf-page .cnrf-frow { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1mm; }
        .cnrf-page .cnrf-frow .cnrf-grow { flex: 1; display: flex; align-items: baseline; gap: 2mm; }
        .cnrf-page .cnrf-frow .cnrf-grow .cnrf-fill { flex: 1; }
        .cnrf-page .cnrf-side-box { display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 9pt; font-weight: 700; color: #000; line-height: 1.2; }

        .cnrf-page .cnrf-mbox {
          display: inline-block;
          min-width: 1.6in;
          min-height: 6.5mm;
          border: 1.5px solid #000;
          text-align: center;
          unicode-bidi: plaintext;
          padding: 1mm 2mm;
          vertical-align: middle;
          background: #fff;
        }

        .cnrf-page .cnrf-db { display: inline-flex; direction: rtl; gap: 1.5mm; vertical-align: middle; margin: 0 1.5mm; }
        .cnrf-page .cnrf-db i {
          height: 6.5mm;
          border: 1.5px solid #000;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-style: normal;
          font-size: 10pt;
          background: #fff;
          text-align: center;
        }
        .cnrf-page .cnrf-db i.day, .cnrf-page .cnrf-db i.month { width: 8mm; }
        .cnrf-page .cnrf-db i.year { width: 16mm; }

        .cnrf-page .cnrf-qrow { display: flex; justify-content: space-between; align-items: center; margin: 2mm 0 1mm; }
        .cnrf-page .cnrf-q { display: flex; align-items: center; gap: 1.5mm; font-size: 10pt; font-weight: 700; }
        .cnrf-page .cnrf-chk {
          width: 4.2mm;
          height: 4.2mm;
          border: 1.4px solid #000;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10pt;
          line-height: 1;
          cursor: pointer;
          background: #fff;
        }
        .cnrf-page .cnrf-para { font-size: 9.5pt; text-align: justify; margin-top: 2mm; font-weight: 700; line-height: 1.35; }

        .cnrf-page .cnrf-notes {
          border: 1.5px solid #000;
          padding: 2.5mm 4mm;
          margin-bottom: 3mm;
          display: block;
          clear: both;
          width: 100%;
        }
        .cnrf-page .cnrf-notes h4 { text-align: center; margin: 1.5mm 0 1mm; font-size: 11pt; font-weight: 700; color: #000; }
        .cnrf-page .cnrf-notes p { font-size: 8.8pt; text-align: justify; line-height: 1.4; font-weight: 700; margin-bottom: 1.5mm; }

        .cnrf-page .cnrf-foot { font-size: 7.5pt; color: #000; text-align: left; margin-top: 2mm; display: block; clear: both; }
      `}</style>

      <div className="cnrf-page" id="cnr-front-document">
        {/* Header Section */}
        <div className="cnrf-head">
          <div className="cnrf-head-logo">
            <img className="cnrf-logo-img" src={CNR_LOGO} alt="CNR" />
          </div>
          <div className="cnrf-head-content">
            <div className="cnrf-head-title ar">الــصــنــــدوق الــوطـنـــي لــلــتــقــــاعــــد</div>
            <div className="cnrf-head-agency ar">
              وكالة ولاية : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.8in' }}>{settings.cnasAgency || ''}</span>
            </div>
          </div>
        </div>

        {/* Document Titles */}
        <div className="cnrf-title">
          <p className="ar a">شـــــهـــــادة الأجـــــــور</p>
          <p className="fr f">ATTESTATION DE SALAIRE</p>
        </div>
        <div className="cnrf-subtitle">
          <p className="ar">(شهادة معدة من طرف المستخدم لتحديد الأجور المعتمدة كأساس لحساب التقاعد)</p>
          <p className="fr">(A établir par l'employeur pour certifier les salaires soumis à cotisation de sécurité sociale)</p>
        </div>

        {/* ===== French Box ===== */}
        <div className="cnrf-box fr">
          <div className="cnrf-frow">
            <div className="cnrf-grow">L'employeur : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '2.8in' }}>{settings.signatory || settings.director || ''}</span></div>
            <div className="cnrf-side-box">
              <span>N° S.S EMPLOYEUR</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{settings.cnasNum || ''}</span>
            </div>
          </div>
          <div className="cnrf-frow" style={{ marginTop: '1mm' }}>
            <div className="cnrf-grow">Atteste que : <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{lastName}</span> <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{firstName}</span></div>
            <div className="cnrf-side-box">
              <span>N° A.S ASSURÉ</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{employee.ssn || ''}</span>
            </div>
          </div>
          <p style={{ marginTop: '1.5mm' }}>Né(e) le : <DateBox3 d={dob} />
            &nbsp;&nbsp; Wilaya de : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.8in' }}>{settings.wilaya || ''}</span></p>
          <p style={{ marginTop: '1.5mm' }}>A fait partie de l'entreprise du : <DateBox3 d={startDate} />
            &nbsp;&nbsp; Au : <DateBox3 d={endDate} /></p>
          <div className="cnrf-frow" style={{ marginTop: '1.5mm' }}>
            <div className="cnrf-grow">En qualité de : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '2.2in' }}>{job?.name || ''}</span></div>
            <span className="cnrf-hint">(Mettre une croix dans la case correspondante)</span>
          </div>
          <div className="cnrf-qrow">
            <span className="cnrf-q">Agent d'Execution <Chk q="exec" /></span>
            <span className="cnrf-q">Cadre Moyen <Chk q="moyen" /></span>
            <span className="cnrf-q">Cadre Supérieur <Chk q="sup" /></span>
            <span className="cnrf-q">Cadre Dirigeant <Chk q="dir" /></span>
          </div>
          <p className="cnrf-para">A perçu à la date d'enregistrement de sa demande, les salaires mensuels soumis à retenue de la sécurité sociale durant les soixante (60) derniers mois tels que mentionnés au verso de la présente attestation.</p>
        </div>

        {/* ===== Arabic Box ===== */}
        <div className="cnrf-box ar">
          <div className="cnrf-frow">
            <div className="cnrf-grow">أنا المستخدم الموقع أدناه : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '2.8in' }}>{settings.signatory || settings.director || ''}</span></div>
            <div className="cnrf-side-box">
              <span>رقم صاحب العمل المنتسب</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{settings.cnasNum || ''}</span>
            </div>
          </div>
          <div className="cnrf-frow" style={{ marginTop: '1mm' }}>
            <div className="cnrf-grow">أشهد بأن السيد(ة) : <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{lastName}</span> <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{firstName}</span></div>
            <div className="cnrf-side-box">
              <span>رقم الضمان الاجتماعي للمؤمن</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{employee.ssn || ''}</span>
            </div>
          </div>
          <p style={{ marginTop: '1.5mm' }}>المولود(ة) بتاريخ : <DateBox3 d={dob} />
            &nbsp; في : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.5in' }}>{employee.birthPlace || ''}</span>
            &nbsp; ولاية : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.2in' }}>{settings.wilaya || ''}</span></p>
          <p style={{ marginTop: '1.5mm' }}>(ت) يعد من مستخدمي المؤسسة إبتداء من : <DateBox3 d={startDate} />
            &nbsp; إلى : <DateBox3 d={endDate} /></p>
          <p style={{ marginTop: '1.5mm' }}>بصفته(ها) : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '3.5in' }}>{job?.name || ''}</span></p>
          <p className="cnrf-hint" style={{ textAlign: 'center', marginTop: '1mm' }}>(ضع علامة على الخانة المناسبة)</p>
          <div className="cnrf-qrow">
            <span className="cnrf-q">عون تنفيذ <Chk q="exec" /></span>
            <span className="cnrf-q">إطار <Chk q="moyen" /></span>
            <span className="cnrf-q">إطار سامي <Chk q="sup" /></span>
            <span className="cnrf-q">إطار مسير <Chk q="dir" /></span>
          </div>
          <p className="cnrf-para">قد استفاد(ت) عند تاريخ تسجيل طلبه (ها) من الأجور الشهرية الخاضعة لإشتراكات الضمان الإجتماعي العائدة الى ستين (60) شهرا الأخيرة وذلك حسب ما هو مشار إليه على ظهر هذه الشهادة.</p>
        </div>

        {/* ===== Legal Notes ===== */}
        <div className="cnrf-notes">
          <h4 className="ar">——— نصائح مهمة ———</h4>
          <p className="ar red">تنص المادتان 82 و 83 من قانون المنازعات رقم 08-08 الصادر في 23 فبراير 2008 على أنه: "يعاقب بالحبس من ستة (6) أشهر إلى سنتين ( 2 ) و بغرامة مالية من ثلاثين ألف دينار ( 30.000 دج ) إلى مائة ألف دينار ( 100.000 دج ) ، كل من أدلى بتصريحات كاذبة ، عرض خدمات أو قبلها ، أو قدمها بغرض حصوله أو حصول الغير على أداءات غير مستحقة.</p>
          <h4 className="fr">——— RECOMMANDATIONS IMPORTANTES ———</h4>
          <p className="fr red">Est puni d'un emprisonnement de six (06) mois à deux (02) ans et d'une amende de trente mille dinars (30.000 DA) à cent mille dinars (100.000 DA), toute personne ayant fait de fausses declarations, offert, accepté ou prêté des services pour obtenir, pour lui-même ou faire obtenir indûment des prestations à des tiers ". (Art.82 et 83 Loi n°08-08 du 23 février 2008)</p>
        </div>

        {/* Footer */}
        <div className="cnrf-foot"><span>IMP.CNAS 06/10 RET.07</span></div>

      </div>
    </div>
  );
};

/* ================================================================ */
/* CNR BACK FACE — نسخة مطابقة تماماً للنموذج الرسمي (60 شهراً)     */
/* ================================================================ */

interface CNRBackProps {
  employee: Employee;
  settings: Settings;
  monthsData: MonthItem[];
  blockTotals: number[];
  grandTotal: number;
  average: number;
}

const CNRBack: React.FC<CNRBackProps> = ({ monthsData, blockTotals, grandTotal, average }) => {
  // Blocks left-to-right: Total(5) = oldest 12 months ... Total(1) = most recent 12 months
  const blockMonths = (b: number) => monthsData.slice(b * 12, b * 12 + 12);

  return (
    <div className="cnr-back-root">
      <style>{`
        .cnrb-page * { box-sizing: border-box; }
        .cnrb-page {
          width: 297mm;
          height: 210mm;
          background: #fff;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          padding: 8mm 10mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin: 0 auto;
          font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 10pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          .cnrb-page { box-shadow: none !important; }
        }
        .cnrb-page .ar { font-family: 'Traditional Arabic', 'Arabic Typesetting', 'Segoe UI', serif; direction: rtl; unicode-bidi: isolate; }
        .cnrb-page .fr { direction: ltr; unicode-bidi: isolate; }
        .cnrb-page [contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .cnrb-page .cnrb-header { text-align: center; margin-bottom: 2mm; }
        .cnrb-page .cnrb-header-ar { font-size: 17pt; font-weight: bold; color: #000; margin: 0 0 1mm 0; }
        .cnrb-page .cnrb-header-fr { font-size: 13.5pt; font-weight: bold; color: #000; letter-spacing: 0.5px; margin: 0; }

        .cnrb-page .cnrb-tables-container { display: flex; gap: 2.5mm; flex: 1; width: 100%; margin-bottom: 2mm; }
        .cnrb-page .cnrb-block-table { flex: 1; border-collapse: collapse; height: 100%; background: #fff; table-layout: fixed; }
        .cnrb-page .cnrb-block-table th, .cnrb-page .cnrb-block-table td { border: 1px solid #000; text-align: center; padding: 0; vertical-align: middle; }
        .cnrb-page .cnrb-block-table th { height: 14mm; font-weight: bold; background: #fff; }
        .cnrb-page .cnrb-th-col-ref { width: 42%; }
        .cnrb-page .cnrb-th-col-sal { width: 58%; }
        .cnrb-page .cnrb-th-ar { font-size: 9pt; font-weight: bold; line-height: 1.1; display: block; }
        .cnrb-page .cnrb-th-fr { font-size: 7.5pt; font-weight: bold; line-height: 1.1; display: block; margin-top: 1px; }
        .cnrb-page .cnrb-block-table td.cnrb-data-cell { height: 8.4mm; font-size: 9.5pt; unicode-bidi: plaintext; }
        .cnrb-page .cnrb-month-cell { font-weight: 700; font-size: 9pt; }
        .cnrb-page .cnrb-sal-val { display: block; line-height: 1.15; }
        .cnrb-page .cnrb-yield-note { display: block; font-size: 6.8pt; font-weight: 700; color: #1e3fae; line-height: 1.05; }
        .cnrb-page .cnrb-block-table td.cnrb-total-cell { height: 11mm; font-weight: bold; background: #fff; }
        .cnrb-page .cnrb-total-ar { font-size: 9.5pt; font-weight: bold; display: block; }
        .cnrb-page .cnrb-total-fr { font-size: 8.5pt; font-weight: bold; display: block; }
        .cnrb-page .cnrb-total-val { font-size: 10pt; }

        .cnrb-page .cnrb-footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 4mm 1mm 4mm; }
        .cnrb-page .cnrb-summary-section { display: flex; flex-direction: column; gap: 2.5mm; }
        .cnrb-page .cnrb-summary-row { display: flex; align-items: center; }
        .cnrb-page .cnrb-sum-fr { font-size: 9.5pt; font-weight: bold; width: 44mm; text-align: left; }
        .cnrb-page .cnrb-sum-box {
          width: 46mm;
          height: 8.5mm;
          border: 1px solid #000;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 10pt;
          margin: 0 4mm;
          unicode-bidi: plaintext;
        }
        .cnrb-page .cnrb-sum-ar { font-size: 10pt; font-weight: bold; width: 44mm; text-align: right; }
        .cnrb-page .cnrb-stamp-section { text-align: right; padding-right: 6mm; padding-bottom: 1mm; }
        .cnrb-page .cnrb-stamp-ar { font-size: 11pt; font-weight: bold; margin-bottom: 1mm; }
        .cnrb-page .cnrb-stamp-fr { font-size: 9.5pt; font-weight: bold; }

        /* رمز CNR على الجهة المقابلة (الوجه الخلفي) — أعلى الزاوية */
        .cnrb-page { position: relative; }
        .cnrb-page .cnrb-corner-logo {
          position: absolute;
          top: 5mm;
          left: 8mm;
          width: 20mm;
          height: 20mm;
          object-fit: contain;
        }
      `}</style>

      <div className="cnrb-page" id="cnr-back-document">

        {/* رمز CNR — الجهة المقابلة */}
        <img className="cnrb-corner-logo" src={CNR_LOGO} alt="CNR" />

        {/* Header Titles */}
        <div className="cnrb-header">
          <p className="cnrb-header-ar ar">الأجور الشهرية الخاضعة لإشتراكات الضمان الاجتماعي</p>
          <p className="cnrb-header-fr fr">SALAIRES MENSUELS SOUMIS A COTISATION</p>
        </div>

        {/* 5 Column Blocks (Left to Right: Block 5 to Block 1) */}
        <div className="cnrb-tables-container">
          {[0, 1, 2, 3, 4].map(j => (
            <table key={j} className="cnrb-block-table">
              <thead>
                <tr>
                  <th className="cnrb-th-col-ref">
                    <span className="cnrb-th-ar ar">الفترات المرجعية</span>
                    <span className="cnrb-th-fr fr">Période Référence</span>
                  </th>
                  <th className="cnrb-th-col-sal">
                    <span className="cnrb-th-ar ar">الأجر الخاضع للإشتراكات</span>
                    <span className="cnrb-th-fr fr">Salaire soumis à cotisation</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {blockMonths(j).map((m, r) => (
                  <tr key={r}>
                    <td className="cnrb-data-cell cnrb-month-cell" contentEditable suppressContentEditableWarning>{m.label}</td>
                    <td className="cnrb-data-cell" contentEditable suppressContentEditableWarning>
                      <span className="cnrb-sal-val">{fmt(m.salary + (m.yieldVal || 0))}</span>
                      {!!m.yieldVal && (
                        <span className="cnrb-yield-note ar">منها مردودية: {fmt(m.yieldVal)}</span>
                      )}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="cnrb-total-cell">
                    <span className="cnrb-total-ar ar">المجموع({5 - j})</span>
                    <span className="cnrb-total-fr fr">Total ({5 - j})</span>
                    <span className="cnrb-total-val">{fmt(blockTotals[j] || 0)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          ))}
        </div>

        {/* Footer Section */}
        <div className="cnrb-footer">

          {/* Summary Inputs */}
          <div className="cnrb-summary-section">
            <div className="cnrb-summary-row">
              <span className="cnrb-sum-fr fr">Total général (60) mois</span>
              <div className="cnrb-sum-box" contentEditable suppressContentEditableWarning>{fmt(grandTotal)}</div>
              <span className="cnrb-sum-ar ar">المجموع العام (60) شهرا</span>
            </div>
            <div className="cnrb-summary-row">
              <span className="cnrb-sum-fr fr">Salaire mensuel moyen</span>
              <div className="cnrb-sum-box" contentEditable suppressContentEditableWarning>{fmt(average)}</div>
              <span className="cnrb-sum-ar ar">الأجر الشهري المتوسط</span>
            </div>
          </div>

          {/* Stamp & Signature Area */}
          <div className="cnrb-stamp-section">
            <div className="cnrb-stamp-ar ar">ختم، تاريخ وتوقيع المستخدم</div>
            <div className="cnrb-stamp-fr fr">Cachet, date et visa de l'Employeur</div>
          </div>

        </div>

      </div>
    </div>
  );
};
