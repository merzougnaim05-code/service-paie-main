import React, { useEffect, useState } from 'react';
import { Employee, Settings } from '../types';
import { CNAS_LOGO } from '../data/cnasLogo';
import {
  Printer,
  Eye,
  EyeOff,
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
  const today = new Date().toISOString().slice(0, 10);
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

/* ============================================================
   AS-09 الرسمية (PDF مقياس 397×622 نقطة = 140×220 مم)
   كل موضع مقاس رقمياً بكسل-بكسل من رندر PDF (im × 0.29406)
   الصفحة: 529×832px — العمود: 470px عند x29 — الصندوق الأول 330px، الثاني 244px
   جميع التسميات سوداء، العناوين سوداء وأجسام التواريخ بخانات مركّبة (6 خانات)
   ============================================================ */
const CSS = `
  .drtx-page * { box-sizing:border-box; }
  .drtx-page {
    font-family:'Traditional Arabic','Simplified Arabic','Sakkal Majalla','Noto Naskh Arabic','Times New Roman',serif;
    background:#fff; color:#000; margin:0 auto; position:relative;
    box-shadow:0 0 10px rgba(0,0,0,.30);
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  /* الوثيقة بمقياس A5 الكامل (148×210مم): التصميم الداخلي 140×220مم مكبوس بمؤثر zoom موحد وعلى الوسط */
  .drtx-fit { width:140mm; min-height:220mm; position:relative; zoom:0.9545; }
  .drtx-col { position:absolute; top:0; left:29px; width:470px; height:796px; }

  /* ===== شريط CNAS الأسود: h76 عند y19 ===== */
  .drtx-banner {
    position:absolute; top:19px; left:0; width:470px; height:77px; background:#000;
  }
  .drtx-banner img { position:absolute; left:31px; top:2px; width:73px; height:73px; }
  .drtx-banner .bl1 { position:absolute; top:13px; right:11px; left:0; text-align:center; color:#fff; font-size:10.5px; }
  .drtx-banner .bl2 { position:absolute; top:33px; right:11px; left:0; text-align:center; color:#fff; font-size:14.5px; font-weight:700; }
  .drtx-banner .bl3 { position:absolute; top:55px; right:11px; left:0; text-align:center; color:#fff; font-size:10.5px; font-weight:700; }

  /* ===== العنوانان + مربع التأشيرة ===== */
  .drtx-stamp { position:absolute; left:282px; top:104px; width:188px; height:104px; border:1.3px solid #333; border-radius:14px; }
  .drtx-stamp .lbl { position:absolute; bottom:9px; left:0; width:100%; text-align:center; font-size:13px; font-weight:700; }
  .drtx-t1 { position:absolute; top:130px; left:0; width:282px; text-align:center; font-size:17px; font-weight:700; line-height:1; }
  .drtx-t2 { position:absolute; top:153px; left:0; width:282px; text-align:center; font-size:17px; font-weight:700; line-height:1; }
  .drtx-t2 .ul { border-bottom:1.3px solid #000; padding-bottom:1px; }

  /* ===== الصندوق الأول 330px ===== */
  .drtx-box1 { position:absolute; top:213px; left:0; width:470px; height:331px; border:1.2px solid #000; }
  .drtx-e { position:absolute; outline:none; font-weight:700; white-space:nowrap; }
  .drtx-lbl { position:absolute; font-weight:700; white-space:nowrap; }

  .drtx-ana { top:11px; right:26px; font-size:11.5px; }

  .drtx-isl, .drtx-lql { right:10px; font-size:11.5px; }
  .drtx-isl { top:40px; }
  .drtx-lql { top:62px; }

  /* خط النقاط المنقط (نقاط أصغر — تختفي تلقائيا عند ملء الخانة) */
  .drtx-harr .dots, .drtx-harr2 .dots { position:relative; }
  .drtx-dots::after, .drtx-harr .dots::after, .drtx-harr2 .dots::after {
    content:''; position:absolute; left:0; right:0; bottom:1px; height:1.5px;
    background-image:radial-gradient(circle, #000 0.65px, transparent 0.9px);
    background-size:5px 1.5px; background-repeat:repeat-x;
  }
  .drtx-dots.filled::after, .drtx-harr .dots.filled::after, .drtx-harr2 .dots.filled::after { display:none; }

  .drtx-dName { left:203px; width:204px; height:17px; top:41px; font-size:13.5px; text-align:center; }
  .drtx-dName2 { left:203px; width:204px; height:17px; top:63px; font-size:13.5px; text-align:center; }

  /* مربع رقم التسجيل (داخل الصندوق): أرقام حرة فوق التسمية — الخط يمر متصلاً من حد لحد */
  .drtx-reg1 { position:absolute; left:10px; top:39px; width:189px; height:39px; border:1.2px solid #000; border-bottom:0; }
  .drtx-regcells { position:absolute; top:5px; left:6px; right:6px; height:16px; display:flex; direction:ltr; align-items:flex-end; }
  .drtx-regcells i { font-style:normal; flex:1; display:flex; align-items:flex-end; justify-content:center; font-size:10px; font-weight:700; line-height:1; }
  /* التسمية هي خط الأسفل الوحيد (بلا حدّين مزدوجَين): شرطات على الحافة نفسها → خط واحد مصدر واحد */
  .drtx-reglbl { position:absolute; bottom:0; left:0; right:0; height:0; display:flex; align-items:center; font-size:11px; font-weight:700; }
  .drtx-reglbl .dash { flex:1 1 0; min-width:12px; height:1.2px; background:#000; }
  .drtx-reglbl .dash:first-child { margin-left:-1.8px; }
  .drtx-reglbl .dash:last-child { margin-right:-1.8px; }
  .drtx-reglbl b { background:#fff; padding:0 3px; font-weight:700; line-height:11px; }

  /* صف تاريخ الإزياد */
  .drtx-bl { top:92px; right:10px; font-size:11.5px; }
  .drtx-be { top:90px; left:230px; font-size:11.5px; width:14px; }
  .drtx-dBirth { left:9px; width:216px; height:16px; top:91px; font-size:12.5px; text-align:center; }

  /* صف التوقف */
  .drtx-sl { top:117px; right:26px; font-size:11.5px; }

  /* سطرا الاستئناف مع مربع x وعلامة (1) وخط عليه تاريخ */
  .drtx-cb { position:absolute; width:16px; height:16px; border:1.2px solid #000; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:900; line-height:1; padding:0; }
  .drtx-flab { font-size:11.5px; }
  .drtx-f1 { top:142px; right:194px; }
  .drtx-f2 { top:166px; right:165px; }
  .drtx-fcb1 { top:142px; left:315px; }
  .drtx-fcb2 { top:164px; left:315px; }
  .drtx-fn { top:151px; left:341px; font-size:9px; font-weight:700; }

  /* المكون: خط التاريخ المركّب — أنصاف مربعات (شُرط داخلية أعلى) و أرقام بين الخطوط */
  .drtx-comb { position:absolute; height:14px; display:flex; direction:ltr; }
  .drtx-comb::after { content:''; position:absolute; left:0; bottom:0; width:1.2px; height:14px; background:#000; }
  .drtx-comb .c { flex:1; position:relative; border-bottom:1.2px solid #000; display:flex; align-items:flex-end; justify-content:center; font-size:10px; font-weight:700; line-height:1; padding:0 1px; }
  .drtx-comb .c:not(:last-child)::before { content:''; position:absolute; right:-1px; bottom:0; width:1px; height:11px; background:#000; }
  .drtx-comb .c:last-child::before { content:''; position:absolute; right:-1px; bottom:0; width:1.2px; height:14px; background:#000; }
  .drtx-comb .ctx { position:absolute; top:-3px; left:0; right:0; text-align:center; font-size:10.5px; font-weight:700; outline:none; white-space:nowrap; line-height:1; }

  .comb-birth { left:250px; top:89px; width:125px; }
  .comb-stop { left:194px; top:117px; width:125px; }
  .comb-f1 { left:38px; top:139px; width:126px; }
  .comb-f2 { left:38px; top:162px; width:126px; }

  /* حرر بـ ... ، في ... */
  .drtx-harr { position:absolute; top:199px; left:8px; width:238px; display:flex; align-items:flex-end; direction:rtl; }
  .drtx-harr .lb { font-size:12.5px; font-weight:700; white-space:nowrap; }
  .drtx-harr .dots { height:16px; font-size:11.5px; font-weight:700; text-align:center; outline:none; line-height:12px; }
  .drtx-harr .d1 { flex:0.88; }
  .drtx-harr .d2 { flex:1.12; }

  /* التسميات + القيم فوق خط النقاط */
  .drtx-ltn { top:219px; right:24px; font-size:11.5px; }
  .drtx-ltw { top:219px; left:67px; font-size:11.5px; }
  .drtx-vNat { top:233px; left:314px; width:132px; text-align:center; font-size:13px; }
  .drtx-vSig { top:233px; left:67px; width:99px; text-align:center; font-size:13px; }
  .drtx-sline { position:absolute; top:251px; left:13px; width:233px; height:2px; background-image:radial-gradient(circle, #000 1.3px, transparent 1.55px); background-size:9px 4px; background-repeat:repeat-x; }
  .drtx-sig1 { position:absolute; top:267px; left:107px; width:34px; text-align:center; font-size:11.5px; font-weight:700; }

  /* ===== صندوق التصريح الشرفي 244px ===== */
  .drtx-box2 { position:absolute; top:551px; left:0; width:470px; height:245px; border:1.2px solid #000; }
  .drtx-h1 { position:absolute; top:6px; left:0; width:470px; text-align:center; font-size:16.5px; font-weight:700; line-height:1.1; }
  .drtx-h2 { position:absolute; top:31px; left:0; width:470px; text-align:center; font-size:11.5px; font-weight:700; }

  .drtx-rg2 { position:absolute; left:10px; top:66px; width:189px; height:33px; border:1.2px solid #000; border-bottom:0; }
  .drtx-nisl { position:absolute; top:65px; right:10px; font-size:11.5px; font-weight:700; white-space:nowrap; }
  .drtx-nlql { position:absolute; top:86px; right:10px; font-size:11.5px; font-weight:700; white-space:nowrap; }
  .drtx-ndName { left:205px; width:202px; height:16px; font-size:13.5px; text-align:center; }
  .drtx-nameA { top:67px; }
  .drtx-nameB { top:88px; }

  .drtx-decl { position:absolute; top:120px; right:21px; font-size:11.5px; white-space:nowrap; }
  .drtx-decl2 { position:absolute; top:141px; right:12px; font-size:11px; white-space:nowrap; }

  .drtx-harr2 { position:absolute; top:166px; left:8px; width:238px; display:flex; align-items:flex-end; direction:rtl; }
  .drtx-harr2 .lb { font-size:12.5px; font-weight:700; white-space:nowrap; }
  .drtx-harr2 .dots { height:16px; font-size:11.5px; font-weight:700; text-align:center; outline:none; line-height:12px; }
  .drtx-harr2 .d1 { flex:0.88; }
  .drtx-harr2 .d2 { flex:1.12; }

  .comb-decl { left:10px; top:120px; width:125px; }

  .drtx-sig2 { position:absolute; top:186px; left:109px; width:34px; text-align:center; font-size:11.5px; font-weight:700; }
  .drtx-legend { position:absolute; top:219px; right:9px; font-size:11.5px; font-weight:700; white-space:nowrap; }

  .drtx-note { position:absolute; top:798px; left:0; width:470px; text-align:center; font-size:12.5px; font-weight:700; }

  @media print {
    /* ورقة A5 عرضية (210×148مم) — محتوى الوثيقة يُدوَّر 90° مع توسيطه: 210×133.6مم يحتوي الصفحة تماماً */
    .drtx-page { box-shadow:none !important; margin:0 !important; width:210mm !important; height:148mm !important; display:block !important; overflow:hidden; }
    .drtx-fit {
      position:absolute; left:50%; top:50%;
      transform: translate(-50%, -50%) rotate(90deg);
      transform-origin: center center;
    }
  }`;

/* الأرقام داخل الخانات: تاريخ ISO «yyyy-mm-dd» يصبح يوم/شهر/سنة رقماً في كل خانة */
function combChars(v?: string, n = 6): string[] | null {
  const s = (v || '').trim();
  if (!s) return Array(n).fill('');
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) {
    const str = m[3].padStart(2, '0') + m[2].padStart(2, '0') + m[1].slice(-2);
    if (str.length === n) return str.split('');
  }
  const digits = s.replace(/[^\d]/g, '');
  if (digits.length === n) return digits.split('');
  return null; // نص غير قياسي: رندره فوق الخانات كما هو
}

const Comb: React.FC<{ value?: string; top: number; left: number; width?: number }> = ({ value = '', top, left, width = 125 }) => {
  const chars = combChars(value);
  return (
    <div className="drtx-comb" style={{ top, left, width, height: 14 }}>
      {chars ? (
        chars.map((c, i) => <span key={i} className="c">{c || '\u00a0'}</span>)
      ) : (
        <>
          <span className="ctx">{(value || '').trim() || '\u00a0'}</span>
          {Array.from({ length: 6 }).map((_, i) => <span key={'c' + i} className="c" />)}
        </>
      )}
    </div>
  );
};

/* خانات رقم التسجيل: رقم في كل خانة (يسار ← يمين) */
const RegCells: React.FC<{ value?: string }> = ({ value = '' }) => {
  const digits = (value || '').replace(/[^\d]/g, '');
  const list = digits ? digits.split('') : Array.from({ length: 13 }, () => '');
  return <span className="drtx-regcells">{list.map((d, i) => <i key={i}>{d}</i>)}</span>;
};

export const DrtExcelDoc: React.FC<DrtExcelDocProps> = ({ employee, settings }) => {
  const [form, setForm] = useState<DrtForm>(() => buildAuto(employee, settings));
  const [printMode, setPrintMode] = useState<'auto' | 'manual'>('auto');
  const [showPreview, setShowPreview] = useState(true);
  const [blankPrinting, setBlankPrinting] = useState(false);

  useEffect(() => {
    setForm(buildAuto(employee, settings));
  }, [employee?.id]);

  const set = (k: keyof DrtForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const clearForm = () => setForm({ ...BLANK });

  const switchMode = (m: 'auto' | 'manual') => {
    setPrintMode(m);
    if (m === 'auto') setForm(buildAuto(employee, settings));
  };

  const handlePrint = () => window.print();
  const handlePrintBlank = () => {
    setBlankPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setBlankPrinting(false), 800);
    }, 250);
  };

  const f: DrtForm = blankPrinting ? { ...BLANK } : form;

  const inputCls =
    'w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none focus:border-[#047857]';
  const labelCls = 'block text-xs font-bold text-[#1e293b] mb-1';

  const toggleMode = (m: 'resumed' | 'notResumed') =>
    setForm(prev => ({ ...prev, mode: prev.mode === m ? '' : m }));

  const combResume = f.mode === 'resumed' ? f.resumeDate : '';
  const combNotResume = f.mode === 'notResumed' ? f.madeDate : '';

  return (
    <div className="w-full">
      {/* Mini toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 print:hidden">
        <div className="relative flex bg-[#e2e8f0] rounded-xl p-1 w-64" dir="rtl" title="وضع الطباعة">
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#047857] shadow transition-all duration-200"
            style={printMode === 'auto' ? { right: '4px', left: '50%' } : { left: '4px', right: '50%' }}
          />
          <button
            onClick={() => switchMode('auto')}
            className={`relative flex-1 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${printMode === 'auto' ? 'text-white' : 'text-slate-600'}`}
          >
            طباعة آلية
          </button>
          <button
            onClick={() => switchMode('manual')}
            className={`relative flex-1 py-1.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${printMode === 'manual' ? 'text-white' : 'text-slate-600'}`}
          >
            طباعة يدوية
          </button>
        </div>
        {printMode === 'manual' && (
          <button onClick={clearForm} className="bg-white hover:bg-[#f1f5f9] text-[#8c3b2d] border border-[#8c3b2d] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer">
            <Eraser className="w-4 h-4" /><span>إفراغ</span>
          </button>
        )}
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

      {printMode === 'auto' && (
        <div className="mb-4 print:hidden text-xs font-bold text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl px-3 py-2">
          وضع الطباعة الآلية: الحقول مخفية — تُملأ الوثيقة تلقائيا من بيانات البرنامج. بدّل إلى «طباعة يدوية» لإظهار الحقول وتعديلها.
        </div>
      )}
      <div className={printMode === 'manual' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 print:hidden' : 'hidden'}>
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
        <div className="drtx-page" style={{ width: '148mm', height: '210mm', display: 'flex', justifyContent: 'center', overflow: 'hidden' }} dir="rtl">
          <style>{`${CSS}
            @page { size: 210mm 148mm; margin: 0; }
          `}</style>

          <div className="drtx-fit">
          <div className="drtx-col">
            {/* شريط CNAS */}
            <div className="drtx-banner">
              <img src={CNAS_LOGO} alt="CNAS" />
              <div className="bl1">وزارة العمل و التشغيل و الضمان الإجتماعي</div>
              <div className="bl2">الصندوق الوطني للتأمينات الإجتماعية للعمال الأجراء</div>
              <div className="bl3">– التأمينات الإجتماعية –</div>
            </div>

            {/* المربع المستدير + العنوانان */}
            <div className="drtx-stamp"><span className="lbl">تأشيرة الهيئة</span></div>
            <div className="drtx-t1">تصريح بإستئناف</div>
            <div className="drtx-t2">أو عدم <span className="ul">إستئناف</span> العمل</div>

            {/* ===== الصندوق الأول ===== */}
            <div className="drtx-box1">
              <div className="drtx-lbl drtx-ana">أنا المستخدم الممضي أسفله، أشهد أن المؤمن له :</div>

              {/* مربع رقم التسجيل */}
              <div className="drtx-reg1">
                <RegCells value={f.regNum} />
                <span className="drtx-reglbl"><i className="dash" /><b>رقم التسجيل</b><i className="dash" /></span>
              </div>

              {/* الإسم و اللقب */}
              <div className="drtx-lbl drtx-isl">الإسم :</div>
              <span className={`drtx-e drtx-dName drtx-dots${f.firstName ? ' filled' : ''}`} style={{ top: 41 }} data-f="firstName" contentEditable suppressContentEditableWarning>{f.firstName || '\u00a0'}</span>
              <div className="drtx-lbl drtx-lql">اللقب :</div>
              <span className={`drtx-e drtx-dName2 drtx-dots${f.lastName ? ' filled' : ''}`} style={{ top: 63 }} data-f="lastName" contentEditable suppressContentEditableWarning>{f.lastName || '\u00a0'}</span>

              {/* تاريخ الإزياد + الخانة المركبة + بـ */}
              <div className="drtx-lbl drtx-bl">تاريخ الإزياد :</div>
              <Comb value={f.birthDate} top={89} left={250} />
              <span className="drtx-lbl drtx-be" style={{ top: 90, left: 228, width: 22, textAlign: 'center' }}>بـــ:</span>
              <span className={`drtx-e drtx-dBirth drtx-dots${f.birthPlace ? ' filled' : ''}`} style={{ top: 91, height: 16 }} data-f="birthPlace" contentEditable suppressContentEditableWarning>{f.birthPlace || '\u00a0'}</span>

              {/* المتوقف عن العمل في */}
              <div className="drtx-lbl drtx-sl">المتوقف عن العمل في :</div>
              <Comb value={f.stopDate} top={117} left={194} />

              {/* سطرا الخانات مع (1) */}
              <span className="drtx-e drtx-fn">(1)</span>
              <span className="drtx-cb drtx-fcb1" style={{ top: 142, left: 315 }} onClick={() => toggleMode('resumed')}>{f.mode === 'resumed' ? 'x' : ''}</span>
              <div className="drtx-lbl drtx-flab drtx-f1" style={{ top: 142 }}>قــد استأنــف عملــه في :</div>
              <Comb value={combResume} top={139} left={38} />

              <span className="drtx-cb" style={{ top: 164, left: 315 }} onClick={() => toggleMode('notResumed')}>{f.mode === 'notResumed' ? 'x' : ''}</span>
              <div className="drtx-lbl drtx-flab drtx-f2" style={{ top: 166 }}>لم يـستأنف عمله إلــى يومنا هذا :</div>
              <Comb value={combNotResume} top={162} left={38} />

              {/* حرر بـ ... ، في ... */}
              <div className="drtx-harr">
                <span className="lb">حرر بــ</span>
                <span className={`dots d1${f.madePlace ? ' filled' : ''}`} data-f="madePlace" contentEditable suppressContentEditableWarning>{f.madePlace || '\u00a0'}</span>
                <span className="lb">، في</span>
                <span className={`dots d2${f.madeDate ? ' filled' : ''}`} data-f="madeDate" contentEditable suppressContentEditableWarning>{f.madeDate || '\u00a0'}</span>
              </div>

              {/* تسميات الختم و صيغة الموقع + قيمهما */}
              <div className="drtx-lbl drtx-ltn">الطبيعة الإجتماعية و ختم المستخدم:</div>
              <div className="drtx-lbl drtx-ltw">إسم وصفة الموقع :</div>
              <span className="drtx-e drtx-vNat" data-f="socialNature" contentEditable suppressContentEditableWarning>{f.socialNature || '\u00a0'}</span>
              <span className="drtx-e drtx-vSig" data-f="signatory" contentEditable suppressContentEditableWarning>{f.signatory || '\u00a0'}</span>
              <div className="drtx-sline" />

              <div className="drtx-sig1">الامضاء،</div>
            </div>

            {/* ===== صندوق التصريح الشرفي ===== */}
            <div className="drtx-box2">
              <div className="drtx-h1">تصريح شرفي</div>
              <div className="drtx-h2">(يملأ من طرف المؤمن له في حالة عدم إستئناف العمل)</div>

              {/* المربع السفلي: خاناته فارغة دائما — يُملأ يدويا من طرف المؤمن له */}
              <div className="drtx-rg2">
                <RegCells value="" />
                <span className="drtx-reglbl"><i className="dash" /><b>رقم التسجيل</b><i className="dash" /></span>
              </div>
              <div className="drtx-lbl drtx-nisl">الإسم :</div>
              <span className="drtx-e drtx-dName drtx-dots" style={{ top: 67, left: 205 }} contentEditable suppressContentEditableWarning>{'\u00a0'}</span>
              <div className="drtx-lbl drtx-nlql">اللقب :</div>
              <span className="drtx-e drtx-dName drtx-dots" style={{ top: 88, left: 205 }} contentEditable suppressContentEditableWarning>{'\u00a0'}</span>

              {/* التصريح بخانتين */}
              <div className="drtx-lbl drtx-decl">أصرح بشرفي، أنني في حالة توقف عن العمل منذ تاريخ :</div>
              <Comb value="" top={120} left={10} />
              <div className="drtx-lbl drtx-decl2">وأنني لا أمارس أي نشـــاط مهني .</div>

              <div className="drtx-harr2">
                <span className="lb">حرر بــ</span>
                <span className="dots d1" contentEditable suppressContentEditableWarning>{'\u00a0'}</span>
                <span className="lb">، في</span>
                <span className="dots d2" contentEditable suppressContentEditableWarning>{'\u00a0'}</span>
              </div>
              <div className="drtx-sig2">الامضاء،</div>

              <div className="drtx-legend">(1) ضع علامة (X) في الخانة المناسبة.</div>
            </div>

            <div className="drtx-note">* القانون يعاقب كل من يقوم بتزوير او يدلي بتصريحات غير صحيحة.</div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};
