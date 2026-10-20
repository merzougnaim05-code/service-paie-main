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

const CSS = `
  .drtx-page * { box-sizing: border-box; font-family:'Traditional Arabic','Times New Roman',serif; }
  .drtx-page {
    background:#fff; color:#000; margin:0 auto; position:relative;
    box-shadow:0 0 10px rgba(0,0,0,.30);
    font-family:'Traditional Arabic','Times New Roman',serif;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
  }
  .drtx-col { width:428px; margin:0 auto; }

  /* ===== الترويسة (شريط CNAS الأسود) ===== */
  .drtx-banner {
    height:72px; margin:0 21px 0 16px; background:#000;
    display:flex; align-items:center; gap:8px; padding:0 10px; direction:ltr;
  }
  .drtx-banner img { height:58px; width:auto; background:#fff; border-radius:50%; padding:1px; flex-shrink:0; }
  .drtx-banner .btext { flex:1; text-align:center; color:#fff; line-height:1.4; }
  .drtx-banner .b1 { font-size:12px; }
  .drtx-banner .b2 { font-size:15.5px; font-weight:700; }
  .drtx-banner .b3 { font-size:11.5px; font-weight:700; }

  /* ===== صف العنوان + المربع المستدير ===== */
  .drtx-head { display:flex; align-items:flex-start; margin-top:14px; }
  .drtx-stamp { width:142px; height:77px; border:1.4px solid #4a4a4a; border-radius:12px; margin-right:16px; flex-shrink:0; }
  .drtx-titles { flex:1; text-align:center; padding-top:12px; color:#0000FF; }
  .drtx-titles .t1 { font-size:24px; line-height:1.1; }
  .drtx-titles .t2 { font-size:24px; line-height:1.1; }
  .drtx-titles .ul { border-bottom:3px solid #2f6fb2; padding-bottom:1px; }

  /* ===== الصندوق الأول ===== */
  .drtx-box1 { border:1.4px solid #000; margin-top:44px; height:580px; padding:0 3px; position:relative; }
  .drtx-ahd { font-size:15px; color:#0000FF; text-align:right; height:29px; line-height:29px; padding-right:4px; }
  .drtx-names { position:relative; height:87px; }
  .drtx-nrow { display:flex; align-items:flex-end; height:29px; margin-left:172px; }
  .drtx-nrow .lb { font-size:15px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-dots {
    flex:1; border-bottom:2px dotted #0000FF; height:20px; margin:0 4px;
    font-size:15px; font-weight:700; color:#0000FF; line-height:17px; text-align:center; outline:none; padding:0 3px;
  }
  .drtx-reg { position:absolute; left:3px; top:0; width:162px; height:82px; border:1.4px solid #000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
  .drtx-reg .rl { font-size:12px; color:#0000FF; }
  .drtx-reg .rv { font-size:15px; font-weight:700; }

  .drtx-dateRow { display:flex; justify-content:flex-end; align-items:center; height:22px; margin-top:23px; }
  .drtx-dateRow .lb { font-size:15px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-dateBox { border:1.4px solid #000; width:104px; height:22px; text-align:center; font-weight:700; font-size:16px; line-height:19px; outline:none; }

  .drtx-bRow { display:flex; align-items:center; height:22px; margin-top:8px; padding-right:168px; padding-left:35px; }
  .drtx-bRow .lb { font-size:15px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-dotsB { flex:1; border-bottom:2px dotted #000; height:18px; margin:0 4px; outline:none; font-size:14px; text-align:center; }

  .drtx-stopRow { display:flex; justify-content:flex-end; align-items:center; height:22px; margin-top:27px; padding-right:27px; }
  .drtx-stopRow .lb { font-size:15px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-stopBox { border:1.4px solid #000; width:85px; height:22px; text-align:center; font-weight:700; font-size:15px; line-height:19px; outline:none; }

  .drtx-cRow { display:flex; align-items:center; height:22px; }
  .drtx-cRow.first { margin-top:38px; padding-right:87px; }
  .drtx-cRow.second { margin-top:41px; padding-right:125px; }
  .drtx-cRow .one { width:17px; font-size:13px; font-weight:700; color:#0000FF; text-align:center; }
  .drtx-cRow .gap { width:21px; }
  .drtx-cb { width:20px; height:23px; border:1.4px solid #000; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; line-height:1; flex-shrink:0; }
  .drtx-cRow .clb { width:109px; text-align:right; font-size:15px; font-weight:700; color:#0000FF; white-space:nowrap; padding:0 2px; }
  .drtx-fBox { width:88px; height:22px; border-right:1.4px solid #000; border-left:1.4px solid #000; border-bottom:1.4px solid #000; text-align:center; font-size:14px; font-weight:700; outline:none; line-height:19px; }
  .drtx-cRow .fill { flex:1; }

  .drtx-harrar { margin-top:20px; height:31px; font-size:15px; font-weight:700; color:#0000FF; display:flex; align-items:center; width:270px; }
  .drtx-dotsS { display:inline-block; border-bottom:2px dotted #0000FF; height:17px; margin:0 4px; outline:none; min-width:40px; text-align:center; font-size:14px; }

  .drtx-labels { display:flex; align-items:center; height:27px; font-size:15px; font-weight:700; color:#0000FF; }
  .drtx-labels .right { width:159px; text-align:right; }
  .drtx-labels .sp { flex:1; }
  .drtx-labels .left { width:85px; text-align:right; }

  .drtx-line { border-bottom:2.4px dotted #000; height:21px; width:264px; }
  .drtx-sign1 { font-size:15px; font-weight:700; height:24px; line-height:24px; padding-left:88px; }

  /* ===== صندوق التصريح الشرفي ===== */
  .drtx-box2 { border:1.4px solid #000; margin-top:28px; height:246px; padding:4px 3px 0; }
  .drtx-h1 { text-align:center; font-size:19px; font-weight:700; color:#0000FF; }
  .drtx-h1 span { border-bottom:2px solid #0000FF; padding:0 6px; }
  .drtx-h2 { text-align:center; font-size:13px; color:#0000FF; margin-top:1px; }
  .drtx-honorNames { position:relative; margin-top:12px; height:58px; }
  .drtx-hrow { display:flex; align-items:flex-end; height:29px; margin-left:190px; padding-right:4px; }
  .drtx-hrow .lb { font-size:15px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-reg2 { position:absolute; left:2px; top:0; width:185px; height:40px; border:1.4px solid #7f9db9; display:flex; align-items:center; justify-content:center; gap:6px; color:#4a6b8a; font-size:12.5px; }
  .drtx-reg2 .num { color:#000; font-weight:700; font-size:13.5px; }

  .drtx-decl { display:flex; align-items:center; margin-top:12px; padding-right:27px; }
  .drtx-decl .txt { font-size:13.5px; font-weight:700; color:#0000FF; white-space:nowrap; }
  .drtx-decl .dBox { width:116px; height:23px; border-right:1.4px solid #000; border-left:1.4px solid #000; border-bottom:1.4px solid #000; margin-right:6px; text-align:center; font-size:14px; font-weight:700; outline:none; line-height:20px; }
  .drtx-decl2 { font-size:13.5px; font-weight:700; color:#0000FF; text-align:right; padding-right:31px; margin-top:2px; }
  .drtx-harrar2 { display:flex; align-items:center; font-size:14.5px; color:#000; margin-top:6px; padding-right:174px; }
  .drtx-harrar2 .lb { white-space:nowrap; }
  .drtx-dotsH { flex:1; border-bottom:2px dotted #000; height:17px; margin:0 4px; outline:none; font-size:13px; text-align:center; }
  .drtx-imda2 { font-size:13.5px; color:#0000FF; padding-right:88px; margin-top:2px; }
  .drtx-legend { text-align:right; font-size:13px; color:#0000FF; margin-top:10px; padding-right:2px; }
  .drtx-legend b { font-size:15px; }
  .drtx-note { text-align:center; font-size:12.5px; color:#0000FF; margin-top:14px; }

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
        <div className="drtx-page" style={{ width: '117mm', minHeight: '297mm', padding: '10px 0 6px' }} dir="rtl">
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
                <div className="t2">أو عدم <span className="ul">إستئناف</span> العمل</div>
              </div>
            </div>

            {/* ===== الصندوق الأول ===== */}
            <div className="drtx-box1 ar">
              <div className="drtx-ahd">أنا المستخدم الممضي أسفله أشهد أن المؤمن :</div>

              <div className="drtx-names">
                <div className="drtx-reg">
                  <div className="rl">رقم التسجيل</div>
                  <div className="rv">{f.regNum || '\u00a0'}</div>
                </div>
                <div className="drtx-nrow">
                  <span className="lb">الاسم :</span>
                  <span className="drtx-dots" contentEditable suppressContentEditableWarning>{f.firstName}</span>
                </div>
                <div className="drtx-nrow">
                  <span className="lb">اللقب :</span>
                  <span className="drtx-dots" contentEditable suppressContentEditableWarning>{f.lastName}</span>
                </div>
              </div>

              <div className="drtx-dateRow">
                <span className="lb">تاريخ الازدياد:</span>
                <span className="drtx-dateBox" contentEditable suppressContentEditableWarning>{f.birthDate}</span>
              </div>

              <div className="drtx-bRow">
                <span className="lb">بــــــ:ـ</span>
                <span className="drtx-dotsB" contentEditable suppressContentEditableWarning>{f.birthPlace}</span>
              </div>

              <div className="drtx-stopRow">
                <span className="lb">المتوقف عن العمل في :</span>
                <span className="drtx-stopBox" contentEditable suppressContentEditableWarning>{f.stopDate}</span>
              </div>

              <div className="drtx-cRow first">
                <span className="one">(1)</span>
                <span className="gap" />
                <span className="drtx-cb" onClick={() => toggleMode('resumed')}>{f.mode === 'resumed' ? 'x' : ''}</span>
                <span className="clb">قـــــد استأنـــف عملـــــه في:</span>
                <span className="drtx-fBox" contentEditable suppressContentEditableWarning>{f.resumeDate}</span>
                <span className="fill" />
              </div>

              <div className="drtx-cRow second">
                <span className="drtx-cb" onClick={() => toggleMode('notResumed')}>{f.mode === 'notResumed' ? 'x' : ''}</span>
                <span className="clb">لم يباشر عمله الى يومنا هذا</span>
                <span className="drtx-fBox" contentEditable suppressContentEditableWarning />
                <span className="fill" />
              </div>

              <div className="drtx-harrar">
                <span>حرر بــ:</span>
                <span className="drtx-dotsS" style={{ width: 118 }} contentEditable suppressContentEditableWarning>{f.madePlace}</span>
                <span>في:</span>
                <span className="drtx-dotsS" style={{ width: 82 }} contentEditable suppressContentEditableWarning>{f.madeDate}</span>
              </div>

              <div className="drtx-labels">
                <span className="right">الطبيعة الاجتماعية وختم المستخدم:</span>
                <span className="sp" />
                <span className="left">اسم وصفة الموقع:</span>
              </div>

              <div className="drtx-line" />

              <div className="drtx-sign1">الامضاء،</div>
            </div>

            {/* ===== صندوق التصريح الشرفي ===== */}
            <div className="drtx-box2 ar">
              <div className="drtx-h1"><span>تصريح شرفي</span></div>
              <div className="drtx-h2">( يملأ من طرف المؤمن له في حالة عدم إستئناف العمل )</div>

              <div className="drtx-honorNames">
                <div className="drtx-reg2">
                  <span>رقم التسجيل</span>
                  <span className="num">{f.regNum || '................'}</span>
                </div>
                <div className="drtx-hrow">
                  <span className="lb">الأسم :</span>
                  <span className="drtx-dots" contentEditable suppressContentEditableWarning>{f.firstName}</span>
                </div>
                <div className="drtx-hrow">
                  <span className="lb">اللقب :</span>
                  <span className="drtx-dots" contentEditable suppressContentEditableWarning>{f.lastName}</span>
                </div>
              </div>

              <div className="drtx-decl">
                <span className="txt">أصرح بشرفــي، أنني في حالة توقــف عن العمـل منذ تاريخ:</span>
                <span className="dBox" contentEditable suppressContentEditableWarning>{f.stopDate}</span>
              </div>
              <div className="drtx-decl2">وأنني لا أمارس أي نشــاط مهنــي:</div>

              <div className="drtx-harrar2">
                <span className="lb">حرر بـ:</span>
                <span className="drtx-dotsH" style={{ maxWidth: 80 }} contentEditable suppressContentEditableWarning>{f.madePlace}</span>
                <span className="drtx-dotsH" style={{ maxWidth: 88 }} contentEditable suppressContentEditableWarning>{f.madeDate}</span>
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
