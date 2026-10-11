import React, { useMemo, useState } from 'react';
import { Employee, Settings } from '../types';
import { JOBS, GRILLE, MONTHS_AR } from '../data/salaryGrids';
import { computePayslip } from '../utils/salaryCalculator';
import { Printer } from 'lucide-react';

interface OfficialPayrollSheetProps {
  employees: Employee[];
  settings: Settings;
  month: number;
  year: number;
  sectorLabel: string;
}

/** تنسيق الأرقام مثل الورق: فراغ للآلاف ونقطة للعشرية */
function fmtSheet(n: number): string {
  if (!isFinite(n)) return '';
  const neg = n < 0 ? '-' : '';
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  const g = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${neg}${g}.${d}`;
}

const z = (n: number) => (Math.abs(n) < 0.005 ? '' : fmtSheet(n));

export const OfficialPayrollSheet: React.FC<OfficialPayrollSheetProps> = ({
  employees,
  settings,
  month,
  year,
  sectorLabel
}) => {
  const [adminLine1, setAdminLine1] = useState('مديرية التربية لولاية باتنة');
  const [adminLine2, setAdminLine2] = useState(sectorLabel);

  const rows = useMemo(() => {
    return employees.map((emp, idx) => {
      const r = computePayslip(emp, month, year, settings);
      const job = JOBS[emp.jobIdx];
      const byName = (s: string) => r.allAllowances.find(a => a.name.startsWith(s))?.amount || 0;
      const indice = Math.round((r.basic + r.seniority) / 45);
      const suffix = (emp.ssn || '').replace(/\D/g, '').slice(-2) || '00';
      const catLabel = GRILLE[emp.category]?.cat || '';
      return {
        idx: idx + 1,
        emp,
        jobName: job?.name || 'موظف',
        ssn: emp.ssn || '',
        suffix,
        classement: `C00/00 ${catLabel} ${indice} ${catLabel} ${suffix}`,
        basic: r.basic,
        seniority: r.seniority,
        pedagogy: byName('تعويض الخبرة البيداغوجية'),
        aures: r.auresAllowance,
        forfait: byName('المنحة الجزافية'),
        privilege: byName('منحة الامتياز'),
        doc: byName('تعويض التوثيق'),
        qualif: byName('تعويض التأهيل'),
        house: byName('منحة السكن'),
        support: byName('تعويض الدعم المدرسي'),
        family: r.familyTotal,
        gross: r.gross,
        cnas: r.cnasDeduction,
        cnasBase: r.cnasBase,
        irg: r.irgTax,
        irgBase: r.irgBase,
        mutuelle: r.mutDeduction,
        net: r.net
      };
    });
  }, [employees, month, year, settings]);

  const numKeys = ['basic', 'seniority', 'pedagogy', 'aures', 'forfait', 'privilege', 'doc', 'qualif', 'house', 'support', 'family', 'gross', 'cnas', 'cnasBase', 'irg', 'irgBase', 'mutuelle'];

  const tot = useMemo(() => {
    const t: Record<string, number> = {};
    [...numKeys, 'net'].forEach(k => {
      t[k] = Math.round(rows.reduce((a, r) => a + ((r as any)[k] as number), 0) * 100) / 100;
    });
    return t;
  }, [rows]);

  const handlePrint = () => window.print();

  const th = 'border border-black bg-[#9aa0a6] text-black font-bold px-1 py-1 text-center align-middle';
  const td = 'border border-black px-1 py-0.5 text-center align-middle whitespace-nowrap';
  const tdR = 'border border-black px-1 py-0.5 text-right align-middle';

  const cols: { key: string; label: string; get: (r: (typeof rows)[number]) => number | string; num?: boolean }[] = [
    { key: 'n', label: 'سطر', get: r => r.idx },
    { key: 'ssn', label: 'رقم', get: r => r.ssn },
    { key: 'name', label: 'الاسم واللقب', get: () => '' },
    { key: 'h', label: 'ح.ع', get: () => '' },
    { key: 'cl', label: 'التصنيف', get: r => r.classement },
    { key: 'basic', label: 'الاجر القاعدي', get: r => r.basic, num: true },
    { key: 'sen', label: 'خبرة مهنية', get: r => r.seniority, num: true },
    { key: 'ped', label: 'خبرة بيداغوجية', get: r => r.pedagogy, num: true },
    { key: 'aur', label: 'م.اوراس', get: r => r.aures, num: true },
    { key: 'for', label: 'م.جزافية', get: r => r.forfait, num: true },
    { key: 'pri', label: 'م.الامتياز', get: r => r.privilege, num: true },
    { key: 'doc', label: 'م.توثيق', get: r => r.doc, num: true },
    { key: 'qua', label: 'م.تأهيل', get: r => r.qualif, num: true },
    { key: 'hou', label: 'م.مسكن', get: r => r.house, num: true },
    { key: 'sup', label: 'م.دعم', get: r => r.support, num: true },
    { key: 'fam', label: 'م.عقلية', get: r => r.family, num: true },
    { key: 'gro', label: 'الاجر الخام', get: r => r.gross, num: true },
    { key: 'cna', label: 'ض.باح', get: r => r.cnas, num: true },
    { key: 'cnb', label: 'إض.خ', get: r => r.cnasBase, num: true },
    { key: 'irg', label: 'إقتضد', get: r => r.irg, num: true },
    { key: 'irb', label: 'خاضع ض', get: r => r.irgBase, num: true },
    { key: 'mut', label: 'تعاضدية', get: r => r.mutuelle, num: true },
    { key: 'oth', label: 'أخرى', get: () => '' },
    { key: 'net', label: 'الصافي', get: r => r.net, num: true }
  ];

  return (
    <div className="w-full">
      <style>{`
        @page { size: A4 landscape; margin: 6mm; }
        .ops-page * { box-sizing: border-box; }
        .ops-page {
          background: #fff; color: #000; margin: 0 auto;
          font-family: 'Traditional Arabic','Arial',serif;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
          width: 285mm;
        }
        .ops-page table { border-collapse: collapse; width: 100%; table-layout: auto; }
        .ops-page th { font-size: 7.5pt; }
        .ops-page td { font-size: 8pt; }
        .ops-page td[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
        @media print {
          .ops-page { width: 100%; box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="flex justify-end mb-3 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الكشف الرسمي</span>
        </button>
      </div>

      <div className="ops-page shadow-md p-2 overflow-x-auto">
        {/* Header block */}
        <div className="flex justify-between items-start mb-1 px-1">
          <div className="text-right text-[9pt] font-bold leading-relaxed">
            <div contentEditable suppressContentEditableWarning>{adminLine1}</div>
            <div className="text-[8pt] font-normal">الإدارة<br />المصلحة</div>
          </div>
          <div className="text-center">
            <div className="font-black text-[13pt]">كشف الرواتب المدفوعة لشهر {MONTHS_AR[month] || ''} {year}</div>
          </div>
          <div className="text-left text-[9pt] font-bold leading-relaxed">
            <div contentEditable suppressContentEditableWarning>{adminLine2}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} className={th}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.idx}>
                <td className={td}>{r.idx}</td>
                <td className={td} style={{ fontSize: '7.5pt' }}>
                  <div>{r.ssn}</div>
                  <div className="text-slate-600">{r.ssn ? `${r.ssn}/${r.suffix}` : ''}</div>
                </td>
                <td className={tdR} style={{ minWidth: '28mm' }}>
                  <div className="font-bold">{r.emp.name}</div>
                  <div className="text-slate-700" style={{ fontSize: '7pt' }}>{r.jobName}</div>
                </td>
                <td className={td} contentEditable suppressContentEditableWarning />
                <td className={td} style={{ fontSize: '7pt' }} contentEditable suppressContentEditableWarning>{r.classement}</td>
                {numKeys.map(k => (
                  <td key={k} className={td} contentEditable suppressContentEditableWarning>
                    {z(r[k] as number)}
                  </td>
                ))}
                <td className={td} contentEditable suppressContentEditableWarning />
                <td className={td + ' font-black'}>{fmtSheet(r.net)}</td>
              </tr>
            ))}
            <tr>
              <td className={td} colSpan={5}>المجموع</td>
              {numKeys.map(k => (
                <td key={k} className={td + ' font-black'}>
                  {fmtSheet(tot[k])}
                </td>
              ))}
              <td className={td} />
              <td className={td + ' font-black'}>{fmtSheet(tot.net)}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-center text-[10pt] font-bold mt-2">الأمر بالصرف</div>
      </div>
    </div>
  );
};
