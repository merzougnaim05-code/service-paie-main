import React, { useMemo, useState, useEffect } from 'react';
import { Employee, Settings } from '../types';
import { computePayslip, fmt } from '../utils/salaryCalculator';
import { MONTHS_AR } from '../data/salaryGrids';

interface ATSBackProps {
  employee: Employee;
  settings: Settings;
  startMonth?: number;
  startYear?: number;
  monthsCount?: number;
}

/* خيارات سبب الغياب — تظهر في قائمة منسدلة بكل سطر مع إمكانية الكتابة الحرة */
export const ABSENCE_CHOICES = ['لاشئ', 'عطلة مرضية', 'غياب غير مبرر', 'عطلة أمومة', 'إجازة بدون أجر'];

/* خانة عدد الأيام المعمول بها — تعديلها يعيد حساب الأجر الخاضع ومبلغ الإشتراك آلياً */
const DaysCell: React.FC<{ value: number | null; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (value == null) return null; // صفوف فارغة خارج العدد المحدد
  return (
    <input
      type="text"
      value={editing ? draft : String(value)}
      className="font-mono"
      onFocus={e => {
        setDraft(String(value));
        setEditing(true);
        const el = e.currentTarget;
        setTimeout(() => { try { el.select(); } catch { /* ignore */ } }, 0);
      }}
      onChange={e => {
        const raw = e.target.value;
        setDraft(raw);
        const n = parseFloat(raw.replace(/[^\d.-]/g, ''));
        onChange(isNaN(n) ? 0 : n);
      }}
      onBlur={() => setEditing(false)}
      aria-label="عدد الأيام المعمول بها"
    />
  );
};

export const ATSBack: React.FC<ATSBackProps> = ({
  employee,
  settings,
  startMonth,
  startYear,
  monthsCount: monthsCountProp
}) => {
  const monthsTotal = Math.max(1, Math.min(12, monthsCountProp || 12));
  const currentMonth = startMonth || new Date().getMonth() + 1;
  const currentYear = startYear || new Date().getFullYear();

  // Helper to format today's date into day, month, year
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayYear = String(today.getFullYear());

  // Build months data — العدد المحدد يُعبّأ آلياً والجدول يبقى كاملاً (12 صفاً) والبقية فارغة للتعبئة اليدوية
  const rows = useMemo(() => {    const list = [];
    for (let i = monthsTotal - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const payslip = computePayslip(employee, m, y, settings);

      const mPadded = String(m).padStart(2, '0');
      list.push({
        ref: `${mPadded}/${y}`,
        refAr: `${MONTHS_AR[m]} ${y}`,
        days: '30 يوما و 8 سا',
        absence: '',
        cnasBase: fmt(payslip.cnasBase),
        cnasCotisation: fmt(payslip.cnasDeduction),
        // الأجر الشهري الكامل ونسبة الإشتراك — أساس الربط مع عدد الأيام المعمول بها
        monthlyBase: payslip.cnasBase,
        rate: payslip.cnasRate
      });
    }
    while (list.length < 12) {
      list.push({ ref: '', refAr: '', days: '', absence: '', cnasBase: '', cnasCotisation: '', monthlyBase: null, rate: null });
    }
    return list;
  }, [employee, settings, currentMonth, currentYear, monthsTotal]);

  // عدد الأيام المعمول بها لكل شهر (افتراضياً 30) — يربط آلياً بالأجر الخاضع ومبلغ الإشتراك
  const [workDays, setWorkDays] = useState<number[]>(() => Array(12).fill(30));
  useEffect(() => {
    setWorkDays(Array(12).fill(30));
  }, [currentMonth, currentYear, employee?.id, monthsTotal]);

  const handleWorkDays = (idx: number, v: number) => {
    setWorkDays(prev => prev.map((d, i) => (i === idx ? v : d)));
  };

  // Absence reasons: editing the FIRST row copies its note automatically to all filled rows
  const [absences, setAbsences] = useState<string[]>(() => Array(12).fill(''));
  useEffect(() => {
    setAbsences(Array(12).fill(''));
  }, [currentMonth, currentYear, employee?.id, monthsTotal]);

  // قائمة اختيارات سبب الغياب: تفتح من الزر أمام الشهر وتملأ الخانة
  const [absenceMenuIdx, setAbsenceMenuIdx] = useState<number | null>(null);

  const handleAbsence = (idx: number, v: string) => {
    setAbsences(prev => prev.map((a, i) => (idx === 0 ? v : i === idx ? v : a)));
  };
  return (
    <div className="ats-back-wrapper">
      <style>{`
        @page { size: 297mm 210mm; margin: 0; }
        :root{
          --blue:#0000FF;
          --border:#808080;
        }
        .ats-back-page * { box-sizing: border-box; }
        .ats-back-page {
          width: 297mm;
          min-height: 210mm;
          background: #fff;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          direction: ltr;
          padding: 6mm 8mm;
          margin: 0 auto;
          font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 10.5pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print{
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 297mm; height: 210mm; overflow: hidden; }
          .ats-back-page { box-shadow: none !important; height: 209.4mm !important; overflow: hidden !important; margin: 0 !important; }
        }
        .ats-back-page .ar { font-family: 'Traditional Arabic', 'Arabic Typesetting', 'Noto Naskh Arabic', 'Segoe UI', serif; direction: rtl; unicode-bidi: isolate; }
        .ats-back-page .fr { font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif; direction: ltr; unicode-bidi: isolate; }
        .ats-back-page p { margin: 0; }
        .ats-back-page .blue { color: var(--blue); }
        .ats-back-page .gray { color: #4d4d4d; }

        .ats-back-page .intro-row { display: flex; justify-content: space-between; align-items: baseline; gap: .5in; margin-bottom: 3mm; }
        .ats-back-page .intro-row .fr { font-size: 10.5pt; }
        .ats-back-page .intro-row .ar { font-size: 11pt; }

        .ats-back-page table.ats-grid {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .ats-back-page table.ats-grid, .ats-back-page table.ats-grid th, .ats-back-page table.ats-grid td {
          border: 1px solid var(--border);
        }
        .ats-back-page table.ats-grid th {
          padding: 1.2mm 1.5mm 2mm;
          vertical-align: top;
          font-weight: 400;
        }
        .ats-back-page table.ats-grid th .ar { display: block; font-size: 9.3pt; font-weight: 700; line-height: 1.25; margin-bottom: .5mm; white-space: nowrap; }
        .ats-back-page table.ats-grid th .fr { display: block; font-size: 9pt; text-align: center; white-space: nowrap; }
        .ats-back-page table.ats-grid td {
          height: 6.35mm;
          padding: 0 2mm;
          text-align: center;
          unicode-bidi: plaintext;
          font-size: 10pt;
          font-family: monospace;
          color: #000;
        }
        .ats-back-page table.ats-grid td[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; outline-offset: -1px; }
        .ats-back-page table.ats-grid td input { width: 100%; height: 100%; border: none; background: transparent; text-align: center; font: inherit; color: inherit; padding: 0; }
        .ats-back-page .days-cell { text-align: center; }
        .ats-back-page .days-cell input { width: 100%; height: 100%; border: none; background: transparent; text-align: center; font-size: 9pt; font-weight: 700; color: inherit; padding: 0; }
        .ats-back-page .days-cell input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
        .ats-back-page td.linked-val { unicode-bidi: plaintext; }
        .ats-back-page .absence-cell { position: relative; display: flex; align-items: center; gap: 1mm; width: 100%; height: 100%; }
        .ats-back-page .absence-cell input { min-width: 0; flex: 1; height: 100%; border: none; background: transparent; text-align: center; font-size: 8pt; color: inherit; padding: 0; }
        .ats-back-page .absence-cell input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
        .ats-back-page .absence-btn {
          flex-shrink: 0; width: 5.5mm; height: 5mm; padding: 0;
          border: 1px solid #808080; border-radius: 1mm;
          background: #eef5ff; color: #1e3fae;
          font-size: 8pt; font-weight: 700; line-height: 1;
          cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
        }
        .ats-back-page .absence-btn:hover { background: #d7e6ff; }
        .ats-back-page .absence-menu {
          position: absolute; top: 100%; inset-inline-start: 0;
          min-width: 32mm; z-index: 60;
          background: #fff; border: 1.5px solid #1e3fae; border-radius: 1.5mm;
          box-shadow: 0 3mm 6mm rgba(0,0,0,.25);
          display: flex; flex-direction: column; overflow: hidden;
        }
        .ats-back-page .absence-menu button {
          all: unset; cursor: pointer; text-align: right;
          padding: 1.4mm 2.5mm; font-size: 8.5pt; font-weight: 700; color: #000;
        }
        .ats-back-page .absence-menu button:hover { background: #eef5ff; color: #1e3fae; }
        @media print {
          .ats-back-page .absence-btn { display: none !important; }
          .ats-back-page .absence-menu { display: none !important; }
        }
        .ats-back-page table.ats-grid td input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; outline-offset: -1px; }
        .ats-back-page col.c0 { width: 16.1%; }
        .ats-back-page col.c1 { width: 23.91%; }
        .ats-back-page col.c2 { width: 19.29%; }
        .ats-back-page col.c3 { width: 19.75%; }
        .ats-back-page col.c4 { width: 20.95%; }

        .ats-back-page .volume-row { display: flex; align-items: baseline; margin-top: 3mm; gap: 6px; }
        .ats-back-page .volume-row .fr-label { font-weight: 700; color: #4d4d4d; font-size: 10.5pt; white-space: nowrap; }
        .ats-back-page .volume-row .fill { flex: 1; border-bottom: 1px dotted #000; min-height: 1em; margin: 0 4px; align-self: center; text-align: center; unicode-bidi: plaintext; }
        .ats-back-page .volume-row .mid { flex: 0 0 auto; display: flex; flex-direction: row-reverse; align-items: baseline; gap: 8px; margin: 0 .4in; }
        .ats-back-page .volume-row .mid .val { font-weight: 700; font-size: 13pt; text-align: center; unicode-bidi: plaintext; min-width: .35in; display: inline-block; }
        .ats-back-page .volume-row .mid .unit-ar { font-size: 11pt; }
        .ats-back-page .volume-row .ar-label { font-size: 11pt; white-space: nowrap; }

        .ats-back-page .fait-row { display: flex; justify-content: flex-end; align-items: baseline; gap: 10px; margin-top: 5mm; padding-inline-end: 3mm; }
        .ats-back-page .fait-row .fr { font-size: 10.5pt; }
        .ats-back-page .fait-row .ar { font-size: 10.5pt; }
        .ats-back-page .fait-row .fill-sm { display: inline-block; width: 1.4in; border-bottom: 1px dotted #000; min-height: 1em; text-align: center; unicode-bidi: plaintext; font-weight: bold; }
        .ats-back-page .fait-row .fill-xs { display: inline-block; width: .5in; border-bottom: 1px dotted #000; min-height: 1em; text-align: center; unicode-bidi: plaintext; }

        .ats-back-page .stamp-row { display: flex; justify-content: space-between; margin-top: 11mm; padding: 0 3mm; margin-bottom: 18mm; }
        .ats-back-page .stamp-row .block { text-align: center; gap: 20px; display: flex; flex-direction: row; align-items: center; }
        .ats-back-page .stamp-row .fr { font-size: 11pt; }
        .ats-back-page .stamp-row .ar { font-size: 11pt; margin-inline-start: 6px; }

        .ats-back-page .footnotes { margin-top: 7mm; }
        .ats-back-page .fn-line1 { display: flex; justify-content: space-between; font-size: 9.3pt; margin-bottom: 1.5mm; }
        .ats-back-page .fn-bullets { display: flex; flex-direction: column; gap: 1mm; }
        .ats-back-page .fn-bullet-row { display: flex; justify-content: space-between; align-items: baseline; }
        .ats-back-page .fn-bullet-row .fr { font-size: 9.3pt; display: flex; align-items: baseline; gap: 5px; }
        .ats-back-page .fn-bullet-row .fr .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); display: inline-block; margin-inline-end: 2px; flex-shrink: 0; }
        .ats-back-page .fn-bullet-row .ar { font-size: 9.6pt; display: flex; align-items: baseline; gap: 5px; flex-direction: row-reverse; }
        .ats-back-page .fn-bullet-row .ar .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--blue); display: inline-block; margin-inline-start: 2px; flex-shrink: 0; }

        .ats-back-page .important-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 2mm; }
        .ats-back-page .important-row .fr { font-size: 9.3pt; }
        .ats-back-page .important-row .fr b { font-weight: 700; }
        .ats-back-page .important-row .ar { font-size: 9.6pt; }
        .ats-back-page .important-row .ar b { font-weight: 700; }

        .ats-back-page .db3 { display: inline-flex; direction: ltr; gap: 0.8mm; vertical-align: middle; margin: 0 1mm; }
        .ats-back-page .db3 i { height: 5.2mm; border: 1.2px solid #000; border-top: none; position: relative; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 9pt; background: #fff; text-align: center; }
        .ats-back-page .db3 i.day::after,
        .ats-back-page .db3 i.month::before,
        .ats-back-page .db3 i.month::after,
        .ats-back-page .db3 i.year::before { content: ''; position: absolute; top: 0; height: 52%; width: 2.5px; background: #fff; }
        .ats-back-page .db3 i.day::after { right: -1.8px; }
        .ats-back-page .db3 i.month::before, .ats-back-page .db3 i.year::before { left: -1.8px; }
        .ats-back-page .db3 i.month::after { right: -1.8px; }
        .ats-back-page .db3 i.day, .ats-back-page .db3 i.month { width: 5.5mm; }
        .ats-back-page .db3 i.year { width: 10.5mm; }
        .ats-back-page .db3 [contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
      `}</style>

      <div className="ats-back-page" id="certificate-back">
        <div className="intro-row">
          <p className="fr blue">
            Conformément au livre de paie , le montant des salaires perçus et les périodes correspondantes sont portés sur le tableau ci-après (1)
          </p>
          <p className="ar blue">
            (1) : طبقا لدفتر الحساب يوجد مبلغ الأجور المقبوضة والفترات المناسبة في الجدول التالي
          </p>
        </div>

        <table className="ats-grid">
          <colgroup>
            <col className="c0" />
            <col className="c1" />
            <col className="c2" />
            <col className="c3" />
            <col className="c4" />
          </colgroup>
          <thead>
            <tr>
              <th>
                <span className="ar blue">الشهر والسنة اللذان يؤخذان كمرجع</span>
                <span className="fr blue">Mois et année de référence</span>
              </th>
              <th>
                <span className="ar blue">عدد الأيام المعمول فيها</span>
                <span className="fr blue">Nombre de jour travaillés</span>
              </th>
              <th>
                <span className="ar blue">سبب الغيابات</span>
                <span className="fr blue">Motif absences</span>
              </th>
              <th>
                <span className="ar blue">الأجر الخاضع للإشتراكات</span>
                <span className="fr blue">Salaire soumis a la cotisations (1)</span>
              </th>
              <th>
                <span className="ar blue">مبلغ الإشتراك ( حصة العامل )</span>
                <span className="fr blue">Montant de cotisation ( part ouvriere)</span>
              </th>
            </tr>
          </thead>
          <tbody id="grid-body">
            {rows.map((row, idx) => {
              // الربط الآلي: الأجر الخاضع = الأجر الشهري × (الأيام ÷ 30) — والإشتراك = النسبة × الأجر الخاضع
              const isGenerated = row.monthlyBase != null;
              const daysVal = workDays[idx] ?? 30;
              const linkedBase = isGenerated ? Math.round(row.monthlyBase! * (daysVal / 30) * 100) / 100 : null;
              const linkedCot = linkedBase != null ? Math.round(linkedBase * (row.rate! / 100) * 100) / 100 : null;
              return (
              <tr key={idx}>
                <td contentEditable suppressContentEditableWarning data-field={`row${idx}_col0`}>
                  {row.refAr}
                </td>
                <td data-field={`row${idx}_col1`} className="days-cell">
                  <DaysCell value={isGenerated ? daysVal : null} onChange={v => handleWorkDays(idx, v)} />
                </td>
                <td data-field={`row${idx}_col2`}>
                  <div className="absence-cell">
                    {/* زر أمام الشهر: يفتح قائمة الملاحظات ويملأ الخانة */}
                    <button
                      type="button"
                      className="absence-btn"
                      title="اختيار سبب الغياب من القائمة"
                      onClick={() => setAbsenceMenuIdx(prev => (prev === idx ? null : idx))}
                    >
                      ▾
                    </button>
                    <input
                      value={absences[idx] ?? ''}
                      onChange={e => handleAbsence(idx, e.target.value)}
                      aria-label="سبب الغياب"
                    />
                    {absenceMenuIdx === idx && (
                      <div className="absence-menu">
                        {ABSENCE_CHOICES.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => { handleAbsence(idx, c); setAbsenceMenuIdx(null); }}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td data-field={`row${idx}_col3`} className="font-bold linked-val">
                  {linkedBase != null ? fmt(linkedBase) : ''}
                </td>
                <td data-field={`row${idx}_col4`} className="font-bold text-red-900 linked-val">
                  {linkedCot != null ? fmt(linkedCot) : ''}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        {/* سبب الغياب: قائمة اختيارات بكل سطر (نسخ الملاحظة الأولى يعبّئ الأشهر كلها) + كتابة حرة */}
        <div className="volume-row">
          <span className="fr-label fr gray">Volume horaire journalier</span>
          <span
            className="fill"
            contentEditable
            suppressContentEditableWarning
            data-field="volume_horaire_fill"
          ></span>
          <span className="mid">
            <span
              className="val blue"
              contentEditable
              suppressContentEditableWarning
              data-field="volume_horaire_val"
            >
              08
            </span>
            <span className="unit-ar blue">ساعـات في اليوم</span>
          </span>
          <span className="ar-label blue">الحجم الساعي اليومي :</span>
        </div>

        <div className="fait-row">
          <span className="fr blue">Fait à</span>
          <span
            className="fill-sm blue font-bold"
            contentEditable
            suppressContentEditableWarning
            data-field="fait_a"
          >
            {settings.wilaya || 'باتنة'}
          </span>
          <span className="fr blue">le :</span>
          <span className="db3 font-mono font-bold" data-date="fait_le">
            <i className="day" contentEditable suppressContentEditableWarning>
              {todayDay}
            </i>
            <i className="month" contentEditable suppressContentEditableWarning>
              {todayMonth}
            </i>
            <i className="year" contentEditable suppressContentEditableWarning>
              {todayYear}
            </i>
          </span>
          <span className="ar blue">في</span>
          <span className="ar blue">حرر بـ :</span>
        </div>

        <div className="stamp-row">
          <div className="block">
            <span className="fr blue">Cachet de l'employeur</span>
            <span className="ar blue">ختم صاحب العمل</span>
          </div>
          <div className="block">
            <span className="fr blue">Signature</span>
            <span className="ar blue">الإمضاء</span>
          </div>
        </div>

        <div className="footnotes">
          <div className="fn-line1">
            <p className="fr blue">
              1- Je déclare que les salaires tels qu'ils figurent sur les fiches de paie correspondantes :
            </p>
            <p className="ar blue">
              1– الأجور كما هي مبينة في بطاقة الأجر الموافقة لـ :
            </p>
          </div>
          <div className="fn-bullets">
            <div className="fn-bullet-row">
              <span className="fr blue">
                <span className="dot"></span>au mois précédant l'arret de travail , en cas de maladie ,
              </span>
              <span className="ar blue">
                الشهر الذي يسبق التوقف عن العمل في حالة مرض<span className="dot"></span>
              </span>
            </div>
            <div className="fn-bullet-row">
              <span className="fr blue">
                <span className="dot"></span>aux 09 mois précédant la date d'accouchement, en cas de maternité,
              </span>
              <span className="ar blue">
                التسعة (09) أشهر التي تسبق تاريخ الولادة في حالة أمومة<span className="dot"></span>
              </span>
            </div>
            <div className="fn-bullet-row">
              <span className="fr blue">
                <span className="dot"></span>aux 12 mois précédant l'arret de travail , en cas d'invalidité,
              </span>
              <span className="ar blue">
                الاثني عشرة (12) شهرا التي تسبق التوقف عن العمل في حالة عجز<span className="dot"></span>
              </span>
            </div>
            <div className="fn-bullet-row">
              <span className="fr blue">
                <span className="dot"></span>aux 12 mois précédant l'accident de travail ou le décès,
              </span>
              <span className="ar blue">
                الإثني عشرة (12) شهرا التي تسبق حادث عمل أو وفاة .<span className="dot"></span>
              </span>
            </div>
          </div>
          <div className="important-row">
            <p className="fr blue">
              <b>IMPORTANT</b> : la loi punit quiconque se rend coupable de fraude ou de fausse déclaration
            </p>
            <p className="ar blue">
              <b>هام</b> : كل شخص يقوم بتزوير أو يدلي بتصريحات غير صحيحة يعاقب من طرف القانون
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
