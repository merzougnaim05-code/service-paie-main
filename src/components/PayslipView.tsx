import React, { useState, useEffect, useRef } from 'react';
import { Employee, Settings, PayslipResult } from '../types';
import { JOBS, MONTHS_AR } from '../data/salaryGrids';
import { computePayslip, fmt, amountWordsDZD, isProfessionalWorkerJob } from '../utils/salaryCalculator';
import { exportElementsToPdf } from '../utils/exportPdf';
import QRCode from 'qrcode';
import { Printer, Download } from 'lucide-react';

interface PayslipViewProps {
  employees: Employee[];
  settings: Settings;
  selectedEmpId?: string;
}

/**
 * سنوات التغيير في منظومة الأجور والمنح منذ 2008
 * الضغط على السنة يعرض الكشف وفق الأنظمة القانونية السارية في تلك السنة
 */
const CHANGE_YEARS: { year: number; note: string }[] = [
  { year: 2008, note: 'الشبكة الاستدلالية 07-304 — النقطة 45 دج' },
  { year: 2010, note: 'النظام التعويضي الجديد (10-78)' },
  { year: 2011, note: 'منحة الدعم المدرسي 15% (11-171)' },
  { year: 2015, note: 'تعديل المنحة الجزافية (15-176)' },
  { year: 2022, note: '+50 نقطة وسلم IRG جديد (22-138)' },
  { year: 2023, note: '+75 نقطة (23-54 المرحلة الأولى)' },
  { year: 2024, note: '+75 نقطة (23-54 المرحلة الثانية)' },
  { year: 2025, note: 'النظام التعويضي الجديد (25-55)' },
  { year: 2026, note: 'تحديث منح الخدمات الاجتماعية' }
];

/**
 * تجميع كشوف الأشهر الـ12 في كشف سنوي واحد
 */
function buildAnnual(emp: Employee, year: number, settings: Settings) {
  const results = Array.from({ length: 12 }, (_, i) => computePayslip(emp, i + 1, year, settings));
  const agg = new Map<string, number>();
  results.forEach(r => {
    r.allAllowances.filter(a => a.amount > 0).forEach(a => {
      const key = a.name.replace(/\s*\([^)]*\)\s*$/, '');
      agg.set(key, (agg.get(key) || 0) + a.amount);
    });
  });
  const sum = (f: (r: PayslipResult) => number) => Math.round(results.reduce((s, r) => s + f(r), 0) * 100) / 100;
  return {
    allowanceRows: Array.from(agg.entries()).map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 })),
    basic: sum(r => r.basic),
    seniority: sum(r => r.seniority),
    familyTotal: sum(r => r.familyTotal),
    gross: sum(r => r.gross),
    perfBonusTotal: sum(r => r.perfBonusTotal),
    perfBonusTax: sum(r => r.perfBonusTax),
    cnasDeduction: sum(r => r.cnasDeduction),
    mutDeduction: sum(r => r.mutDeduction),
    irgTax: sum(r => r.irgTax),
    net: sum(r => r.net),
    years: results[0].years
  };
}

export const PayslipView: React.FC<PayslipViewProps> = ({
  employees,
  settings,
  selectedEmpId
}) => {
  const [empId, setEmpId] = useState<string>(selectedEmpId || employees[0]?.id || '');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [mode, setMode] = useState<'monthly' | 'annual'>('monthly');
  const [specimen, setSpecimen] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const payslipRef = useRef<HTMLDivElement>(null);

  const currentEmployee = employees.find(e => e.id === empId) || employees[0];
  const currentJob = currentEmployee ? JOBS[currentEmployee.jobIdx] : undefined;

  const result = currentEmployee
    ? computePayslip(currentEmployee, month, year, settings)
    : null;

  const annual = currentEmployee && mode === 'annual'
    ? buildAnnual(currentEmployee, year, settings)
    : null;

  // Generate QR code for payslip verification
  useEffect(() => {
    if (currentEmployee && result) {
      const serial = String(currentEmployee.id).replace(/\D/g, '').slice(-7).padStart(7, '0') || '1029384';
      const isAnnual = mode === 'annual' && annual;
      const period = isAnnual ? `سنة ${year}` : `${MONTHS_AR[month]} ${year}`;
      const netText = isAnnual
        ? `الصافي السنوي: ${fmt(annual!.net)} دج`
        : `الصافي للدفع: ${fmt(result.net)} دج`;
      const text = `${isAnnual ? 'كشف راتب سنوي' : 'كشف الراتب'} | ${currentEmployee.name} | ${currentJob?.name || ''} | ${period} | ${netText} | مؤسسة: ${settings.institution} | رقم: ${serial}`;
      QRCode.toDataURL(text, { width: 100, margin: 1 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [currentEmployee, result, annual, mode, month, year, settings.institution]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!payslipRef.current || exporting) return;
    setExporting(true);
    try {
      const filename = mode === 'annual'
        ? `كشف_الراتب_السنوي_${currentEmployee?.name || 'موظف'}_${year}.pdf`
        : `كشف_الراتب_${currentEmployee?.name || 'موظف'}_${month}_${year}.pdf`;
      await exportElementsToPdf([payslipRef.current], filename);
    } catch (err) {
      console.error(err);
      alert('تعذر توليد ملف PDF، يرجى المحاولة مرة أخرى.');
    } finally {
      setExporting(false);
    }
  };

  if (!currentEmployee || !result) {
    return (
      <div className="py-12 text-center text-[#736a58]">
        لا يوجد موظف محدد لعرض كشف الراتب. يرجى تسجيل موظف أولاً.
      </div>
    );
  }

  const serial = String(currentEmployee.id).replace(/\D/g, '').slice(-7).padStart(7, '0') || '0029381';
  const issueDate = new Date().toLocaleDateString('ar-DZ');
  const index = result.g.base + (currentEmployee.echelon > 0 && currentEmployee.echelon <= result.g.ech.length ? result.g.ech[currentEmployee.echelon - 1] : 0);
  const grossExcludingPerf = Math.max(0, result.gross - result.perfBonusTotal);
  const totalDeductions = result.cnasDeduction + result.irgTax + result.mutDeduction + result.perfBonusTax;

  const bigTitle = mode === 'annual'
    ? (specimen ? 'كــــشــــف الـــــراتـــــب السنوي النموذجي' : 'كــــشــــف الـــــراتـــــب السنوي')
    : (specimen ? 'كــــشــــف الـــــراتـــــب النموذجي' : 'كــــشــــف الـــــراتـــــب');

  const annualGrossExcludingPerf = annual ? Math.max(0, annual.gross - annual.perfBonusTotal) : 0;
  const annualTotalDeductions = annual
    ? Math.round((annual.cnasDeduction + annual.mutDeduction + annual.irgTax + annual.perfBonusTax) * 100) / 100
    : 0;

  return (
    <div className="py-6 max-w-4xl mx-auto px-4 print:py-0 print:px-0">
      {/* Control bar (no print) */}
      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e5ddcb]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a3d2b] font-['Cairo']">
              كشف الراتب الشهري (Fiche de Paie)
            </h2>
            <p className="text-xs text-[#706856] mt-0.5">
              نموذج معتمد وفق الشبكات الاستدلالية الرسمية المتعاقبة (07-304، 22-138، 23-54) وسلم الضريبة IRG الساري في سنة الكشف.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#176b4a] hover:bg-[#12553b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={exporting}
              className="bg-white hover:bg-[#f5f2e8] text-[#176b4a] border border-[#176b4a] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'جاري التوليد...' : 'تحميل (PDF)'}</span>
            </button>
          </div>
        </div>

        {/* نوع الكشف + النسخة النموذجية */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex bg-white border border-[#cfc4ac] rounded-xl p-1 gap-1 w-fit">
            <button
              onClick={() => setMode('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${mode === 'monthly' ? 'bg-[#176b4a] text-white shadow-sm' : 'text-[#1a3d2b] hover:bg-[#f5f2e8]'}`}
            >
              كشف شهري
            </button>
            <button
              onClick={() => setMode('annual')}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${mode === 'annual' ? 'bg-[#176b4a] text-white shadow-sm' : 'text-[#1a3d2b] hover:bg-[#f5f2e8]'}`}
            >
              كشف سنوي
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#443e33] cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={specimen}
              onChange={e => setSpecimen(e.target.checked)}
              className="w-4 h-4 accent-[#176b4a] cursor-pointer"
            />
            كشف الراتب النموذجي (Specimen)
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#443e33] mb-1">اختيار الموظف</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1a3d2b] focus:outline-none"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — ({JOBS[e.jobIdx]?.name || 'موظف'})
                </option>
              ))}
            </select>
          </div>

          {mode === 'monthly' ? (
            <div>
              <label className="block text-xs font-bold text-[#443e33] mb-1">الشهر</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
              >
                {Object.entries(MONTHS_AR).map(([m, name]) => (
                  <option key={m} value={m}>
                    {name} ({m})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[#443e33] mb-1">الفترة</label>
              <div className="w-full bg-[#f5f2e8] border border-[#cfc4ac] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1a3d2b] text-center">
                السنة الكاملة (جانفي — ديسمبر)
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#443e33] mb-1">السنة</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* سنوات التغيير — الضغط على السنة يعرض الكشف وفق أنظمتها */}
        <div className="mt-4 pt-4 border-t border-[#e5ddcb]">
          <div className="text-xs font-bold text-[#443e33] mb-2">
            سنوات التغيير — اضغط على السنة لعرض الكشف وفق الأنظمة القانونية السارية فيها:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {CHANGE_YEARS.map(cy => {
              const active = year === cy.year;
              return (
                <button
                  key={cy.year}
                  title={cy.note}
                  onClick={() => setYear(cy.year)}
                  className={`rounded-xl border px-2 py-2 text-center transition-all cursor-pointer ${active ? 'bg-[#176b4a] border-[#176b4a] text-white shadow' : 'bg-white border-[#cfc4ac] text-[#1a3d2b] hover:bg-[#f5f2e8]'}`}
                >
                  <div className="text-sm font-black font-mono">{cy.year}</div>
                  <div className={`text-[9px] leading-tight mt-0.5 ${active ? 'text-white/90' : 'text-[#706856]'}`}>{cy.note}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payslip Container */}
      <div className="flex justify-center">
        <div
          ref={payslipRef}
          className="payslip-document bg-white border-2 border-black rounded-2xl p-5 sm:p-7 max-w-[720px] w-full text-black font-bold shadow-lg font-['Noto_Naskh_Arabic',serif] print:shadow-none"
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="text-center pb-3 mb-3 border-b-[3px] border-double border-black">
            <h1 className="text-xs sm:text-sm font-bold text-gray-800 mb-0.5">
              الجمهورية الجزائرية الديمقراطية الشعبية
            </h1>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 underline decoration-black mb-2">
              وزارة التربية الوطنية
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-950 my-2 tracking-widest font-['Cairo']">
              {bigTitle}
            </h3>

            {specimen && (
              <div className="inline-block px-3 py-0.5 border-2 border-dashed border-black text-black text-[10px] sm:text-xs font-bold rounded mb-1">
                نموذج — غير معتمد للمعاملات الإدارية
              </div>
            )}

            <div className="flex justify-between items-start text-[11px] sm:text-xs text-gray-800 mt-2 px-1">
              <div className="text-right space-y-0.5">
                <div><strong>المديرية:</strong> مديرية التربية لولاية {settings.wilaya || 'باتنة'}</div>
                <div><strong>المؤسسة:</strong> {settings.institution || 'ثانوية الشهيد محمد العربي التبسي'}</div>
              </div>
              <div className="text-left space-y-0.5">
                <div><strong>الرقم التسلسلي:</strong> <span className="font-mono">{serial}</span></div>
                <div><strong>تاريخ الإصدار:</strong> <span className="font-mono">{issueDate}</span></div>
              </div>
            </div>

            <div className="text-center font-bold text-sm text-gray-900 mt-2">
              {mode === 'annual' ? (
                <>السنة المالية : <span className="text-black text-base font-extrabold">{year}</span> <span className="text-xs text-gray-800">(جانفي — ديسمبر، 12 شهراً)</span></>
              ) : (
                <>شهر : <span className="text-black text-base font-extrabold">{MONTHS_AR[month]} {year}</span></>
              )}
            </div>
          </div>

          {/* Employee Info Section */}
          <div className="border border-black rounded-lg p-3 mb-3 text-xs leading-relaxed">
            <div className="text-center font-bold text-sm text-gray-900 border-b border-black pb-1.5 mb-2 font-['Cairo']">
              مـعـلـومـات الـمـوظـف
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">الاسم واللقب:</span>
                <span className="font-black text-gray-950">{currentEmployee.name}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">الوضعية العائلية:</span>
                <span className="font-bold">{currentEmployee.marital}</span>
              </div>

              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">الرتبة / المنصب:</span>
                <span className="font-bold">{currentJob?.name || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">عدد الأطفال:</span>
                <span className="font-bold font-mono">{String(currentEmployee.children).padStart(2, '0')}</span>
              </div>

              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">الرقم الاستدلالي:</span>
                <span className="font-bold font-mono">{index}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">الصنف / الدرجة:</span>
                <span className="font-bold font-mono">
                  {result.g.cat} / {isProfessionalWorkerJob(currentJob) ? `${result.years} سنة` : currentEmployee.echelon}
                </span>
              </div>

              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">رقم الضمان (SSN):</span>
                <span className="font-mono">{currentEmployee.ssn || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-dotted border-black pb-0.5">
                <span className="font-bold text-gray-700">تاريخ التوظيف:</span>
                <span className="font-mono">{currentEmployee.hireDate || '—'}</span>
              </div>
            </div>

            <div className="text-center text-[10px] sm:text-[11px] text-gray-700 mt-2 border-t border-dotted border-black pt-1.5">
              <strong>الشبكة الاستدلالية المعتمدة:</strong> {result.gridName} ({result.gridDecree}) — قيمة النقطة الاستدلالية: <span className="font-mono font-bold">{fmt(result.pointVal)}</span> دج
            </div>
          </div>

          {mode === 'annual' && annual ? (
            <>
              {/* Annual Allowances Table */}
              <div className="mb-3">
                <div className="bg-black text-white text-center py-1.5 font-bold text-xs sm:text-sm">
                  الـمـنـح والـعـلاوات — مجموع 12 شهراً
                </div>
                <table className="w-full border-collapse text-xs border-2 border-black">
                  <thead>
                    <tr className="bg-white border-b-2 border-black text-black">
                      <th className="p-1.5 text-right w-[45%]">البيان</th>
                      <th className="p-1.5 text-center w-[30%]">التفاصيل / النسبة</th>
                      <th className="p-1.5 text-left w-[25%] font-mono">المبلغ السنوي (دج)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-black">
                    <tr>
                      <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span>الأجر القاعدي</span>
                      </td>
                      <td className="p-1.5 text-center text-gray-800">{result.g.base} × {fmt(result.pointVal)} × 12</td>
                      <td className="p-1.5 text-left font-mono font-bold">{fmt(annual.basic)}</td>
                    </tr>

                    {annual.seniority > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>الخبرة المهنية</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">
                          {isProfessionalWorkerJob(currentJob) ? `1.4% سنوياً — ${annual.years} سنة` : `الدرجة ${currentEmployee.echelon} — مجموع 12 شهراً`}
                        </td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(annual.seniority)}</td>
                      </tr>
                    )}

                    {annual.allowanceRows.map((al, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>{al.name}</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800 text-[11px]">مجموع 12 شهراً</td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(al.amount)}</td>
                      </tr>
                    ))}

                    {annual.familyTotal > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>المنح العائلية</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">
                          {currentEmployee.children} طفل {currentEmployee.singleWage ? '+ أجر وحيد' : ''} — 12 شهراً
                        </td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(annual.familyTotal)}</td>
                      </tr>
                    )}

                    <tr className="border-t-2 border-black font-bold">
                      <td colSpan={2} className="p-2 text-center text-gray-900">
                        خام الراتب السنوي الإجمالي (دون المردودية)
                      </td>
                      <td className="p-2 text-left font-mono font-black text-sm">{fmt(annualGrossExcludingPerf)}</td>
                    </tr>

                    {annual.perfBonusTotal > 0 && (
                      <>
                        <tr className="font-bold border-t border-dashed border-black">
                          <td colSpan={2} className="p-1.5 text-center">خام علاوة الأداء / المردودية السنوية</td>
                          <td className="p-1.5 text-left font-mono">{fmt(annual.perfBonusTotal)}</td>
                        </tr>
                        <tr className="font-bold">
                          <td colSpan={2} className="p-1.5 text-center">صافي المردودية السنوية (بعد اقتطاع الضريبة 10%)</td>
                          <td className="p-1.5 text-left font-mono">{fmt(annual.perfBonusTotal - annual.perfBonusTax)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Annual Deductions Table */}
              <div className="mb-4">
                <div className="text-center font-bold text-xs sm:text-sm text-gray-900 py-1.5">
                  الاقتطاعات القانونية السنوية
                </div>
                <table className="w-full border-collapse text-xs border-2 border-black">
                  <tbody className="divide-y divide-dotted divide-black">
                    <tr>
                      <td className="p-1.5 font-semibold text-right w-[45%] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span>اقتطاع الضمان الاجتماعي (CNAS)</span>
                      </td>
                      <td className="p-1.5 text-center text-gray-800 w-[30%]">{fmt(result.cnasRate)}% من الأجر الخاضع — 12 شهراً</td>
                      <td className="p-1.5 text-left font-mono font-bold w-[25%]">{fmt(annual.cnasDeduction)}</td>
                    </tr>

                    <tr>
                      <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span>اقتطاع الضريبة على الدخل (IRG)</span>
                      </td>
                      <td className="p-1.5 text-center text-gray-800">مجموع ضرائب الأشهر الـ12 وفق سلم سنة الكشف</td>
                      <td className="p-1.5 text-left font-mono font-bold">{fmt(annual.irgTax)}</td>
                    </tr>

                    {annual.mutDeduction > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>اقتطاع التعاضدية</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">1% من الأجر الخام — 12 شهراً</td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(annual.mutDeduction)}</td>
                      </tr>
                    )}

                    {annual.perfBonusTax > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>ضريبة علاوة الأداء (10%)</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">10% ثابتة — 12 شهراً</td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(annual.perfBonusTax)}</td>
                      </tr>
                    )}

                    <tr className="border-t-2 border-black font-bold">
                      <td colSpan={2} className="p-2 text-center text-gray-900">
                        إجمالي الاقتطاعات السنوية
                      </td>
                      <td className="p-2 text-left font-mono font-black text-sm text-black">
                        {fmt(annualTotalDeductions)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Annual Net Pay Callout */}
              <div className="net-callout border-2 border-black bg-white p-3 sm:p-4 text-center mb-4 rounded-xl">
                <div className="text-sm sm:text-base font-bold text-gray-800 mb-1 font-['Cairo']">
                  الـصـافـي السـنـوي لـلـدفـع (Net annuel à payer)
                </div>
                <div className="flex items-baseline justify-center gap-1 text-[#111]">
                  <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight">
                    {fmt(annual.net)}
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-['Cairo']">دج</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-800 mt-1 italic font-['Cairo']">
                  المبلغ بالأحرف: {amountWordsDZD(annual.net)}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Allowances Table */}
              <div className="mb-3">
                <div className="bg-black text-white text-center py-1.5 font-bold text-xs sm:text-sm">
                  الـمـنـح والـعـلاوات
                </div>
                <table className="w-full border-collapse text-xs border-2 border-black">
                  <thead>
                    <tr className="bg-white border-b-2 border-black text-black">
                      <th className="p-1.5 text-right w-[45%]">البيان</th>
                      <th className="p-1.5 text-center w-[30%]">التفاصيل / النسبة</th>
                      <th className="p-1.5 text-left w-[25%] font-mono">المبلغ (دج)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-black">
                    <tr>
                      <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span>الأجر القاعدي</span>
                      </td>
                      <td className="p-1.5 text-center text-gray-800">{result.g.base} × {fmt(result.pointVal)}</td>
                      <td className="p-1.5 text-left font-mono font-bold">{fmt(result.basic)}</td>
                    </tr>

                    {result.seniority > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>الخبرة المهنية</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">
                          {isProfessionalWorkerJob(currentJob) ? `1.4% × ${result.years} سنة` : `الدرجة ${currentEmployee.echelon}`}
                        </td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(result.seniority)}</td>
                      </tr>
                    )}

                    {result.allAllowances
                      .filter(a => a.amount > 0)
                      .map((al, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-black" />
                            <span>{al.name.replace(/\s*\([^)]*\)\s*$/, '')}</span>
                          </td>
                          <td className="p-1.5 text-center text-gray-800 text-[11px]">
                            {al.name.includes('(') ? al.name.match(/\(([^)]+)\)/)?.[1] : '....................'}
                          </td>
                          <td className="p-1.5 text-left font-mono font-bold">{fmt(al.amount)}</td>
                        </tr>
                      ))}

                    {result.familyTotal > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>المنح العائلية</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">
                          {currentEmployee.children} طفل {currentEmployee.singleWage ? '+ أجر وحيد' : ''}
                        </td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(result.familyTotal)}</td>
                      </tr>
                    )}

                    <tr className="border-t-2 border-black font-bold">
                      <td colSpan={2} className="p-2 text-center text-gray-900">
                        خام الراتب الإجمالي (دون المردودية)
                      </td>
                      <td className="p-2 text-left font-mono font-black text-sm">{fmt(grossExcludingPerf)}</td>
                    </tr>

                    {result.perfBonusTotal > 0 && (
                      <>
                        <tr className="font-bold border-t border-dashed border-black">
                          <td colSpan={2} className="p-1.5 text-center">خام علاوة الأداء / المردودية</td>
                          <td className="p-1.5 text-left font-mono">{fmt(result.perfBonusTotal)}</td>
                        </tr>
                        <tr className="font-bold">
                          <td colSpan={2} className="p-1.5 text-center">صافي المردودية (بعد اقتطاع الضريبة 10%)</td>
                          <td className="p-1.5 text-left font-mono">{fmt(result.perfBonusTotal - result.perfBonusTax)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Deductions Table */}
              <div className="mb-4">
                <div className="text-center font-bold text-xs sm:text-sm text-gray-900 py-1.5">
                  الاقتطاعات القانونية
                </div>
                <table className="w-full border-collapse text-xs border-2 border-black">
                  <tbody className="divide-y divide-dotted divide-black">
                    <tr>
                      <td className="p-1.5 font-semibold text-right w-[45%] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span>اقتطاع الضمان الاجتماعي (CNAS)</span>
                      </td>
                      <td className="p-1.5 text-center text-gray-800 w-[30%]">9% من الأجر الخاضع</td>
                      <td className="p-1.5 text-left font-mono font-bold w-[25%]">{fmt(result.cnasDeduction)}</td>
                    </tr>

                    <tr>
                      <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                        <span>اقتطاع الضريبة على الدخل (IRG)</span>
                      </td>
                      <td className="p-1.5 text-center text-gray-800">سلم الضريبة الساري في سنة الكشف</td>
                      <td className="p-1.5 text-left font-mono font-bold">{fmt(result.irgTax)}</td>
                    </tr>

                    {result.mutDeduction > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>اقتطاع التعاضدية</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">1% من الأجر الخام</td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(result.mutDeduction)}</td>
                      </tr>
                    )}

                    {result.perfBonusTax > 0 && (
                      <tr>
                        <td className="p-1.5 font-bold text-right flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black" />
                          <span>ضريبة علاوة الأداء (10%)</span>
                        </td>
                        <td className="p-1.5 text-center text-gray-800">10% ثابتة</td>
                        <td className="p-1.5 text-left font-mono font-bold">{fmt(result.perfBonusTax)}</td>
                      </tr>
                    )}

                    <tr className="border-t-2 border-black font-bold">
                      <td colSpan={2} className="p-2 text-center text-gray-900">
                        إجمالي الاقتطاعات
                      </td>
                      <td className="p-2 text-left font-mono font-black text-sm text-black">
                        {fmt(totalDeductions)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Pay Callout */}
              <div className="net-callout border-2 border-black bg-white p-3 sm:p-4 text-center mb-4 rounded-xl">
                <div className="text-sm sm:text-base font-bold text-gray-800 mb-1 font-['Cairo']">
                  الـصـافـي لـلـدفـع (Net à payer)
                </div>
                <div className="flex items-baseline justify-center gap-1 text-[#111]">
                  <span className="text-2xl sm:text-4xl font-black font-mono tracking-tight">
                    {fmt(result.net)}
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-['Cairo']">دج</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-800 mt-1 italic font-['Cairo']">
                  المبلغ بالأحرف: {amountWordsDZD(result.net)}
                </div>
              </div>
            </>
          )}

          {/* Footer with QR Code and Signature */}
          <div className="flex justify-between items-center pt-3 border-t border-dotted border-black text-xs text-center">
            <div className="flex-1 text-center">
              <div className="font-bold text-gray-800">إمضاء وختم المقتصد</div>
              <div className="h-10 mt-1" />
            </div>

            <div className="flex-1 text-center">
              <div className="font-bold text-gray-800">التحقق من صحة الكشف</div>
              <div className="text-[10px] text-gray-500 mt-0.5">امسح رمز الاستجابة السريعة QR</div>
            </div>

            <div className="flex-1 flex justify-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-16 h-16 border border-black p-0.5 rounded bg-white" />
              ) : (
                <div className="w-16 h-16 border border-black flex items-center justify-center text-[10px] text-gray-500 bg-white">
                  QR
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
