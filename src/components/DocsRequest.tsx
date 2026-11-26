import React from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';

interface DocsRequestProps {
  employee: Employee;
  settings: Settings;
}

const DOCS_LIST: string[] = [
  'قرار التعيين',
  'قرار التربص',
  'قارار الترسيم',
  'محصر التنصيب',
  'شهادة الحالة العائلية / شهادة فردية للحالة المدنية',
  'الشهادات المدرسية',
  'شهادة عدم العمل للزوج (ة) إن وجدت',
  'شهادة عدم تقاضي المنح العائلية للزوج(ة)',
  'قرار التكفل للأطفال تحت الكفالة',
  'نسخة من آخر درجة / ترقية',
  'المؤهل العلمي',
  'صك بريدي مطوب',
  'نسخة من رقم الضمان الإجتماعي',
  'نسحة من بطاقة التعاضدية (إن وجدت)',
  'صورة شمسية'
];

export const DocsRequest: React.FC<DocsRequestProps> = ({ employee, settings }) => {
  const job = JOBS[employee.jobIdx];

  // العدد: الضغط على الخلية يسجّل الرقم 1 أو يزيله (تبديل)
  const [marked, setMarked] = React.useState<boolean[]>(() => DOCS_LIST.map(() => false));
  // التصفية: عرض الوثائق المؤشرة فقط (التي عددها 1)
  const [showStarredOnly, setShowStarredOnly] = React.useState(false);

  const toggleMark = (i: number) => {
    setMarked(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const markedCount = marked.filter(Boolean).length;
  const visibleDocs = DOCS_LIST.map((doc, i) => ({ doc, i })).filter(
    ({ i }) => !showStarredOnly || marked[i],
  );

  return (
    <div className="dr-wrapper">
      <style>{`
        @page { size: 210mm 297mm; margin: 0; }
        .dr-page * { box-sizing: border-box; }
        .dr-page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          margin: 0 auto;
          padding: 12mm 15mm;
          direction: rtl;
          text-align: right;
          color: #000;
          font-family: 'Amiri', 'Traditional Arabic', 'Simplified Arabic', 'Times New Roman', serif;
          font-size: 13.5pt;
          line-height: 1.35;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm; overflow: hidden; }
          .dr-page { box-shadow: none !important; height: 296.5mm !important; overflow: hidden !important; margin: 0 !important; }
        }

        .dr-page .dr-input {
          display: inline-block;
          border-bottom: 1px dotted #000;
          outline: none;
          font-family: inherit;
          font-size: inherit;
          font-weight: bold;
          background: transparent;
          padding: 0 4px;
          min-width: 1em;
          unicode-bidi: plaintext;
        }
        .dr-page .dr-input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .dr-page .top-header { text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 15px; line-height: 1.4; }
        .dr-page .header-section { margin-bottom: 12px; }
        .dr-page .header-right { text-align: right; width: 100%; }

        .dr-page .recipient-block {
          margin-top: 10px;
          margin-bottom: 15px;
          line-height: 1.6;
          font-size: 13.5pt;
          text-align: left;
          direction: rtl;
        }
        .dr-page .recipient-row {
          margin-bottom: 4px;
          display: flex;
          justify-content: flex-end;
          align-items: baseline;
        }
        .dr-page .recipient-row span.label { font-weight: bold; margin-left: 10px; }

        .dr-page .subject-line { font-size: 15pt; font-weight: bold; margin: 15px 0 10px 0; text-align: right; }

        .dr-page .body-text {
          text-align: justify;
          margin-bottom: 12px;
          line-height: 1.5;
          padding-right: 12px;
          border-right: 2px solid #000;
          font-size: 13.5pt;
        }

        .dr-page table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .dr-page table, .dr-page th, .dr-page td { border: 1.5px solid #000; }
        .dr-page th, .dr-page td {
          padding: 3px 6px;
          text-align: center;
          vertical-align: middle;
          font-size: 12pt;
        }
        .dr-page th { font-weight: bold; background-color: #ffffff; font-size: 13pt; }
        .dr-page .td-doc-name { text-align: right; padding-right: 8px; font-weight: normal; }
        .dr-page .td-cell-input { display: inline-block; width: 90%; border: none; min-height: 1em; unicode-bidi: plaintext; }
        .dr-page .td-cell-input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        /* خلية العدد: الضغط عليها يسجّل الرقم 1 أو يزيله (تبديل) */
        .dr-page .td-count-cell { cursor: pointer; user-select: none; -webkit-user-select: none; }
        .dr-page .td-count-cell:hover { background: #eef5ff; }
        .dr-page .td-mark { font-size: 17pt; line-height: 1; color: #000; font-weight: bold; }

        /* شريط التصفية (خارج منطقة الطباعة) */
        .dr-filter-bar {
          display: flex; align-items: center; gap: 10px; justify-content: flex-start;
          max-width: 210mm; margin: 0 auto 10px auto; padding: 0 4px;
          font-family: 'Amiri', 'Traditional Arabic', 'Tahoma', system-ui, sans-serif;
          direction: rtl;
        }
        .dr-filter-bar button {
          cursor: pointer; border: 1.5px solid #047857; background: #ecfdf5; color: #065f46;
          border-radius: 8px; padding: 6px 14px; font-size: 14px; font-weight: bold;
          font-family: inherit;
        }
        .dr-filter-bar button:hover { background: #d1fae5; }
        .dr-filter-bar button.active { background: #047857; color: #fff; }
        .dr-filter-bar .dr-filter-hint { font-size: 13px; color: #374151; }
        @media print {
          .dr-filter-bar { display: none !important; }
        }

        .dr-page .notes-section { font-size: 9.5pt; line-height: 1.35; margin-top: 10px; }
        .dr-page .notes-section strong { font-size: 11.5pt; text-decoration: underline; display: block; margin-bottom: 3px; }
        .dr-page .notes-section p { margin: 2px 0; text-align: justify; }

        .dr-page .footer-date {
          margin-top: 15px;
          text-align: left;
          padding-left: 60px;
          font-size: 13.5pt;
          font-weight: bold;
        }
      `}</style>

      {/* شريط التصفية — خارج منطقة الطباعة */}
      <div className="dr-filter-bar print:hidden">
        <button
          type="button"
          onClick={() => setShowStarredOnly(v => !v)}
          className={showStarredOnly ? 'active' : ''}
        >
          {showStarredOnly ? 'عرض كل الوثائق' : 'عرض المؤشرة فقط'}
        </button>
        <span className="dr-filter-hint">
          {showStarredOnly
            ? `تُعرض الوثائق المؤشرة فقط (${markedCount})`
            : markedCount > 0
              ? `الوثائق المؤشرة: ${markedCount} — اضغط على خلية العدد لتسجيل الرقم 1 أو إزالته`
              : 'اضغط على خلية العدد لتسجيل الرقم 1 للوثيقة المطلوبة'}
        </span>
      </div>

      <div className="dr-page" id="docs-request">
        {/* Top Centered Header Lines */}
        <div className="top-header">
          <div>الجمهورية الجزائرية الديمقراطية الشعبية</div>
          <div>وزارة التربية الوطنية</div>
        </div>

        {/* Header Block */}
        <div className="header-section">
          <div className="header-right">
            <div><strong>مديرية التربية لولاية {settings.wilaya || '........'}</strong></div>
            <div><strong>{settings.institution || '........'}</strong></div>
            <div style={{ marginTop: 10 }}>
              <strong>الرقم:</strong> <span className="dr-input" contentEditable suppressContentEditableWarning style={{ width: 160 }}>....................</span>
            </div>
          </div>
        </div>

        {/* Recipient Info (Aligned to Left) */}
        <div className="recipient-block">
          <div className="recipient-row">
            <span className="label">الســيد:</span>
            <span>المقتصد تحت إشراف مدير(ة) المؤسسة</span>
          </div>
          <div className="recipient-row">
            <span className="label">إلى السيد(ة) :</span>
            <span className="dr-input" contentEditable suppressContentEditableWarning style={{ width: 250, textAlign: 'right' }}>{employee.name || ''}</span>
          </div>
          <div className="recipient-row">
            <span className="label">الوظيفة :</span>
            <span className="dr-input" contentEditable suppressContentEditableWarning style={{ width: 250, textAlign: 'right' }}>{job?.name || ''}</span>
          </div>
        </div>

        {/* Subject */}
        <div className="subject-line">الموضوع : طلب وثائق لإتمام ملف</div>

        {/* Intro Text */}
        <div className="body-text">
          حتى يتسنى لنا تسوية وضعياتكم الإدارية والمالية يشرفنا أن نطلب منكم موافاتنا بالوثائق المبينة في الجدول وتقديمها لمصلحة الشؤون الاقتصادية وذلك في أقرب وقت ممكن.
        </div>

        {/* Documents Table */}
        <table>
          <thead>
            <tr>
              <th style={{ width: '7%' }}>الرقم</th>
              <th style={{ width: '53%' }}>تعيين الوثائق</th>
              <th style={{ width: '12%' }}>العدد</th>
              <th style={{ width: '28%' }}>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {visibleDocs.map(({ doc, i }) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="td-doc-name">{doc}</td>
                <td
                  className="td-count-cell"
                  onClick={() => toggleMark(i)}
                  title="اضغط لتسجيل الرقم 1 أو إزالته"
                >
                  <span className="td-mark">{marked[i] ? '1' : ''}</span>
                </td>
                <td><span className="td-cell-input" contentEditable suppressContentEditableWarning></span></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footnotes */}
        <div className="notes-section">
          <strong>ملاحظات:</strong>
          <p>* بالنسبة لشهادة الحالة العائلية في حالة عدم تجديدها في مدة 15 يوما من تاريخ هذا الإشعار سيتم مراسلة مصلحة تسيير نفقات المستخدمين لسحب المنح العائلية للأبناء.</p>
          <p>* بالنسبة لشهادة عدم العمل للزوج في حالة عدم تجديدها في مدة 15 يوما من تاريخ هذا الإشعار سيتم مراسلة مصلحة تسيير نفقات المستخدمين لسحب منحة الأجر الوحيد.</p>
          <p>* في حالة عدم تجديد ملف الأطفال تحت الكفالة في مدة 15 يوما من تاريخ هذا الإشعار سيتم مراسلة مصلحة تسيير نفقات المستخدمين لسحب المنح العائلية للأبناء تحت الكفالة.</p>
          <p>* في حالة عدم تسليم الوثائق المطلوبة في أجل 15 يوما سيتعذر على مصلحة الاقتصاد إنجاز الوثائق المالية بسبب نقص المعلومات.</p>
        </div>

        {/* Date/Location */}
        <div className="footer-date">
          {settings.municipality || '........'} في: <span className="dr-input" contentEditable suppressContentEditableWarning style={{ width: 180 }}>....................</span>
        </div>
      </div>
    </div>
  );
};
