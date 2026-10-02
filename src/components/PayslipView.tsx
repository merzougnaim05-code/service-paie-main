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

/* ================= وثيقة كشف الراتب (صفحة A4 واحدة) ================= */

interface SheetRow {
  name: string;
  detail: string;
  amount: number;
}

interface SheetSection {
  title: string;
  rows: SheetRow[];
  subtotalLabel: string;
  subtotalAmount: number;
  extraRows?: { label: string; amount: number }[];
  amountHeader?: string;
}

interface PayslipSheetProps {
  bigTitle: string;
  specimen: boolean;
  serial: string;
  issueDate: string;
  directorate: string;
  institution: string;
  periodLine: React.ReactNode;
  infoItems: { label: string; value: React.ReactNode }[];
  gridLine: React.ReactNode;
  allowances: SheetSection;
  deductions: SheetSection;
  netLabel: string;
  net: number;
  qrDataUrl: string;
  pageBreak: boolean;
}

const PayslipSheet: React.FC<PayslipSheetProps> = ({
  bigTitle,
  specimen,
  serial,
  issueDate,
  directorate,
  institution,
  periodLine,
  infoItems,
  gridLine,
  allowances,
  deductions,
  netLabel,
  net,
  qrDataUrl,
  pageBreak
}) => (
  <div
    className={`payslip-page ${pageBreak ? 'print:break-after-page' : ''}`}
    style={pageBreak ? { breakAfter: 'page' } : undefined}
  >
    <div
      className="payslip-document bg-white border-2 border-black rounded-2xl p-4 sm:p-5 max-w-[760px] w-full text-black font-bold shadow-lg font-['Noto_Naskh_Arabic',serif] print:shadow-none print:rounded-none"
      style={{ direction: 'rtl' }}
    >
      {/* Header */}
      <div className="text-center pb-2 mb-2 border-b-[3px] border-double border-black">
        <h1 className="text-[11px] sm:text-xs font-bold text-gray-800 mb-0.5">
          الجمهورية الجزائرية الديمقراطية الشعبية
        </h1>
        <h2 className="text-[13px] sm:text-sm font-bold text-gray-900 underline decoration-black mb-1">
          وزارة التربية الوطنية
        </h2>
        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-950 my-1.5 tracking-widest">
          {bigTitle}
        </h3>

        {specimen && (
          <div className="inline-block px-3 py-0.5 border-2 border-dashed border-black text-black text-[10px] font-bold rounded mb-1">
            نموذج — غير معتمد للمعاملات الإدارية
          </div>
        )}

        {/* معلومات المؤسسة والتوثيق — موسّطة في الوسط */}
        <div className="text-center text-[10.5px] sm:text-[11px] text-gray-800 mt-1.5 space-y-0.5">
          <div><strong>المديرية:</strong> مديرية التربية لولاية {directorate}</div>
          <div><strong>المؤسسة:</strong> {institution}</div>
          <div>
            <strong>الرقم التسلسلي:</strong> <span className="font-mono">{serial}</span>
            {' '}•{' '}
            <strong>تاريخ الإصدار:</strong> <span className="font-mono">{issueDate}</span>
          </div>
        </div>

        <div className="text-center font-bold text-[13px] text-gray-900 mt-1.5">
          {periodLine}
        </div>
      </div>

      {/* Employee Info — موسّطة في الوسط */}
      <div className="border border-black rounded-lg p-2.5 mb-2.5 text-[11px] leading-relaxed">
        <div className="text-center font-bold text-[13px] text-gray-900 border-b border-black pb-1 mb-1.5">
          مـعـلـومـات الـمـوظـف
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-center">
          {infoItems.map((it, i) => (
            <div key={i} className="border-b border-dotted border-black pb-0.5">
              <span className="font-bold text-gray-700">{it.label}:</span>{' '}
              <span className="font-black text-gray-950">{it.value}</span>
            </div>
          ))}
        </div>

        <div className="text-center text-[9.5px] sm:text-[10.5px] text-gray-700 mt-1.5 border-t border-dotted border-black pt-1">
          {gridLine}
        </div>
      </div>

      {/* Allowances Table — الأرقام موسّطة */}
      <div className="mb-2.5">
        <div className="bg-black text-white text-center py-1 font-bold text-[11px] sm:text-xs">
          {allowances.title}
        </div>
        <table className="w-full border-collapse text-[11px] border-2 border-black">
          <thead>
            <tr className="bg-white border-b-2 border-black text-black">
              <th className="p-1 text-right w-[45%]">البيان</th>
              <th className="p-1 text-center w-[32%]">التفاصيل / النسبة</th>
              <th className="p-1 text-center w-[23%] font-mono">{allowances.amountHeader || 'المبلغ (دج)'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-black">
            {allowances.rows.map((r, i) => (
              <tr key={i}>
                <td className="p-1 font-bold text-right flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                  <span>{r.name}</span>
                </td>
                <td className="p-1 text-center text-gray-800">{r.detail}</td>
                <td className="p-1 text-center font-mono font-bold">{fmt(r.amount)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-black font-bold">
              <td colSpan={2} className="p-1.5 text-center text-gray-900">{allowances.subtotalLabel}</td>
              <td className="p-1.5 text-center font-mono font-black text-[12px]">{fmt(allowances.subtotalAmount)}</td>
            </tr>
            {allowances.extraRows?.map((r, i) => (
              <tr key={`x${i}`} className="font-bold">
                <td colSpan={2} className="p-1 text-center">{r.label}</td>
                <td className="p-1 text-center font-mono">{fmt(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deductions Table — الأرقام موسّطة */}
      <div className="mb-2.5">
        <div className="text-center font-bold text-[11px] sm:text-xs text-gray-900 py-0.5">
          {deductions.title}
        </div>
        <table className="w-full border-collapse text-[11px] border-2 border-black">
          <tbody className="divide-y divide-dotted divide-black">
            {deductions.rows.map((r, i) => (
              <tr key={i}>
                <td className="p-1 font-semibold text-right w-[45%] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                  <span>{r.name}</span>
                </td>
                <td className="p-1 text-center text-gray-800 w-[32%]">{r.detail}</td>
                <td className="p-1 text-center font-mono font-bold w-[23%]">{fmt(r.amount)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-black font-bold">
              <td colSpan={2} className="p-1.5 text-center text-gray-900">{deductions.subtotalLabel}</td>
              <td className="p-1.5 text-center font-mono font-black text-[12px] text-black">
                {fmt(deductions.subtotalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Net Pay Callout */}
      <div className="net-callout border-2 border-black bg-white p-2 sm:p-2.5 text-center mb-2 rounded-lg">
        <div className="text-[12px] sm:text-sm font-bold text-gray-800 mb-0.5">{netLabel}</div>
        <div className="flex items-baseline justify-center gap-1 text-[#111]">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight">{fmt(net)}</span>
          <span className="text-sm sm:text-base font-bold">دج</span>
        </div>
        <div className="text-[9.5px] sm:text-[10.5px] text-gray-800 mt-0.5 italic">
          المبلغ بالأحرف: {amountWordsDZD(net)}
        </div>
      </div>

      {/* Footer with QR Code and Signature */}
      <div className="flex justify-between items-center pt-2 border-t border-dotted border-black text-[10px] text-center">
        <div className="flex-1 text-center">
          <div className="font-bold text-gray-800">إمضاء وختم المقتصد</div>
          <div className="h-8 mt-0.5" />
        </div>

        <div className="flex-1 text-center">
          <div className="font-bold text-gray-800">التحقق من صحة الكشف</div>
          <div className="text-[9px] text-gray-500 mt-0.5">امسح رمز الاستجابة السريعة QR</div>
        </div>

        <div className="flex-1 flex justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-14 h-14 border border-black p-0.5 rounded bg-white" />
          ) : (
            <div className="w-14 h-14 border border-black flex items-center justify-center text-[10px] text-gray-500 bg-white">
              QR
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ================= الواجهة الرئيسية ================= */

export const PayslipView: React.FC<PayslipViewProps> = ({
  employees,
  settings,
  selectedEmpId
}) => {
  const [empId, setEmpId] = useState<string>(selectedEmpId || employees[0]?.id || '');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [specimen, setSpecimen] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [qrMonthly, setQrMonthly] = useState<string>('');
  const [qrAnnual, setQrAnnual] = useState<string>('');
  const monthlyRef = useRef<HTMLDivElement>(null);
  const annualRef = useRef<HTMLDivElement>(null);

  const currentEmployee = employees.find(e => e.id === empId) || employees[0];
  const currentJob = currentEmployee ? JOBS[currentEmployee.jobIdx] : undefined;

  const result = currentEmployee
    ? computePayslip(currentEmployee, month, year, settings)
    : null;

  const annual = currentEmployee ? buildAnnual(currentEmployee, year, settings) : null;

  // Generate QR codes for both payslips
  useEffect(() => {
    if (!currentEmployee || !result || !annual) return;
    const serial = String(currentEmployee.id).replace(/\D/g, '').slice(-7).padStart(7, '0') || '1029384';
    const base = `${currentEmployee.name} | ${currentJob?.name || ''} | مؤسسة: ${settings.institution} | رقم: ${serial}`;
    QRCode.toDataURL(`كشف الراتب | ${base} | ${MONTHS_AR[month]} ${year} | الصافي: ${fmt(result.net)} دج`, { width: 100, margin: 1 })
      .then(setQrMonthly)
      .catch(() => {});
    QRCode.toDataURL(`كشف راتب سنوي | ${base} | سنة ${year} | الصافي السنوي: ${fmt(annual.net)} دج`, { width: 100, margin: 1 })
      .then(setQrAnnual)
      .catch(() => {});
  }, [currentEmployee, result, annual, month, year, settings.institution]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (exporting) return;
    const els = [monthlyRef.current, annualRef.current].filter((el): el is HTMLDivElement => !!el);
    if (els.length === 0) return;
    setExporting(true);
    try {
      await exportElementsToPdf(els, `كشف_الرواتب_الشهري_والسنوي_${currentEmployee?.name || 'موظف'}_${year}.pdf`);
    } catch (err) {
      console.error(err);
      alert('تعذر توليد ملف PDF، يرجى المحاولة مرة أخرى.');
    } finally {
      setExporting(false);
    }
  };

  if (!currentEmployee || !result || !annual) {
    return (
      <div className="py-12 text-center text-[#64748b]">
        لا يوجد موظف محدد لعرض كشف الراتب. يرجى تسجيل موظف أولاً.
      </div>
    );
  }

  const serial = String(currentEmployee.id).replace(/\D/g, '').slice(-7).padStart(7, '0') || '0029381';
  const issueDate = new Date().toLocaleDateString('ar-DZ');
  const index = result.g.base + (currentEmployee.echelon > 0 && currentEmployee.echelon <= result.g.ech.length ? result.g.ech[currentEmployee.echelon - 1] : 0);
  const grossExcludingPerf = Math.max(0, result.gross - result.perfBonusTotal);
  const totalDeductions = result.cnasDeduction + result.irgTax + result.mutDeduction + result.perfBonusTax;

  const annualGrossExcludingPerf = Math.max(0, annual.gross - annual.perfBonusTotal);
  const annualTotalDeductions = Math.round((annual.cnasDeduction + annual.mutDeduction + annual.irgTax + annual.perfBonusTax) * 100) / 100;

  const monthlyTitle = specimen ? 'كــــشــــف الـــــراتـــــب النموذجي' : 'كــــشــــف الـــــراتـــــب';
  const annualTitle = specimen ? 'كــــشــــف الـــــراتـــــب السنوي النموذجي' : 'كــــشــــف الـــــراتـــــب السنوي';

  const infoItems = [
    { label: 'الاسم واللقب', value: currentEmployee.name },
    { label: 'الوضعية العائلية', value: currentEmployee.marital },
    { label: 'الرتبة / المنصب', value: currentJob?.name || '—' },
    { label: 'عدد الأطفال', value: String(currentEmployee.children).padStart(2, '0') },
    { label: 'الرقم الاستدلالي', value: index },
    { label: 'الصنف / الدرجة', value: isProfessionalWorkerJob(currentJob) ? `${result.g.cat} / ${result.years} سنة` : `${result.g.cat} / ${currentEmployee.echelon}` },
    { label: 'رقم الضمان (SSN)', value: currentEmployee.ssn || '—' },
    { label: 'تاريخ التوظيف', value: currentEmployee.hireDate || '—' }
  ];

  const gridLine = (
    <>
      <strong>الشبكة الاستدلالية المعتمدة:</strong> {result.gridName} ({result.gridDecree}) — قيمة النقطة الاستدلالية:{' '}
      <span className="font-mono font-bold">{fmt(result.pointVal)}</span> دج
    </>
  );

  /* ===== صفوف الكشف الشهري ===== */
  const monthlyAllowances: SheetSection = {
    title: 'الـمـنـح والـعـلاوات',
    amountHeader: 'المبلغ (دج)',
    rows: [
      { name: 'الأجر القاعدي', detail: `${result.g.base} × ${fmt(result.pointVal)}`, amount: result.basic },
      ...(result.seniority > 0
        ? [{
            name: 'الخبرة المهنية',
            detail: isProfessionalWorkerJob(currentJob) ? `1.4% × ${result.years} سنة` : `الدرجة ${currentEmployee.echelon}`,
            amount: result.seniority
          }]
        : []),
      ...result.allAllowances.filter(a => a.amount > 0).map(a => ({
        name: a.name.replace(/\s*\([^)]*\)\s*$/, ''),
        detail: a.name.includes('(') ? a.name.match(/\(([^)]+)\)/)?.[1] || '' : '....................',
        amount: a.amount
      })),
      ...(result.familyTotal > 0
        ? [{
            name: 'المنح العائلية',
            detail: `${currentEmployee.children} طفل ${currentEmployee.singleWage ? '+ أجر وحيد' : ''}`.trim(),
            amount: result.familyTotal
          }]
        : [])
    ],
    subtotalLabel: 'خام الراتب الإجمالي (دون المردودية)',
    subtotalAmount: grossExcludingPerf,
    extraRows: result.perfBonusTotal > 0
      ? [
          { label: 'خام علاوة الأداء / المردودية', amount: result.perfBonusTotal },
          { label: 'صافي المردودية (بعد اقتطاع الضريبة 10%)', amount: result.perfBonusTotal - result.perfBonusTax }
        ]
      : undefined
  };

  const monthlyDeductions: SheetSection = {
    title: 'الاقتطاعات القانونية',
    rows: [
      { name: 'اقتطاع الضمان الاجتماعي (CNAS)', detail: `${fmt(result.cnasRate)}% من الأجر الخاضع`, amount: result.cnasDeduction },
      { name: 'اقتطاع الضريبة على الدخل (IRG)', detail: 'سلم الضريبة الساري في سنة الكشف', amount: result.irgTax },
      ...(result.mutDeduction > 0
        ? [{ name: 'اقتطاع التعاضدية', detail: '1% من الأجر الخام', amount: result.mutDeduction }]
        : []),
      ...(result.perfBonusTax > 0
        ? [{ name: 'ضريبة علاوة الأداء (10%)', detail: '10% ثابتة', amount: result.perfBonusTax }]
        : [])
    ],
    subtotalLabel: 'إجمالي الاقتطاعات',
    subtotalAmount: totalDeductions
  };

  /* ===== صفوف الكشف السنوي ===== */
  const annualAllowances: SheetSection = {
    title: 'الـمـنـح والـعـلاوات — مجموع 12 شهراً',
    amountHeader: 'المبلغ السنوي (دج)',
    rows: [
      { name: 'الأجر القاعدي', detail: `${result.g.base} × ${fmt(result.pointVal)} × 12`, amount: annual.basic },
      ...(annual.seniority > 0
        ? [{
            name: 'الخبرة المهنية',
            detail: isProfessionalWorkerJob(currentJob) ? `1.4% سنوياً — ${annual.years} سنة` : `الدرجة ${currentEmployee.echelon} — مجموع 12 شهراً`,
            amount: annual.seniority
          }]
        : []),
      ...annual.allowanceRows.map(al => ({
        name: al.name,
        detail: 'مجموع 12 شهراً',
        amount: al.amount
      })),
      ...(annual.familyTotal > 0
        ? [{
            name: 'المنح العائلية',
            detail: `${currentEmployee.children} طفل ${currentEmployee.singleWage ? '+ أجر وحيد' : ''} — 12 شهراً`.trim(),
            amount: annual.familyTotal
          }]
        : [])
    ],
    subtotalLabel: 'خام الراتب السنوي الإجمالي (دون المردودية)',
    subtotalAmount: annualGrossExcludingPerf,
    extraRows: annual.perfBonusTotal > 0
      ? [
          { label: 'خام علاوة الأداء / المردودية السنوية', amount: annual.perfBonusTotal },
          { label: 'صافي المردودية السنوية (بعد اقتطاع الضريبة 10%)', amount: annual.perfBonusTotal - annual.perfBonusTax }
        ]
      : undefined
  };

  const annualDeductions: SheetSection = {
    title: 'الاقتطاعات القانونية السنوية',
    rows: [
      { name: 'اقتطاع الضمان الاجتماعي (CNAS)', detail: `${fmt(result.cnasRate)}% من الأجر الخاضع — 12 شهراً`, amount: annual.cnasDeduction },
      { name: 'اقتطاع الضريبة على الدخل (IRG)', detail: 'مجموع ضرائب الأشهر الـ12 وفق سلم سنة الكشف', amount: annual.irgTax },
      ...(annual.mutDeduction > 0
        ? [{ name: 'اقتطاع التعاضدية', detail: '1% من الأجر الخام — 12 شهراً', amount: annual.mutDeduction }]
        : []),
      ...(annual.perfBonusTax > 0
        ? [{ name: 'ضريبة علاوة الأداء (10%)', detail: '10% ثابتة — 12 شهراً', amount: annual.perfBonusTax }]
        : [])
    ],
    subtotalLabel: 'إجمالي الاقتطاعات السنوية',
    subtotalAmount: annualTotalDeductions
  };

  return (
    <div className="py-6 max-w-4xl mx-auto px-4 print:py-0 print:px-0">
      {/* Control bar (no print) */}
      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e2e8f0]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f172a]">
              كشف الرواتب الشهري والسنوي (Fiche de Paie)
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              وثيقة واحدة تضم كشفي الشهر والسنة معاً — كل كشف يُطبع في ورقة A4 مستقلة — وفق الشبكات الاستدلالية الرسمية وسلم الضريبة IRG الساري في سنة الكشف.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوثيقة (صفحتان)</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={exporting}
              className="bg-white hover:bg-[#f1f5f9] text-[#047857] border border-[#047857] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'جاري التوليد...' : 'تحميل (PDF) — كشفان'}</span>
            </button>
          </div>
        </div>

        {/* النسخة النموذجية */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1e293b] cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={specimen}
              onChange={e => setSpecimen(e.target.checked)}
              className="w-4 h-4 accent-[#047857] cursor-pointer"
            />
            كشف الراتب النموذجي (Specimen) — يُطبق على الكشفين معاً
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">اختيار الموظف</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — ({JOBS[e.jobIdx]?.name || 'موظف'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">شهر الكشف الشهري</label>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
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
            <label className="block text-xs font-bold text-[#1e293b] mb-1">السنة (لكلا الكشفين)</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none"
            />
          </div>
        </div>

        {/* سنوات التغيير — الضغط على السنة يعرض الكشف وفق أنظمتها */}
        <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
          <div className="text-xs font-bold text-[#1e293b] mb-2">
            سنوات التغيير — اضغط على السنة لعرض الكشفين وفق الأنظمة القانونية السارية فيها:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {CHANGE_YEARS.map(cy => {
              const active = year === cy.year;
              return (
                <button
                  key={cy.year}
                  title={cy.note}
                  onClick={() => setYear(cy.year)}
                  className={`rounded-xl border px-2 py-2 text-center transition-all cursor-pointer ${active ? 'bg-[#047857] border-[#047857] text-white shadow' : 'bg-white border-[#cbd5e1] text-[#0f172a] hover:bg-[#f1f5f9]'}`}
                >
                  <div className="text-sm font-black font-mono">{cy.year}</div>
                  <div className={`text-[9px] leading-tight mt-0.5 ${active ? 'text-white/90' : 'text-[#64748b]'}`}>{cy.note}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payslips Container — وثيقة واحدة: شهري ثم سنوي */}
      <div className="flex flex-col items-center gap-8">
        {/* ===== الكشف الشهري ===== */}
        <div ref={monthlyRef} className="w-full flex justify-center">
          <PayslipSheet
            bigTitle={monthlyTitle}
            specimen={specimen}
            serial={serial}
            issueDate={issueDate}
            directorate={settings.wilaya || 'باتنة'}
            institution={settings.institution || 'المؤسسة التعليمية'}
            periodLine={
              <>شهر : <span className="text-black text-base font-extrabold">{MONTHS_AR[month]} {year}</span></>
            }
            infoItems={infoItems}
            gridLine={gridLine}
            allowances={monthlyAllowances}
            deductions={monthlyDeductions}
            netLabel="الـصـافـي لـلـدفـع (Net à payer)"
            net={result.net}
            qrDataUrl={qrMonthly}
            pageBreak
          />
        </div>

        {/* ===== الكشف السنوي ===== */}
        <div ref={annualRef} className="w-full flex justify-center">
          <PayslipSheet
            bigTitle={annualTitle}
            specimen={specimen}
            serial={serial}
            issueDate={issueDate}
            directorate={settings.wilaya || 'باتنة'}
            institution={settings.institution || 'المؤسسة التعليمية'}
            periodLine={
              <>السنة المالية : <span className="text-black text-base font-extrabold">{year}</span> <span className="text-xs text-gray-800">(جانفي — ديسمبر، 12 شهراً)</span></>
            }
            infoItems={infoItems}
            gridLine={gridLine}
            allowances={annualAllowances}
            deductions={annualDeductions}
            netLabel="الـصـافـي السـنـوي لـلـدفـع (Net annuel à payer)"
            net={annual.net}
            qrDataUrl={qrAnnual}
            pageBreak={false}
          />
        </div>
      </div>
    </div>
  );
};
