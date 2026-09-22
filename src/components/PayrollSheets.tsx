import React, { useState } from 'react';
import { Employee, Settings } from '../types';
import { JOBS, MONTHS_AR } from '../data/salaryGrids';
import { computePayslip, fmt, isProfessionalWorkerJob } from '../utils/salaryCalculator';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Download, RefreshCw, Eye, Search } from 'lucide-react';

interface PayrollSheetsProps {
  employees: Employee[];
  settings: Settings;
  onOpenPayslip: (id: string) => void;
  initialSector?: string;
}

export const PayrollSheets: React.FC<PayrollSheetsProps> = ({
  employees,
  settings,
  onOpenPayslip,
  initialSector = 'admin'
}) => {
  const [sector, setSector] = useState<string>(initialSector || 'admin');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState<string>('');

  const SECTOR_NAMES: Record<string, string> = {
    admin: 'الإداريون',
    teach: 'سلك التعليم',
    workers: 'العمال المهنيون'
  };

  const getSectorKey = (emp: Employee): string => {
    const job = JOBS[emp.jobIdx];
    if (isProfessionalWorkerJob(job)) return 'workers';
    if (job?.domain === 'teach') return 'teach';
    return 'admin';
  };

  // Sector counts
  const counts = {
    admin: employees.filter(e => getSectorKey(e) === 'admin').length,
    teach: employees.filter(e => getSectorKey(e) === 'teach').length,
    workers: employees.filter(e => getSectorKey(e) === 'workers').length
  };

  // Filtered employees in selected sector
  const sectorEmployees = employees.filter(e => {
    const inSector = getSectorKey(e) === sector;
    if (!inSector) return false;
    if (!searchQuery.trim()) return true;
    return (
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.ssn && e.ssn.includes(searchQuery))
    );
  });

  // Calculate results for each employee
  const payrollData = sectorEmployees.map((emp, idx) => {
    const r = computePayslip(emp, month, year, settings);
    return {
      index: idx + 1,
      emp,
      job: JOBS[emp.jobIdx],
      r
    };
  });

  // Extract all unique allowance names across these employees
  const allowanceNames: string[] = [];
  payrollData.forEach(item => {
    item.r.allAllowances.forEach(al => {
      if (al.amount > 0 && !allowanceNames.includes(al.name)) {
        allowanceNames.push(al.name);
      }
    });
  });

  // Calculate Column Totals
  const totals = payrollData.reduce(
    (acc, curr) => {
      acc.basic += curr.r.basic;
      acc.seniority += curr.r.seniority;
      acc.allowTotal += curr.r.allowTotal;
      acc.familyTotal += curr.r.familyTotal;
      acc.gross += curr.r.gross;
      acc.cnas += curr.r.cnasDeduction;
      acc.irg += curr.r.irgTax;
      acc.mut += curr.r.mutDeduction;
      acc.net += curr.r.net;
      return acc;
    },
    {
      basic: 0,
      seniority: 0,
      allowTotal: 0,
      familyTotal: 0,
      gross: 0,
      cnas: 0,
      irg: 0,
      mut: 0,
      net: 0
    }
  );

  // Export to Excel
  const handleExportExcel = () => {
    if (!payrollData.length) return;

    const rows = payrollData.map(item => {
      const row: Record<string, any> = {
        'الرقم': item.index,
        'الاسم واللقب': item.emp.name,
        'الوظيفة / الرتبة': item.job?.name || '—',
        'الصنف': item.r.g.cat,
        'الدرجة / سنوات': isProfessionalWorkerJob(item.job) ? `${item.r.years} سنة` : item.emp.echelon,
        'الأجر القاعدي': item.r.basic,
        'الخبرة المهنية': item.r.seniority
      };

      allowanceNames.forEach(name => {
        const found = item.r.allAllowances.find(a => a.name === name);
        row[name] = found ? found.amount : 0;
      });

      row['المنح العائلية'] = item.r.familyTotal;
      row['الأجر الخام'] = item.r.gross;
      row['اقتطاع الضمان (9%)'] = item.r.cnasDeduction;
      row['اقتطاع الضريبة (IRG)'] = item.r.irgTax;
      row['اقتطاع التعاضدية'] = item.r.mutDeduction;
      row['الصافي للدفع'] = item.r.net;
      row['رقم الضمان الاجتماعي'] = item.emp.ssn || '';
      row['رقم الحساب البريدي'] = item.emp.postalAccount || '';

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `طليحة_${SECTOR_NAMES[sector]}`);
    XLSX.writeFile(workbook, `طليحة_رواتب_${SECTOR_NAMES[sector]}_${MONTHS_AR[month]}_${year}.xlsx`);
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Sector Selection & Filter Bar */}
      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#e5ddcb] gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a3d2b] font-['Cairo'] flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#176b4a]" />
              <span>طلائح الرواتب الشهرية حسب السلك</span>
            </h2>
            <p className="text-xs text-[#706856] mt-0.5">
              كل سلك معزول ومستقل، ويُحسب جدول الرواتب تلقائياً مع خيار التصدير الكامل إلى ملف Excel.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            className="bg-[#176b4a] hover:bg-[#12553b] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير طليحة السلك إلى Excel</span>
          </button>
        </div>

        {/* 3 Sector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSector('admin')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              sector === 'admin'
                ? 'bg-[#176b4a] text-white border-[#176b4a] shadow-sm'
                : 'bg-[#faf8f2] text-[#3e382c] border-[#d8d0bc] hover:bg-[#f1ebe0]'
            }`}
          >
            <div>
              <div className="font-bold text-sm">سلك الإداريين</div>
              <div className={`text-xs mt-0.5 ${sector === 'admin' ? 'text-emerald-100' : 'text-[#7e735e]'}`}>
                المصالح الاقتصادية، الإدارة والتربية
              </div>
            </div>
            <span className="text-sm font-black font-mono px-2 py-0.5 rounded-full bg-white/20">
              {counts.admin} موظف
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSector('teach')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              sector === 'teach'
                ? 'bg-[#176b4a] text-white border-[#176b4a] shadow-sm'
                : 'bg-[#faf8f2] text-[#3e382c] border-[#d8d0bc] hover:bg-[#f1ebe0]'
            }`}
          >
            <div>
              <div className="font-bold text-sm">سلك التعليم</div>
              <div className={`text-xs mt-0.5 ${sector === 'teach' ? 'text-emerald-100' : 'text-[#7e735e]'}`}>
                أساتذة ومعلمو الأطوار الثلاثة
              </div>
            </div>
            <span className="text-sm font-black font-mono px-2 py-0.5 rounded-full bg-white/20">
              {counts.teach} موظف
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSector('workers')}
            className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              sector === 'workers'
                ? 'bg-[#176b4a] text-white border-[#176b4a] shadow-sm'
                : 'bg-[#faf8f2] text-[#3e382c] border-[#d8d0bc] hover:bg-[#f1ebe0]'
            }`}
          >
            <div>
              <div className="font-bold text-sm">العمال المهنيون</div>
              <div className={`text-xs mt-0.5 ${sector === 'workers' ? 'text-emerald-100' : 'text-[#7e735e]'}`}>
                السائقون والحراس وعمال الخدمات
              </div>
            </div>
            <span className="text-sm font-black font-mono px-2 py-0.5 rounded-full bg-white/20">
              {counts.workers} موظف
            </span>
          </button>
        </div>

        {/* Date and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          <div>
            <label className="block text-xs font-bold text-[#443e33] mb-1">السنة</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#443e33] mb-1">بحث في الطليحة</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو رقم الضمان..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#cfc4ac] rounded-xl pr-9 pl-3 py-2 text-xs sm:text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet Card */}
      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#e5ddcb]">
          <h3 className="text-base sm:text-lg font-bold text-[#1b3e2b] font-['Cairo']">
            طليحة {SECTOR_NAMES[sector]} لشهر {MONTHS_AR[month]} {year}
          </h3>
          <span className="text-xs text-[#706856]">
            عدد الموظفين المعروضين: <strong className="font-mono text-emerald-800">{payrollData.length}</strong>
          </span>
        </div>

        {payrollData.length === 0 ? (
          <div className="py-12 text-center text-[#807662] text-sm">
            لا يوجد موظفون مسجلون في {SECTOR_NAMES[sector]} مطابقون لشروط البحث.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#ded5be]">
            <table className="w-full text-right text-xs border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#25543b] text-white">
                  <th className="p-2.5 font-bold text-center">#</th>
                  <th className="p-2.5 font-bold">الاسم واللقب</th>
                  <th className="p-2.5 font-bold">الرتبة</th>
                  <th className="p-2.5 font-bold text-center">الصنف</th>
                  <th className="p-2.5 font-bold text-center">الدرجة</th>
                  <th className="p-2.5 font-bold text-left font-mono">الأجر القاعدي</th>
                  <th className="p-2.5 font-bold text-left font-mono">الخبرة</th>
                  {allowanceNames.map((name, i) => (
                    <th key={i} className="p-2.5 font-bold text-left font-mono text-[11px] whitespace-nowrap">
                      {name.replace(/\s*\([^)]*\)\s*$/, '')}
                    </th>
                  ))}
                  <th className="p-2.5 font-bold text-left font-mono">المنح العائلية</th>
                  <th className="p-2.5 font-bold text-left font-mono bg-[#1c402d]">الأجر الخام</th>
                  <th className="p-2.5 font-bold text-left font-mono text-red-200">CNAS</th>
                  <th className="p-2.5 font-bold text-left font-mono text-red-200">IRG</th>
                  <th className="p-2.5 font-bold text-left font-mono text-red-200">تعاضدية</th>
                  <th className="p-2.5 font-bold text-left font-mono bg-[#113824]">الصافي للدفع</th>
                  <th className="p-2.5 font-bold text-center">كشف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece3cf]">
                {payrollData.map(item => (
                  <tr key={item.emp.id} className="hover:bg-[#faf7ee] transition-colors">
                    <td className="p-2.5 text-center text-[#7e7663]">{item.index}</td>
                    <td className="p-2.5 font-bold text-[#1b3e2b] whitespace-nowrap">{item.emp.name}</td>
                    <td className="p-2.5 text-[#443e33] whitespace-nowrap">{item.job?.name || '—'}</td>
                    <td className="p-2.5 text-center font-mono font-bold">{item.r.g.cat}</td>
                    <td className="p-2.5 text-center font-mono">
                      {isProfessionalWorkerJob(item.job) ? `${item.r.years} سنة` : item.emp.echelon}
                    </td>
                    <td className="p-2.5 text-left font-mono">{fmt(item.r.basic)}</td>
                    <td className="p-2.5 text-left font-mono">{fmt(item.r.seniority)}</td>
                    {allowanceNames.map((name, i) => {
                      const found = item.r.allAllowances.find(a => a.name === name);
                      return (
                        <td key={i} className="p-2.5 text-left font-mono text-[#524b3c]">
                          {found ? fmt(found.amount) : '—'}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-left font-mono">{fmt(item.r.familyTotal)}</td>
                    <td className="p-2.5 text-left font-mono font-bold bg-[#faf7ee] text-[#1b3e2b]">
                      {fmt(item.r.gross)}
                    </td>
                    <td className="p-2.5 text-left font-mono text-red-800">{fmt(item.r.cnasDeduction)}</td>
                    <td className="p-2.5 text-left font-mono text-red-800">{fmt(item.r.irgTax)}</td>
                    <td className="p-2.5 text-left font-mono text-red-800">{fmt(item.r.mutDeduction)}</td>
                    <td className="p-2.5 text-left font-mono font-black text-[#176b4a] bg-emerald-50/50">
                      {fmt(item.r.net)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => onOpenPayslip(item.emp.id)}
                        className="text-[#176b4a] hover:bg-[#e9f2ec] p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="عرض كشف الراتب"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Column Totals Row */}
                <tr className="bg-[#f2ecde] border-t-2 border-[#25543b] font-black text-xs">
                  <td colSpan={5} className="p-3 text-center text-[#1b3e2b]">
                    المـجـمـوع الإجـمـالـي لـطـلـيـحـة {SECTOR_NAMES[sector]}
                  </td>
                  <td className="p-3 text-left font-mono">{fmt(totals.basic)}</td>
                  <td className="p-3 text-left font-mono">{fmt(totals.seniority)}</td>
                  {allowanceNames.map((name, i) => {
                    const colSum = payrollData.reduce((acc, curr) => {
                      const found = curr.r.allAllowances.find(a => a.name === name);
                      return acc + (found ? found.amount : 0);
                    }, 0);
                    return (
                      <td key={i} className="p-3 text-left font-mono">
                        {fmt(colSum)}
                      </td>
                    );
                  })}
                  <td className="p-3 text-left font-mono">{fmt(totals.familyTotal)}</td>
                  <td className="p-3 text-left font-mono text-[#1a3d2b] font-black">{fmt(totals.gross)}</td>
                  <td className="p-3 text-left font-mono text-red-800">{fmt(totals.cnas)}</td>
                  <td className="p-3 text-left font-mono text-red-800">{fmt(totals.irg)}</td>
                  <td className="p-3 text-left font-mono text-red-800">{fmt(totals.mut)}</td>
                  <td className="p-3 text-left font-mono text-emerald-900 font-black text-sm">
                    {fmt(totals.net)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
