import React, { useState } from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';
import { fmt } from '../utils/salaryCalculator';
import { Printer, Download, Sparkles, Info } from 'lucide-react';

/* ==========================================================================
   استمارات ملف برنامج الرواتب الأصلي — منسوخة طبق الأصل وتعمل ببيانات البرنامج:
   1) جدول سحب المنح العائلية        2) جدول التكفل بالمنح العائلية (ادراج)
   3) رسالة توضيحية (تغيرات 36 شهرا)  4) كشف الجامعة (منحة دراسية جامعية)
   5) التعاضدية الوطنية لعمال التربية والثقافة
   6) أداة متابعة المنح العائلية (الجدول التفاعلي)
   ========================================================================== */

const OFF_HEADER = `
  .sdoc * { box-sizing: border-box; }
  .sdoc { width: 210mm; min-height: 297mm; background: #fff; margin: 0 auto;
    padding: 12mm 14mm; direction: rtl; text-align: right; color: #000;
    font-family: 'Amiri','Traditional Arabic','Times New Roman',serif; font-size: 13.5pt; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; box-shadow: 0 0 10px rgba(0,0,0,.35); }
  @media print {
    html, body { background:#fff !important; margin:0 !important; padding:0 !important; }
    .sdoc { box-shadow: none !important; }
  }
  .sdoc .hdr { text-align: center; font-weight: bold; font-size: 14pt; line-height: 1.45; margin-bottom: 8px; }
  .sdoc .subhdr { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 2px; }
  .sdoc .instrows { display:flex; justify-content: space-between; font-weight: bold; margin: 6px 0 2px; }
  .sdoc .inp { display:inline-block; border-bottom: 1px dotted #000; outline: none; font-weight: bold;
    min-width: 1em; padding: 0 3px; unicode-bidi: plaintext; }
  .sdoc .inp:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
  .sdoc table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
  .sdoc th, .sdoc td { border: 1px solid #000; padding: 3px 4px; text-align: center; }
  .sdoc th { font-weight: bold; background: #f2f2f2; }
`;

/** تاريخ serial إكسل أو نص إلى yyyy-mm-dd (للاستعمال الذاتي هنا) */
function toIso(v: unknown): string {
  const n = Number(v);
  if (!isNaN(n) && n > 25000 && n < 80000) {
    const d = new Date(Math.round((n - 25569) * 86400000));
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
  return typeof v === 'string' ? v : '';
}
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addYears = (bd: string, y: number) => {
  if (!bd) return '';
  const d = new Date(bd + 'T00:00:00Z');
  if (isNaN(d.getTime())) return '';
  d.setUTCFullYear(d.getUTCFullYear() + y);
  return iso(d);
};
const ageOf = (bd: string) => {
  if (!bd) return null;
  const d = new Date(bd + 'T00:00:00Z');
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 31557600000);
};
/** تقسيم الاسم: آخر كلمة = اللقب والباقي = الإسم (نفس ترتيب البرنامج الأصلي) */
const splitName = (name: string): { nom: string; prenom: string } => {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length === 1) return { nom: parts[0], prenom: '' };
  return { nom: parts[parts.length - 1], prenom: parts.slice(0, -1).join(' ') };
};
const sq = (s: string) => (s || '').replace(/"/g, '&quot;');

/** رأس رسمي مشترك */
const Header: React.FC<{ settings: Settings; extra?: React.ReactNode }> = ({ settings, extra }) => (
  <>
    <div className="hdr">
      <div>الجمهورية الجزائرية الديمقراطية الشعبية</div>
      <div>وزارة التربية الوطنية</div>
    </div>
    <div className="subhdr">مديرية التربية لولاية : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 170, textAlign: 'center' }}>{sq(settings.wilaya || 'باتنــــــة')}</span></div>
    <div className="instrows">
      <span>المؤسســـة : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 300, textAlign: 'center' }}>{sq(settings.institution || '')}</span></span>
      {extra}
    </div>
  </>
);

/* ============ 1+2) جدول سحب / التكفل بالمنح العائلية ============ */
export const FamilyTableDoc: React.FC<{ employee: Employee; settings: Settings; mode: 'withdraw' | 'insert' }> = ({ employee, settings, mode }) => {
  const isWithdraw = mode === 'withdraw';
  const currentYear = new Date().getFullYear();
  const name = employee.name || '';
  const job = JOBS[employee.jobIdx];
  const nChildren = employee.children || 0;
  const nOld10 = employee.children10 || 0;
  const today = iso(new Date()).replace(/-/g, '/');
  // الصف الأول معبأ آلياً من سجل الموظف (قابل للتعديل) والبقية فارغة للملء اليدوي
  const rows = [{
    id: 1,
    code: '',
    name,
    cat: job ? String(job.cat) : '',
    oldM: employee.marital === 'متزوج' ? 'نعم' : 'لا',
    oldCh: nChildren,
    old10: nOld10,
    oldSw: employee.singleWage ? 'نعم' : 'لا',
    newM: employee.marital === 'متزوج' ? 'نعم' : 'لا',
    newCh: nChildren,
    new10: nOld10,
    newSw: employee.singleWage ? 'نعم' : 'لا',
    date: today
  }];
  return (
    <div className="sdoc-wrap"><style>{OFF_HEADER}</style>
      <div className="sdoc">
        <Header settings={settings} extra={
          <span>السنة الدراسية : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 54, textAlign: 'center' }}>{currentYear}</span> / <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 54, textAlign: 'center' }}>{currentYear + 1}</span></span>
        } />
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 15.5, margin: '14px 0', textDecoration: 'underline' }}>{isWithdraw ? 'جدول سحب المنح العائلية' : 'جدول التكفل بالمنح العائلية'}</div>
        <div style={{ fontWeight: 'bold', margin: '8px 0' }}>الإدارة الأولى : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 260 }}>{sq(JOBS[employee.jobIdx] && (JOBS[employee.jobIdx].domain === 'teach' ? 'التعليم' : JOBS[employee.jobIdx].domain === 'edu' ? 'مستخدمو الهيئة والتربية' : 'العمال المهنيين الإداريين') || 'العمال المهنيين')}</span></div>
        <table>
          <thead>
            <tr>
              <th rowSpan={2}>الرقم ت</th>
              <th rowSpan={2}>رقم تعريف الموظف</th>
              <th rowSpan={2}>الاسم واللقب</th>
              <th rowSpan={2}>الصنف والقسم</th>
              <th colSpan={4}>الوضعية القديمة</th>
              <th colSpan={4}>الوضعية الجديدة</th>
              <th rowSpan={2}>{isWithdraw ? 'تاريخ السحب' : 'تاريخ التكفل'}</th>
            </tr>
            <tr>
              <th>متزوج/ة</th><th>عدد الأطفال</th><th>عدد اطفال اكبر من 10س</th><th>الأجر الوحيد</th>
              <th>متزوج/ة</th><th>عدد الأطفال</th><th>عدد اطفال اكبر من 10س</th><th>الأجر الوحيد</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 20 }}>{r.id}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 70 }}></td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 130, fontWeight: 'bold' }}>{sq(r.name)}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 40 }}>{sq(r.cat)}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{sq(r.oldM)}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{r.oldCh}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{r.old10}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{sq(r.oldSw)}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{sq(r.newM)}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{r.newCh}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{r.new10}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 30 }}>{sq(r.newSw)}</td>
                <td className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 80 }}>{r.date}</td>
              </tr>
            ))}
            {Array.from({ length: 16 }, (_, i) => (
              <tr key={'e' + i}>
                <td className="inp" contentEditable suppressContentEditableWarning>{i + 2}</td>
                {Array.from({ length: 12 }, (_, c) => <td key={c} className="inp" contentEditable suppressContentEditableWarning>&nbsp;</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ============ 3) رسالة توضيحية ============ */
export const ExplanationLetter: React.FC<{ employee: Employee; settings: Settings }> = ({ employee, settings }) => {
  const { nom, prenom } = splitName(employee.name || '');
  const jobName = JOBS[employee.jobIdx]?.name || '';
  const sig = settings.signatory || settings.director || '';
  const today = iso(new Date()).replace(/-/g, '/');
  return (
    <div className="sdoc-wrap"><style>{OFF_HEADER}</style>
      <div className="sdoc">
        <Header settings={settings} />
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, textDecoration: 'underline', margin: '16px 0' }}>رسالة توضيحية</div>
        <div style={{ lineHeight: 2 }}>
          <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 640 }}>انا الممضي أسفله مقتصد {sq(settings.institution || '')} أشهد ان التغيرات الطارئة على مرتب</span>
        </div>
        <div style={{ margin: '6px 0' }}>
          <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 240 }}>{sq(`${nom} ${prenom}`.trim())}</span>
          <span style={{ fontWeight: 'bold' }}> . </span> الوظيفة : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 240 }}>{sq(jobName)}</span>
        </div>
        <div style={{ margin: '6px 0' }}>
          <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 640 }}>طيلة 36 شهرا الأخيرة من نشاط المعني تتمثل فيما يلي :</span>
        </div>
        <table style={{ marginTop: 10 }}>
          <thead>
            <tr><th style={{ width: 40 }}>الرقم</th><th style={{ width: 120 }}>الشهر / السنة</th><th>سبب التغير</th><th style={{ width: 170 }}>ملاحظات</th></tr>
          </thead>
          <tbody>
            {Array.from({ length: 14 }, (_, i) => (
              <tr key={i}>
                <td>{String(i + 1).padStart(2, '0')}</td>
                <td className="inp" contentEditable suppressContentEditableWarning>&nbsp;</td>
                <td className="inp" contentEditable suppressContentEditableWarning>&nbsp;</td>
                <td className="inp" contentEditable suppressContentEditableWarning>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ margin: '24px 0 4px', fontWeight: 'bold' }}>
          حرر بـ<span className="inp" contentEditable suppressContentEditableWarning style={{ width: 130, textAlign: 'center' }}>{sq(settings.municipality || '')}</span>
          <span style={{ margin: '0 8px' }}>في :</span>
          <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 110, textAlign: 'center' }}>{today}</span>
        </div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: 20 }}>المقتصـــــــــــــد</div>
      </div>
    </div>
  );
};

/* ============ 5) التعاضدية ============ */
export const MutuelleCert: React.FC<{ employee: Employee; settings: Settings }> = ({ employee, settings }) => {
  const { nom, prenom } = splitName(employee.name || '');
  const jobName = JOBS[employee.jobIdx]?.name || '';
  const today = iso(new Date()).replace(/-/g, '/');
  return (
    <div className="sdoc-wrap"><style>{OFF_HEADER}</style>
      <div className="sdoc">
        <Header settings={settings} extra={
          <span>رمز التعيين : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 70, textAlign: 'center' }}>{'05/418'}</span></span>
        } />
        <div style={{ margin: '26px 0 6px' }}>
          <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 470 }}>نحن السيد : المسير المالي لـ {sq(settings.institution || '')}</span>
        </div>
        <div style={{ margin: '8px 0' }}>
          <span>نشهد بأن السيد (ة) اللقب : <span className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 140, textAlign: 'center' }}>{sq(nom)}</span></span>
          <span style={{ margin: '0 12px' }}>الإسم : <span className="inp" contentEditable suppressContentEditableWarning style={{ minWidth: 140, textAlign: 'center' }}>{sq(prenom)}</span></span>
        </div>
        <div style={{ margin: '8px 0' }}>
          <span>الوظيفة قبل الإحالة على التقاعد : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 260, textAlign: 'center' }}>{sq(jobName)}</span></span>
        </div>
        <div style={{ margin: '8px 0' }}>
          <span>مكان العمل قبل الإحالة على التقاعد : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 260, textAlign: 'center' }}>{sq(settings.institution || '')}</span></span>
        </div>
        <div style={{ margin: '18px 0 6px' }}>
          <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 640 }}>سدد (ت) اشتراكاته (ها) للتعاضدية الوطنية لعمال التربية والثقافة بانتظام ودون انقطاع</span>
        </div>
        <div style={{ margin: '14px 0' }}>
          <span>من : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 130, textAlign: 'center' }}></span></span>
          <span style={{ margin: '0 20px' }}>إلى : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 130, textAlign: 'center' }}></span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30 }}>
          <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 200 }}>{sq(settings.municipality || '')}</span>
          <div>
            <span>فـــــي : <span className="inp" contentEditable suppressContentEditableWarning style={{ width: 110, textAlign: 'center' }}>{today}</span></span>
          </div>
        </div>
        <div style={{ fontWeight: 'bold', marginTop: 24 }}>المسير المالي</div>
      </div>
    </div>
  );
};

/* ============ 6) أداة متابعة المنح العائلية ============ */
interface FollowRow { i: number; birth: string; studying: boolean }
export const FamilyFollowTool: React.FC<{ employees: Employee[]; settings: Settings; selectedEmpId?: string; onSaveEmp?: (e: Employee) => void }> = ({ employees, settings, selectedEmpId, onSaveEmp }) => {
  const [empId, setEmpId] = useState<string>(selectedEmpId || employees[0]?.id || '');
  const emp = employees.find(e => e.id === empId) || employees[0];
  const [refYear, setRefYear] = useState<number>(new Date().getFullYear());
  const [rows, setRows] = useState<FollowRow[]>(() => (emp?.childrenBirths || []).map((b, i) => ({ i, birth: b, studying: false })));
  React.useEffect(() => {
    if (emp) setRows((emp.childrenBirths || []).map((b, i) => ({ i, birth: b, studying: false })));
  }, [empId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!emp) return (<div className="py-12 text-center text-[#64748b]">سجل موظفا أولا لعرض متابعة المنح العائلية.</div>);

  const married = emp.marital === 'متزوج';
  const singleWage = emp.singleWage && emp.children > 0;
  const nChildren = Math.max(emp.children || 0, rows.filter(r => r.birth).length);
  const old10 = rows.filter(r => { const a = ageOf(r.birth); return a !== null && a >= 10; }).length;
  const granted = rows.filter(r => r.birth && (ageOf(r.birth) || 0) < 10)
    .concat(rows.filter(r => r.birth && (ageOf(r.birth) || 0) >= 10 && r.studying)).length;
  const childRate = settings.childRate || 300;
  const child10Rate = settings.child10Rate || 11.25;
  const singleRate = settings.singleWageRate || 800;
  const marNoChild = emp.singleWage && emp.children === 0 && emp.marital === 'متزوج';
  const sum = nChildren * childRate + old10 * child10Rate + (singleWage ? singleRate : 0) + (marNoChild ? (settings.maritalNoChildRate || 5.5) : 0);

  const setBirth = (i: number, v: string) => {
    const next = rows.map(r => r.i === i ? { ...r, birth: v } : r);
    setRows(next);
    if (onSaveEmp) {
      const births = next.filter(r => r.birth).map(r => r.birth).sort();
      onSaveEmp({ ...emp, childrenBirths: births, children: Math.max(emp.children, births.length) });
    }
  };
  const setStudying = (i: number, v: boolean) => {
    const next = rows.map(r => r.i === i ? { ...r, studying: v } : r);
    setRows(next);
    if (onSaveEmp) {
      const c10 = next.filter(r => r.birth && (ageOf(r.birth) || 0) >= 10).length;
      onSaveEmp({ ...emp, children10: c10 });
    }
  };
  const addChild = () => {
    const next = [...rows, { i: (rows[rows.length - 1]?.i ?? -1) + 1, birth: '', studying: false }];
    setRows(next);
  };
  const delRow = (i: number) => {
    const next = rows.filter(r => r.i !== i).map((r, k) => ({ ...r, i: k }));
    setRows(next);
    if (onSaveEmp) {
      const births = next.filter(r => r.birth).map(r => r.birth);
      onSaveEmp({ ...emp, childrenBirths: births });
    }
  };
  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      <style>{`
        .fut-table th, .fut-table td { border: 1px solid #d0d7e2; padding: 4px 6px; text-align: center; font-size: 12px; }
        .fut-table th { background: #eef5f0; font-weight: 800; color: #0f172a; }
        .fut-table input[type=date] { border: none; background: transparent; font: inherit; width: 100%; }
        .fut-warn { background: #fef3c7 !important; }
        .fut-stop { background: #fee2e2 !important; }
        .fut-ok { background: #dcfce7 !important; }
      `}</style>
      {/*
        الفاصلة العلوية تتحكم في عرض الشبكة، محتوى Sheets (متابعة المنح العائلية) طبق الأصل
      */}
      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
        <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#047857]" />
          متابعة المنح العائلية
        </h2>
        <p className="text-xs text-[#64748b] mt-1">
          الحالة لكل طفل: الاستفادة من منحة العائلية عن العمر (بلوغ 10 ، 17 ، 21) — الحقول المعدّلة تُحفظ آلياً في سجل الموظف.
        </p>
      </div>

      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
        <div className="grid cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">اختيار الموظف</label>
            <select value={empId} onChange={e => setEmpId(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a]">
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} — ({JOBS[e.jobIdx]?.name || 'موظف'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">سنة المرجعي</label>
            <input type="number" value={refYear} onChange={e => setRefYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold" />
          </div>
          <div className="bg-[#fffbeb] border border-[#fcd34d] rounded-xl p-2.5 text-[11px] text-[#92400e] flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>بلوغ 10 سنوات : تنبيه سحب المنحة (إلا إذا أتم الدراسة). بلوغ 21 : توقيف قاطع.</span>
          </div>
          <button
            onClick={addChild}
            className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
          >
            + إضافة طفل
          </button>
        </div>
      </div>

      {/* بيانات الموظف والملخص */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-[#a7f3d0] rounded-3xl p-5 shadow-sm">
          <div className="font-black text-[#0f172a] mb-2">{emp.name}</div>
          <div className="text-xs text-[#475569] mb-1">الوظيفة : {JOBS[emp.jobIdx]?.name}</div>
          <div className="text-xs text-[#475569] mb-1">الحالة العائلية : {emp.marital}</div>
          <div className="text-xs text-[#475569]">الأجر الوحيد : {emp.singleWage ? 'نعم' : 'لا'}</div>
        </div>
        <div className="bg-white border border-[#a7f3d0] rounded-3xl p-5 shadow-sm">
          <table className="fut-table w-full">
            <tbody>
              <tr><td>المنحة العائلية للطفل (دج)</td><td className="font-bold">{fmt(childRate * 12)}</td></tr>
              <tr><td>منحة الزوج(ة) غير العامل/ة (دج/شهر)</td><td className="font-bold">{singleWage ? fmt(singleRate) : fmt(marNoChild ? (settings.maritalNoChildRate || 5.5) : 0)}</td></tr>
              <tr><td>عدد الأطفال</td><td className="font-bold">{nChildren}</td></tr>
              <tr><td>عدد الأطفال الأكبر من 10 سنوات</td><td className="font-bold">{old10}</td></tr>
              <tr><td>عدد الأطفال الممنوحين</td><td className="font-bold">{granted}</td></tr>
              <tr><td>مجموع المنح العائلية الشهرية (دج)</td><td className="font-black">{fmt(sum)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* جدول الأطفال (10 خانات مطابقة للأصل) */}
      <div className="bg-white border border-[#a7f3d0] rounded-3xl p-4 sm:p-6 shadow-sm overflow-x-auto">
        <table className="fut-table w-full" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ width: 46 }}>الطفل</th>
              <th style={{ width: 130 }}>تاريخ الميلاد</th>
              <th style={{ width: 55 }}>السن</th>
              <th style={{ width: 125 }}>تاريخ بلوغه 10 سنوات</th>
              <th style={{ width: 125 }}>تاريخ اتمامه 17 سنة</th>
              <th style={{ width: 125 }}>تاريخ اتمامه 21 سنة</th>
              <th style={{ width: 70 }}>اتم 17</th>
              <th style={{ width: 96 }}>حالة المنحة</th>
              <th style={{ width: 46 }}>حذف</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const a = ageOf(r.birth);
              const stopNow = a !== null && a >= 10 && !r.studying;
              const warn = a !== null && a >= 8 && a < 10;
              const maxAge = a !== null && a >= 21;
              return (
                <tr key={r.i} className={maxAge || stopNow ? 'fut-stop' : warn ? 'fut-warn' : 'fut-ok'}>
                  <td className="font-bold">{String(r.i + 1).padStart(2, '0')}</td>
                  <td>
                    <input type="date" value={r.birth} onChange={e => setBirth(r.i, e.target.value)} />
                  </td>
                  <td className={a !== null && a >= 10 ? 'font-black' : ''}>{a === null ? '—' : a}</td>
                  <td>{addYears(r.birth, 10) || '—'}</td>
                  <td>{addYears(r.birth, 17) || '—'}</td>
                  <td>{addYears(r.birth, 21) || '—'}</td>
                  <td>
                    <input type="checkbox" checked={r.studying} onChange={e => setStudying(r.i, e.target.checked)} />
                  </td>
                  <td className="font-bold">{stopNow ? 'سحب المنحة' : maxAge ? 'تجاوز 21' : 'ممنوح'}</td>
                  <td>
                    <button onClick={() => delRow(r.i)} className="text-red-600 font-black px-2" title="حذف السطر">✕</button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="text-[#64748b]">لا توجد أطفال بعد — أضف طفلا أو استورد بيانات الأطفال من ملف البرنامج الأصلي.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};