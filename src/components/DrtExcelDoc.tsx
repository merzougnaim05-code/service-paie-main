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

/* ============================================================
   القياسات مأخوذة رقمياً من ملف إكسل نفسه (COM: مواضع كل صف/عمود بالنقاط × 1.3333)
   عرض الاستمارة = 330.75 نقطة = 442px | الصندوق الأول = 386px | الثاني = 245px
   ============================================================ */
const CSS = `
  .drtx-page * { box-sizing: border-box; font-family:'Traditional Arabic','Times New Roman',serif; }
  .drtx-page {
    background:#fff; color:#000; margin:0 auto; position:relative;
    box-shadow:0 0 10px rgba(0,0,0,.30);
    font-family:'Traditional Arabic','Times New Roman',serif;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .drtx-col { width:442px; margin:0 auto; }

  /* ===== الترويسة (شريط CNAS الأسود) ===== */
  .drtx-banner {
    height:74px; margin:0 18px 0 22px; background:#000;
    display:flex; align-items:center; gap:10px; padding:0 12px; direction:ltr;
  }
  .drtx-banner img { height:58px; width:auto; background:#fff; border-radius:50%; padding:1px; flex-shrink:0; }
  .drtx-banner .btext { flex:1; text-align:center; color:#fff; line-height:1.35; }
  .drtx-banner .b1 { font-size:11.5px; }
  .drtx-banner .b2 { font-size:15px; font-weight:700; }
  .drtx-banner .b3 { font-size:11px; font-weight:700; }

  /* ===== صف العنوان + المربع المستدير ===== */
  .drtx-head { display:flex; align-items:flex-start; margin-top:7px; height:87px; }
  .drtx-stamp { width:141px; height:80px; border:1.4px solid #4a4a4a; border-radius:12px; margin-right:16px; flex-shrink:0; }
  .drtx-titles { flex:1; text-align:center; padding-top:22px; color:#0000FF; }
  .drtx-titles .t1 { font-size:26px; line-height:35px; }
  .drtx-titles .t2 { font-size:23px; line-height:30px; }
  .drtx-titles .ul { border-bottom:3px solid #2f6fb2; padding-bottom:2px; }

  /* ===== الصندوق الأول (386px، العناصر بمواضع مطلقة من صفوف/أعمدة إكسل) ===== */
  .drtx-box1 { border:1.5px solid #000; margin-top:20px; height:386px; position:relative; }
  .drtx-box1 .ed { position:absolute; outline:none; text-align:center; font-weight:700; }
  .drtx-lb { position:absolute; font-size:14.5px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-dots { border-bottom:2px dotted #0000FF; font-size:14px; font-weight:700; color:#0000FF; }
  .boxb { border:1.4px solid #000; background:#fff; }

  .drtx-ahd { position:absolute; top:0; right:14px; height:27px; line-height:27px; font-size:15px; font-weight:700; color:#0000FF; }

  .drtx-reg { position:absolute; left:2px; top:27px; width:170px; height:44px; }
  .drtx-reg .rv { display:flex; align-items:center; justify-content:center; height:100%; font-size:14px; }
  .drtx-regLbl { position:absolute; left:2px; top:66px; width:170px; text-align:center; font-size:12.5px; color:#000; }

  .drtx-name { text-align:right; font-size:14.5px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-dateRowEd { font-size:15px; }

  /* سطر تاريخ الازدياد + بـ (سطر واحد كما في الأصل) */
  .drtx-be { font-size:14.5px; font-weight:700; color:#0000FF; }
  .drtx-dotsBe { border-bottom:2px dotted #000; font-size:14px; font-weight:700; color:#000; text-align:center; outline:none; }

  /* سطر التوقف + سطرا x */
  .drtx-cRows { position:absolute; left:0; top:117px; width:442px; height:92px; }
  .drtx-cb { width:22px; border:1.4px solid #000; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; line-height:1; }
  .drtx-fBox { border-right:1.4px solid #000; border-left:1.4px solid #000; border-bottom:1.4px solid #000; background:#fff; font-size:13px; font-weight:700; outline:none; display:flex; align-items:center; justify-content:center; }

  /* حرر بــ: ... في: ... */
  .drtx-harrar { position:absolute; top:212px; left:35px; width:223px; height:31px; display:flex; align-items:flex-end; gap:3px; }
  .drtx-harrar .lb { font-size:14.5px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-harrar .d { border-bottom:2px dotted #0000FF; height:20px; flex:1; font-size:13px; font-weight:700; outline:none; text-align:center; line-height:17px; }

  /* التسميات + خط النقاط + الامضاء */
  .drtx-labels { position:absolute; top:243px; left:0; width:442px; height:27px; }
  .drtx-labels .right { position:absolute; right:21px; top:2px; font-size:14.5px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-labels .left { position:absolute; left:194px; top:2px; width:112px; text-align:center; font-size:14.5px; font-weight:700; color:#0000FF; white-space:nowrap; }

  .drtx-natures { position:absolute; top:270px; left:0; width:442px; height:24px; }
  .drtx-natures .natR { position:absolute; right:21px; top:0; width:160px; height:22px; font-size:13.5px; font-weight:700; outline:none; text-align:right; color:#0000FF; overflow:hidden; }
  .drtx-natures .natLWrap { position:absolute; left:0; top:0; width:235px; height:24px; border-bottom:2.4px dotted #000; }
  .drtx-natures .natL { position:absolute; right:0; bottom:0; width:150px; height:20px; font-size:13.5px; font-weight:700; outline:none; color:#0000FF; text-align:right; overflow:hidden; }

  .drtx-sign1 { position:absolute; top:296px; left:88px; width:64px; text-align:center; font-size:14.5px; font-weight:700; color:#0000FF; }

  /* ===== صندوق التصريح الشرفي (245px) ===== */
  .drtx-box2 { border:1.5px solid #000; margin-top:27px; height:245px; position:relative; }
  .drtx-box2 .ed { position:absolute; outline:none; font-weight:700; }

  .drtx-h1 { position:absolute; top:0; left:0; width:442px; text-align:center; font-size:17px; font-weight:700; color:#0000FF; }
  .drtx-h1 span { border-bottom:2px solid #0000FF; padding:0 5px; }
  .drtx-h2 { position:absolute; top:19px; left:0; width:442px; text-align:center; font-size:12.5px; color:#0000FF; }

  .drtx-reg2 { position:absolute; left:11px; top:63px; width:166px; height:42px; border:1.4px solid #000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; }
  .drtx-reg2 .rl { font-size:12px; color:#000; }
  .drtx-reg2 .num { font-size:13px; font-weight:700; color:#000; }

  .drtx-decl1 { position:absolute; top:131px; right:52px; height:22px; font-size:14px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-declBox { position:absolute; top:131px; left:48px; width:95px; height:26px; border-right:1.4px solid #000; border-left:1.4px solid #000; border-bottom:1.4px solid #000; font-size:13px; font-weight:700; outline:none; text-align:center; }
  .drtx-decl2 { position:absolute; top:153px; right:52px; height:23px; font-size:14px; font-weight:700; color:#0000FF; white-space:nowrap; }

  .drtx-harrar2 { position:absolute; top:176px; left:0; width:214px; height:21px; display:flex; align-items:flex-end; gap:3px; justify-content:flex-end; }
  .drtx-harrar2 .lb { font-size:13.5px; color:#000; white-space:nowrap; }
  .drtx-harrar2 .d { border-bottom:2px dotted #000; height:16px; width:72px; font-size:12px; outline:none; text-align:center; }
  .drtx-imda2 { position:absolute; top:197px; left:88px; width:64px; text-align:center; font-size:13.5px; color:#0000FF; }

  .drtx-legend { position:absolute; top:218px; right:21px; height:27px; font-size:13px; color:#0000FF; }
  .drtx-legend b { font-size:14px; }

  .drtx-note { text-align:center; font-size:12.5px; color:#0000FF; margin-top:6px; }

  @media print {
    .drtx-page { box-shadow:none !important; margin:0 !important; }
  }
`;
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
        <div className="drtx-page" style={{ width: '120mm', minHeight: '297mm', padding: '8px 0 6px' }} dir="rtl">
          <style>{`${CSS} @page { size: 210mm 297mm; margin: 0; }`}</style>

          <div className="drtx-col">
            {/* الترويسة */}
            <div className="drtx-banner">
              <img src={CNAS_LOGO} alt="CNAS" />
              <div className="btext ar">
                <div className="b1">وزارة العمل و التشغيل و الضمان الاجتماعي</div>
                <div className="b2">الصندوق الوطني للتأمينات الاجتماعية للعمال الأجراء</div>
                <div className="b3">– التأمينات الاجتماعية –</div>
              </div>
            </div>

            {/* العنوان + المربع المستدير */}
            <div className="drtx-head">
              <div className="drtx-stamp" />
              <div className="drtx-titles ar">
                <div className="t1">تصريح بإستئناف</div>
                <div className="t2">او عدم <span className="ul">إستئناف</span> العمل</div>
              </div>
            </div>

            {/* ===== الصندوق الأول (386px) ===== */}
            <div className="drtx-box1 ar">
              <div className="drtx-ahd">أنا المستخدم الممضي أسفله أشهد أن المؤمن :</div>

              {/* مربع رقم التسجيل + تسميته تحته كما في الأصل */}
              <div className="drtx-reg boxb">
                <span className="rv" contentEditable suppressContentEditableWarning>{f.regNum || '\u00a0'}</span>
              </div>
              <div className="drtx-regLbl">رقم التسجيل</div>

              {/* الاسم / اللقب — التسمية على اليمين والنقاط في الوسط */}
              <div className="drtx-lb drtx-name" style={{ top: 27, right: 21 }}>الاسم :</div>
              <span className="ed drtx-dots" style={{ left: 197, top: 27, width: 193, height: 19 }} contentEditable suppressContentEditableWarning>{f.firstName}</span>
              <div className="drtx-lb drtx-name" style={{ top: 46, right: 21 }}>اللقب :</div>
              <span className="ed drtx-dots" style={{ left: 197, top: 46, width: 193, height: 19 }} contentEditable suppressContentEditableWarning>{f.lastName}</span>

              {/* تاريخ الازدياد + الصندوق + بـ: والنقاط (سطر واحد) */}
              <div className="drtx-lb" style={{ top: 85, right: 21 }}>تاريخ الازدياد:</div>
              <span className="ed drtx-dateRowEd boxb" style={{ top: 85, right: 76, width: 102, height: 21 }} contentEditable suppressContentEditableWarning>{f.birthDate}</span>
              <div className="drtx-be" style={{ position: 'absolute', top: 89, left: 222, width: 40, overflow: 'hidden', textAlign: 'center', fontSize: 13 }}>بــــــ:ـ</div>
              <span className="ed drtx-dotsBe" style={{ left: 34, top: 85, width: 197, height: 25 }} contentEditable suppressContentEditableWarning>{f.birthPlace}</span>

              {/* المتوقف عن العمل في : + صندوقه في موضع الأصل */}
              <div className="drtx-lb" style={{ top: 123, right: 52 }}>المتوقف عن العمل في :</div>
              <span className="ed boxb" style={{ position: 'absolute', top: 116, left: 88, width: 85, height: 26, borderColor: '#000', fontSize: 13, fontWeight: 700, outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} contentEditable suppressContentEditableWarning>{f.stopDate}</span>

              {/* سطرا خانة x + علامة (1) بينهما */}
              <div className="drtx-cRows">
                <span className="drtx-lb" style={{ position: 'absolute', top: 51, left: 99, width: 17, textAlign: 'center', fontSize: 12.5 }}>(1)</span>
                <span className="drtx-cb" style={{ position: 'absolute', left: 295, top: 0, height: 19 }} onClick={() => toggleMode('resumed')}>{f.mode === 'resumed' ? 'x' : ''}</span>
                <div className="drtx-lb" style={{ top: 1, right: 151, fontSize: 14 }}>قـــــد استأنـــف عملـــــه في:</div>
                <span className="ed drtx-fBox" style={{ position: 'absolute', left: 88, top: 0, width: 85, height: 20 }} contentEditable suppressContentEditableWarning>{f.resumeDate}</span>

                <span className="drtx-cb" style={{ position: 'absolute', left: 295, top: 33, height: 22 }} onClick={() => toggleMode('notResumed')}>{f.mode === 'notResumed' ? 'x' : ''}</span>
                <div className="drtx-lb" style={{ top: 34, right: 151, fontSize: 14 }}>لم يباشر عمله الى يومنا هذا</div>
                <span className="ed drtx-fBox" style={{ position: 'absolute', left: 88, top: 33, width: 85, height: 20 }} contentEditable suppressContentEditableWarning />
              </div>

              {/* حرر بــ: ... في: ... */}
              <div className="drtx-harrar">
                <span className="lb">حرر بــ:</span>
                <span className="d" contentEditable suppressContentEditableWarning>{f.madePlace}</span>
                <span className="lb">في:</span>
                <span className="d" contentEditable suppressContentEditableWarning>{f.madeDate}</span>
              </div>

              {/* التسميات */}
              <div className="drtx-labels">
                <span className="right">الطبيعة الاجتماعية وختم المستخدم:</span>
                <span className="left">اسم وصفة الموقع:</span>
              </div>

              {/* بيانات المؤسسة + اسم وصي الموقع فوق خط النقاط */}
              <div className="drtx-natures">
                <span className="natR" contentEditable suppressContentEditableWarning>{f.socialNature}</span>
                <div className="natLWrap">
                  <span className="natL" contentEditable suppressContentEditableWarning>{f.signatory}</span>
                </div>
              </div>

              <div className="drtx-sign1">الامضاء،</div>
            </div>

            {/* ===== صندوق التصريح الشرفي (245px) ===== */}
            <div className="drtx-box2 ar">
              <div className="drtx-h1"><span>تصريح شرفي</span></div>
              <div className="drtx-h2">( يملأ من طرف المؤمن له في حالة عدم إستئناف العمل )</div>

              {/* مربع رقم التسجيل (بتسمية داخله) + الاسم/اللقب */}
              <div className="drtx-reg2">
                <span className="rl">رقم التسجيل</span>
                <span className="num" contentEditable suppressContentEditableWarning>{f.regNum || '\u00a0'}</span>
              </div>
              <div className="drtx-lb drtx-name" style={{ top: 63, right: 21 }}>الأسم :</div>
              <span className="ed drtx-dots" style={{ left: 214, top: 63, width: 176, height: 25 }} contentEditable suppressContentEditableWarning>{f.firstName}</span>
              <div className="drtx-lb drtx-name" style={{ top: 88, right: 21 }}>اللقب :</div>
              <span className="ed drtx-dots" style={{ left: 214, top: 88, width: 176, height: 22 }} contentEditable suppressContentEditableWarning>{f.lastName}</span>

              {/* التصريح */}
              <div className="drtx-decl1">أصرح بشرفــي، أنني في حالة توقــف عن العمـل منذ تاريخ:</div>
              <span className="drtx-declBox" contentEditable suppressContentEditableWarning>{f.stopDate}</span>
              <div className="drtx-decl2">وأنني لا أمارس أي نشــاط مهنــي:</div>

              <div className="drtx-harrar2">
                <span className="lb">حرر بـ:</span>
                <span className="d" contentEditable suppressContentEditableWarning>{f.madePlace}</span>
                <span className="lb">في:</span>
                <span className="d" contentEditable suppressContentEditableWarning>{f.madeDate}</span>
              </div>
              <div className="drtx-imda2">الإمضاء</div>

              <div className="drtx-legend"><b>(1)</b> ضع علامة <b>(x)</b> في الخانة المناسبة</div>
            </div>

            <div className="drtx-note ar">* القاانون يعاقب كل من يقوم بتزوير أو يدلي بتصريحات غير صحيحة</div>
          </div>
        </div>
      )}
    </div>
  );
};

