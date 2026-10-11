import React, { useEffect, useState } from 'react';
import { Employee, Settings } from '../types';
import { DRT_BANNER } from '../data/drtBanner';
import {
  Printer,
  Eye,
  EyeOff,
  Sparkles,
  Eraser
} from 'lucide-react';

interface DrtExcelDocProps {
  employee: Employee;
  settings: Settings;
}

interface DrtForm {
  firstName: string;
  lastName: string;
  regNum: string;
  birthDate: string;
  birthPlace: string;
  stopDate: string;
  resumeDate: string;
  mode: '' | 'resumed' | 'notResumed';
  madePlace: string;
  madeDate: string;
  socialNature: string;
  signatory: string;
}

const BLANK: DrtForm = {
  firstName: '',
  lastName: '',
  regNum: '',
  birthDate: '',
  birthPlace: '',
  stopDate: '',
  resumeDate: '',
  mode: '',
  madePlace: '',
  madeDate: '',
  socialNature: '',
  signatory: ''
};

function splitName(full: string): [string, string] {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ['', ''];
  if (parts.length === 1) return [parts[0], ''];
  return [parts[0], parts.slice(1).join(' ')];
}

function buildAuto(emp: Employee | undefined, settings: Settings): DrtForm {
  const today = new Date().toLocaleDateString('ar-DZ');
  const [first, last] = splitName(emp?.name || '');
  return {
    firstName: first,
    lastName: last,
    regNum: emp?.ssn || '',
    birthDate: emp?.birthDate || '',
    birthPlace: emp?.birthPlace || '',
    stopDate: emp?.lastWorkDate || '',
    resumeDate: emp?.resumeDate || '',
    mode: emp?.resumeDate ? 'resumed' : 'notResumed',
    madePlace: settings.wilaya || 'باتنة',
    madeDate: today,
    socialNature: settings.socialNature || settings.institution || '',
    signatory: settings.signatory || settings.director || ''
  };
}

const CSS = `
  .drtx-page * { box-sizing: border-box; }
  .drtx-page {
    background: #fff; color: #000; margin: 0 auto; position: relative;
    box-shadow: 0 0 10px rgba(0,0,0,.30);
    font-family: 'Traditional Arabic','Arabic Typesetting','Noto Naskh Arabic','Cairo',Tahoma,serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .drtx-page .dots { flex: 1; border-bottom: 1.6px dotted #000; min-height: 1.1em; margin: 0 4px; text-align: center; font-weight: 700; padding: 0 6px; }
  .drtx-page .dots[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
  .drtx-page .ln { display: flex; align-items: flex-end; gap: 4px; }
  .drtx-page .cb { display: inline-flex; align-items: center; justify-content: center; width: 4mm; height: 4mm; border: 1.4px solid #000; font-weight: 900; font-size: 10pt; line-height: 1; cursor: pointer; background: #fff; flex-shrink: 0; }
  @media print {
    .drtx-page { box-shadow: none !important; margin: 0 !important; page-break-inside: avoid; }
  }
`;

export const DrtExcelDoc: React.FC<DrtExcelDocProps> = ({ employee, settings }) => {
  const [form, setForm] = useState<DrtForm>(() => buildAuto(employee, settings));
  const [showPreview, setShowPreview] = useState(true);
  const [blankPrinting, setBlankPrinting] = useState(false);

  useEffect(() => {
    setForm(buildAuto(employee, settings));
  }, [employee?.id]);

  const set = (k: keyof DrtForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const autoFill = () => setForm(buildAuto(employee, settings));
  const clearForm = () => setForm({ ...BLANK });

  const handlePrint = () => window.print();
  const handlePrintBlank = () => {
    setBlankPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setBlankPrinting(false), 800);
    }, 250);
  };

  const f: DrtForm = blankPrinting
    ? { ...BLANK }
    : form;

  const inputCls =
    'w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none focus:border-[#047857]';
  const labelCls = 'block text-xs font-bold text-[#1e293b] mb-1';

  const toggleMode = (m: 'resumed' | 'notResumed') =>
    setForm(prev => ({ ...prev, mode: prev.mode === m ? '' : m }));

  return (
    <div className="w-full">
      {/* Mini toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <button onClick={autoFill} className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
          <Sparkles className="w-4 h-4" /><span>ملء آلي من البرنامج</span>
        </button>
        <button onClick={clearForm} className="bg-white hover:bg-[#f1f5f9] text-[#8c3b2d] border border-[#8c3b2d] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
          <Eraser className="w-4 h-4" /><span>إفراغ</span>
        </button>
        <button onClick={() => setShowPreview(v => !v)} className="bg-white hover:bg-[#f1f5f9] text-[#047857] border border-[#047857] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showPreview ? 'إخفاء المعاينة' : 'معاينة'}</span>
        </button>
        <button onClick={handlePrint} className="bg-[#047857] hover:bg-[#065f46] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
          <Printer className="w-4 h-4" /><span>طباعة (مملوءة)</span>
        </button>
        <button onClick={handlePrintBlank} className="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
          <Printer className="w-4 h-4" /><span>طباعة نسخة فارغة</span>
        </button>
      </div>

      {/* Manual fields */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 print:hidden">
        <div><label className={labelCls}>الاسم</label><input value={form.firstName} onChange={e => set('firstName', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>اللقب</label><input value={form.lastName} onChange={e => set('lastName', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>رقم التسجيل</label><input value={form.regNum} onChange={e => set('regNum', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>تاريخ الازدياد</label><input value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>مكان الازدياد (ب)</label><input value={form.birthPlace} onChange={e => set('birthPlace', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>المتوقف عن العمل في</label><input value={form.stopDate} onChange={e => set('stopDate', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>قد استأنف عمله في</label><input value={form.resumeDate} onChange={e => set('resumeDate', e.target.value)} className={inputCls} /></div>
        <div>
          <label className={labelCls}>الوضعية (خانة x)</label>
          <select value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value as DrtForm['mode'] }))} className={inputCls}>
            <option value="">— اختر —</option>
            <option value="resumed">قد استأنف عمله</option>
            <option value="notResumed">لم يباشر عمله</option>
          </select>
        </div>
        <div><label className={labelCls}>حرر بـ</label><input value={form.madePlace} onChange={e => set('madePlace', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>في (تاريخ)</label><input value={form.madeDate} onChange={e => set('madeDate', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>الطبيعة الاجتماعية</label><input value={form.socialNature} onChange={e => set('socialNature', e.target.value)} className={inputCls} /></div>
        <div><label className={labelCls}>اسم وصفة الموقع</label><input value={form.signatory} onChange={e => set('signatory', e.target.value)} className={inputCls} /></div>
      </div>

      {showPreview && (
        <div className="drtx-page" style={{ width: '210mm', minHeight: '148mm', padding: '3mm 5mm', direction: 'rtl', fontSize: '10pt', lineHeight: 1.5 }}>
          <style>{`${CSS} @page { size: A5 landscape; margin: 0; }`}</style>

          {/* CNAS banner from the Excel file */}
          <img src={DRT_BANNER} alt="CNAS" style={{ width: '100%', height: '10mm', objectFit: 'fill', display: 'block' }} />

          {/* Title */}
          <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '14pt', marginTop: '1mm' }}>تصريح بإستئناف</div>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11pt' }}>أو عدم إستئناف العمل</div>

          <div style={{ textAlign: 'right', fontWeight: 700, marginTop: '1mm' }}>أنا المستخدم الممضي أسفله أشهد أن المؤمن :</div>

          {/* Names + registration box */}
          <div style={{ display: 'flex', gap: '6mm', marginTop: '1mm' }}>
            <div style={{ flex: 1.6 }}>
              <div className="ln">
                <span style={{ whiteSpace: 'nowrap' }}>الاسم :</span>
                <span className="dots" contentEditable suppressContentEditableWarning>{f.firstName}</span>
              </div>
              <div className="ln" style={{ marginTop: '1mm' }}>
                <span style={{ whiteSpace: 'nowrap' }}>اللقب :</span>
                <span className="dots" contentEditable suppressContentEditableWarning>{f.lastName}</span>
              </div>
            </div>
            <div style={{ flex: 1, border: '1.5px solid #000', padding: '2mm 3mm', display: 'flex', alignItems: 'flex-end' }}>
              <div className="ln" style={{ width: '100%' }}>
                <span style={{ whiteSpace: 'nowrap' }}>رقم التسجيل :</span>
                <span className="dots" contentEditable suppressContentEditableWarning>{f.regNum}</span>
              </div>
            </div>
          </div>

          <div className="ln" style={{ marginTop: '1mm' }}>
            <span style={{ whiteSpace: 'nowrap' }}>تاريخ الازدياد :</span>
            <span className="dots" style={{ maxWidth: '45mm' }} contentEditable suppressContentEditableWarning>{f.birthDate}</span>
            <span style={{ whiteSpace: 'nowrap' }}>بـ :</span>
            <span className="dots" contentEditable suppressContentEditableWarning>{f.birthPlace}</span>
          </div>

          <div className="ln" style={{ marginTop: '1mm' }}>
            <span style={{ whiteSpace: 'nowrap' }}>المتوقف عن العمل في :</span>
            <span className="dots" style={{ maxWidth: '60mm' }} contentEditable suppressContentEditableWarning>{f.stopDate}</span>
          </div>

          <div className="ln" style={{ marginTop: '1mm' }}>
            <span className="cb" onClick={() => toggleMode('resumed')}>{f.mode === 'resumed' ? 'x' : ''}</span>
            <span style={{ fontSize: '9pt' }}>(1)</span>
            <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>قد استأنف عمله في :</span>
            <span className="dots" style={{ maxWidth: '60mm' }} contentEditable suppressContentEditableWarning>{f.resumeDate}</span>
          </div>

          <div className="ln" style={{ marginTop: '1mm' }}>
            <span className="cb" onClick={() => toggleMode('notResumed')}>{f.mode === 'notResumed' ? 'x' : ''}</span>
            <span style={{ fontWeight: 700 }}>لم يباشر عمله الى يومنا هذا</span>
          </div>

          <div className="ln" style={{ marginTop: '1mm', maxWidth: '130mm' }}>
            <span style={{ whiteSpace: 'nowrap' }}>حرر بـ :</span>
            <span className="dots" contentEditable suppressContentEditableWarning>{f.madePlace}</span>
            <span style={{ whiteSpace: 'nowrap' }}>في :</span>
            <span className="dots" contentEditable suppressContentEditableWarning>{f.madeDate}</span>
          </div>

          <div style={{ display: 'flex', gap: '6mm', marginTop: '1mm' }}>
            <div style={{ flex: 1.4 }}>
              <div className="ln">
                <span style={{ whiteSpace: 'nowrap' }}>الطبيعة الاجتماعية وختم المستخدم :</span>
                <span className="dots" contentEditable suppressContentEditableWarning>{f.socialNature}</span>
              </div>
              <div className="dots" style={{ marginTop: '1mm', minHeight: '5mm' }} contentEditable suppressContentEditableWarning />
            </div>
            <div style={{ flex: 1 }}>
              <div className="ln">
                <span style={{ whiteSpace: 'nowrap' }}>اسم وصفة الموقع :</span>
                <span className="dots" contentEditable suppressContentEditableWarning>{f.signatory}</span>
              </div>
              <div style={{ textAlign: 'center', fontWeight: 700, marginTop: '1mm' }}>الامضاء</div>
            </div>
          </div>

          {/* Part 2 : honor declaration */}
          <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '12pt', marginTop: '1mm' }}>تصريح شرفي</div>
          <div style={{ textAlign: 'center', fontSize: '8.5pt' }}>( يملأ من طرف المؤمن له في حالة عدم إستئناف العمل )</div>

          <div style={{ display: 'flex', gap: '6mm', marginTop: '1mm' }}>
            <div className="ln" style={{ flex: 1 }}>
              <span style={{ whiteSpace: 'nowrap' }}>الاسم :</span>
              <span className="dots" contentEditable suppressContentEditableWarning>{f.firstName}</span>
            </div>
            <div className="ln" style={{ flex: 1 }}>
              <span style={{ whiteSpace: 'nowrap' }}>اللقب :</span>
              <span className="dots" contentEditable suppressContentEditableWarning>{f.lastName}</span>
            </div>
          </div>

          <div className="ln" style={{ marginTop: '1mm' }}>
            <span style={{ whiteSpace: 'nowrap' }}>أصرح بشرفي، أنني في حالة توقف عن العمل منذ تاريخ :</span>
            <span className="dots" style={{ maxWidth: '55mm' }} contentEditable suppressContentEditableWarning>{f.stopDate}</span>
          </div>
          <div style={{ fontWeight: 700 }}>وأنني لا أمارس أي نشاط مهني :</div>

          <div className="ln" style={{ marginTop: '1mm', maxWidth: '130mm' }}>
            <span style={{ whiteSpace: 'nowrap' }}>حرر بـ :</span>
            <span className="dots" contentEditable suppressContentEditableWarning>{f.madePlace}</span>
            <span style={{ whiteSpace: 'nowrap' }}>في :</span>
            <span className="dots" contentEditable suppressContentEditableWarning>{f.madeDate}</span>
          </div>
          <div style={{ textAlign: 'left', fontWeight: 700 }}>الإمضاء</div>

          <div style={{ fontSize: '8.5pt', marginTop: '1mm' }}>(1) ضع علامة (x) في الخانة المناسبة</div>
          <div style={{ textAlign: 'center', fontSize: '8.5pt', fontWeight: 700 }}>* القانون يعاقب كل من يقوم بتزوير أو يدلي بتصريحات غير صحيحة</div>
        </div>
      )}
    </div>
  );
};
