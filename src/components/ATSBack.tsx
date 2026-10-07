import React, { useMemo } from 'react';
import { Employee, Settings } from '../types';
import { computePayslip, fmt } from '../utils/salaryCalculator';
import { MONTHS_AR } from '../data/salaryGrids';

interface ATSBackProps {
  employee: Employee;
  settings: Settings;
  startMonth?: number;
  startYear?: number;
}

export const ATSBack: React.FC<ATSBackProps> = ({
  employee,
  settings,
  startMonth,
  startYear
}) => {
  const currentMonth = startMonth || new Date().getMonth() + 1;
  const currentYear = startYear || new Date().getFullYear();

  // Helper to format today's date into day, month, year
  const today = new Date();
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
  const todayYear = String(today.getFullYear());

  // Build 12 preceding months data
  const rows = useMemo(() => {
    const list = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const payslip = computePayslip(employee, m, y, settings);

      const mPadded = String(m).padStart(2, '0');
      list.push({
        ref: `${mPadded}/${y}`,
        refAr: `${MONTHS_AR[m]} ${y}`,
        days: '22',
        absence: '',
        cnasBase: fmt(payslip.cnasBase),
        cnasCotisation: fmt(payslip.cnasDeduction)
      });
    }
    // Most recent first or chronological order? In Algerian ATS, rows go from month 1 (oldest) to 12 (latest) or vice versa.
    // List has 12 items.
    return list;
  }, [employee, settings, currentMonth, currentYear]);

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
        .ats-back-page .db3 i { height: 5.2mm; border: 1.2px solid #000; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 9pt; background: #fff; text-align: center; }
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
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td contentEditable suppressContentEditableWarning data-field={`row${idx}_col0`}>
                  {row.ref}
                </td>
                <td contentEditable suppressContentEditableWarning data-field={`row${idx}_col1`}>
                  {row.days}
                </td>
                <td contentEditable suppressContentEditableWarning data-field={`row${idx}_col2`}>
                  {row.absence}
                </td>
                <td contentEditable suppressContentEditableWarning data-field={`row${idx}_col3`} className="font-bold">
                  {row.cnasBase}
                </td>
                <td contentEditable suppressContentEditableWarning data-field={`row${idx}_col4`} className="font-bold text-red-900">
                  {row.cnasCotisation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
