import React, { useEffect, useState } from 'react';
import { Employee, Settings } from '../types';
import { CNAS_LOGO } from '../data/cnasLogo';
import { JOBS } from '../data/salaryGrids';

interface ATSFrontProps {
  employee: Employee;
  settings: Settings;
  onPrint?: () => void;
}

export const ATSFront: React.FC<ATSFrontProps> = ({ employee, settings }) => {
  const job = JOBS[employee.jobIdx];

  // Helper to split YYYY-MM-DD or DD/MM/YYYY into { day, month, year }
  const parseDate = (dStr?: string) => {
    if (!dStr) return { day: '', month: '', year: '' };
    const clean = dStr.replace(/\D/g, '');
    if (dStr.includes('-') && dStr.split('-')[0].length === 4) {
      // YYYY-MM-DD
      const parts = dStr.split('-');
      return { day: parts[2] || '', month: parts[1] || '', year: parts[0] || '' };
    }
    if (clean.length === 8) {
      // DDMMYYYY
      return { day: clean.substring(0, 2), month: clean.substring(2, 4), year: clean.substring(4, 8) };
    }
    return { day: '', month: '', year: '' };
  };

  const dob = parseDate(employee.birthDate);
  const hireDate = parseDate(employee.hireDate);
  const lastWorkDate = parseDate(employee.lastWorkDate);
  const resumeDate = parseDate(employee.resumeDate);

  // CNAS Logo base64 provided in official template
  const cnasLogo = CNAS_LOGO;

  return (
    <div className="ats-front-wrapper">
      <style>{`
        @page { size: 210mm 297mm; margin: 0; }
        :root{
          --blue:#0070C0;
          --cachet-blue:#5B76C4;
          --ink:#000;
        }
        .ats-front-page * { box-sizing: border-box; }
        .ats-front-page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          direction: ltr;
          margin: 0 auto;
          font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 10.3pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print{
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm; overflow: hidden; }
          .ats-front-page { box-shadow: none !important; height: 296.4mm !important; overflow: hidden !important; margin: 0 !important; }
        }
        .ats-front-page .ar { font-family: 'Traditional Arabic', 'Arabic Typesetting', 'Noto Naskh Arabic', 'Segoe UI', serif; direction: rtl; unicode-bidi: isolate; }
        .ats-front-page .fr { font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif; direction: ltr; unicode-bidi: isolate; }
        .ats-front-page p { margin: 0; }

        .ats-front-page .topbar {
          background: var(--blue);
          display: flex;
          align-items: center;
          gap: .16in;
          padding: .1in .28in;
          height: .92in;
        }
        .ats-front-page .topbar img { height: .78in; display: block; }
        .ats-front-page .topbar-text { flex: 1; text-align: center; color: #fff; }
        .ats-front-page .topbar-text p { line-height: 1.42; }
        .ats-front-page .topbar-text .l1 { font-size: 12.5pt; }
        .ats-front-page .topbar-text .l2 { font-size: 13pt; font-weight: 700; }
        .ats-front-page .topbar-text .l3 { font-size: 12.5pt; }
        .ats-front-page .topbar-text .l3 .fr { margin-inline-end: 4px; }

        .ats-front-page .content { padding: .0in .38in .12in .38in; position: relative; }
        .ats-front-page .title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: .1in; }
        .ats-front-page .title-block { padding-top: .06in; }
        .ats-front-page .ar-title { font-size: 19pt; font-weight: 700; text-align: right; letter-spacing: 1.5px; margin: 0; }
        .ats-front-page .fr-title { font-size: 14pt; font-weight: 700; text-align: left; margin: .03in 0 0; }
        .ats-front-page .fr-title .ul { text-decoration: underline; }

        .ats-front-page .cachet-box {
          border: 1.5px solid var(--cachet-blue);
          border-radius: 18px;
          width: 2.5in; height: .92in;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
          padding-bottom: .14in;
          margin-top: .02in;
        }
        .ats-front-page .cachet-box .ar { font-weight: 700; font-size: 10.5pt; margin: 0 0 1px; }
        .ats-front-page .cachet-box .fr { font-size: 8.8pt; margin: 0; }

        .ats-front-page .sec-title { display: flex; align-items: center; gap: 8px; margin: .13in 0 .05in; }
        .ats-front-page .sec-title hr { flex: 1; border: none; border-top: 1.2px solid #000; margin: 0; }
        .ats-front-page .sec-title-text { text-align: center; white-space: nowrap; padding: 0 6px; }
        .ats-front-page .sec-title-text .ar { font-weight: 700; font-size: 13pt; display: block; line-height: 1.28; }
        .ats-front-page .sec-title-text .fr { font-weight: 700; font-size: 10.3pt; display: block; }
        .ats-front-page .sec-title.plain { margin: .11in 0 .04in; }
        .ats-front-page .sec-title.plain hr { display: none; }
        .ats-front-page .sec-title.plain .sec-title-text { flex: 1; }

        .ats-front-page .box { border: 1.1px solid #000; padding: .045in .12in; position: relative; }
        .ats-front-page .row { display: flex; align-items: baseline; min-height: .26in; gap: 5px; position: relative; z-index: 2; }
        .ats-front-page .row .fr-label { white-space: nowrap; font-size: 10.3pt; }
        .ats-front-page .row .ar-label { white-space: nowrap; font-size: 10.3pt; }
        .ats-front-page .fill { flex: 1; align-self: center; border-bottom: 1.4px dotted #000; min-height: 1em; margin: 0 3px; outline-offset: 2px; text-align: center; unicode-bidi: plaintext; }
        .ats-front-page .fill[contenteditable]:focus, .ats-front-page .inbox[contenteditable]:focus, .ats-front-page .cell[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .ats-front-page .row-nofill { position: relative; }
        .ats-front-page .row-nofill .fr-label { flex-shrink: 0; }
        .ats-front-page .row-nofill .ar-label { flex-shrink: 0; }
        .ats-front-page .row-spacer { flex: 1; align-self: stretch; min-height: 1em; outline-offset: 2px; text-align: center; unicode-bidi: plaintext; }
        .ats-front-page .row-spacer[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .ats-front-page .inbox { border: 1.3px solid #000; min-width: 2.85in; height: .235in; margin: 0 5px; text-align: center; unicode-bidi: plaintext; }
        .ats-front-page .inbox.mn { border: 1.3px solid #000; min-width: 2.85in; height: .235in; margin: 0 auto; text-align: center; unicode-bidi: plaintext; }
        .ats-front-page .inbox.narrow { min-width: 1.05in; }
        .ats-front-page .inbox.narrow.mn { min-width: 2.05in; margin-left: auto; margin-right: auto; }

        .ats-front-page .row.flanked { gap: 6px; }
        .ats-front-page .row.flanked .spacer { flex: 1; }
        .ats-front-page .row.flanked .ar-label.right { text-align: right; }

        .ats-front-page .cellgroup { display: inline-flex; border: 1.2px solid #000; border-top: none; margin: 0 2px; }
        .ats-front-page .cell { width: .195in; height: .22in; border-right: 1px solid #000; text-align: center; line-height: .22in; unicode-bidi: plaintext; font-size: 10pt; font-family: monospace; font-weight: bold; position: relative; }
        .ats-front-page .cell:last-child { border-right: none; }
        .ats-front-page .cell:not(:last-child)::after { content: ''; position: absolute; top: 0; right: -1px; height: 55%; width: 2.5px; background: #fff; }

        .ats-front-page .inline-label { font-size: 10pt; white-space: nowrap; margin: 0 2px; }

        .ats-front-page .duree-row { display: flex; align-items: center; min-height: .28in; gap: 1px; flex-wrap: nowrap; }
        .ats-front-page .duree-row .fr-label { font-size: 9.6pt; white-space: nowrap; flex-shrink: 0; }
        .ats-front-page .duree-row .ar-label { font-size: 9.8pt; white-space: nowrap; flex-shrink: 0; }
        .ats-front-page .duree-row .inline-label { flex-shrink: 0; }
        .ats-front-page .duree-row .cellgroup { flex-shrink: 0; }
        .ats-front-page .duree-row .mid-spacer { flex: 1 1 auto; min-width: .08in; }
        .ats-front-page .selon { padding: .02in 0 .01in; font-size: 10.3pt; display: flex; justify-content: space-between; }

        .ats-front-page .explain { display: flex; justify-content: space-between; gap: .3in; padding: .02in 0 .05in; }
        .ats-front-page .explain .fr { font-size: 9pt; line-height: 1.22; flex: 1; }
        .ats-front-page .explain .ar { font-size: 9.3pt; line-height: 1.3; flex: 1; text-align: right; }

        .ats-front-page .footer-vert {
          position: absolute; right: .045in; bottom: .35in; top: auto;
          writing-mode: vertical-rl; transform: rotate(180deg);
          font-size: 7.3pt; color: #333; letter-spacing: .3px;
        }
        .ats-front-page .db3 { display: inline-flex; direction: rtl; gap: 0.8mm; vertical-align: middle; margin: 0 1mm; }
        .ats-front-page .db3 i { height: 5.2mm; border: 1.2px solid #000; border-top: none; position: relative; display: inline-flex; align-items: center; justify-content: center; font-style: normal; font-size: 9pt; background: #fff; text-align: center; }
        .ats-front-page .db3 i.day::before,
        .ats-front-page .db3 i.month::before,
        .ats-front-page .db3 i.month::after,
        .ats-front-page .db3 i.year::after { content: ''; position: absolute; top: 0; height: 52%; width: 2.5px; background: #fff; }
        .ats-front-page .db3 i.day::before, .ats-front-page .db3 i.month::before { left: -1.8px; }
        .ats-front-page .db3 i.month::after, .ats-front-page .db3 i.year::after { right: -1.8px; }
        .ats-front-page .db3 i.day, .ats-front-page .db3 i.month { width: 5.5mm; }
        .ats-front-page .db3 i.year { width: 10.5mm; }
        .ats-front-page .db3 [contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
      `}</style>

      <div className="ats-front-page" id="certificate">
        {/* Topbar Header */}
        <div className="topbar">
          <img src={cnasLogo} alt="CNAS" />
          <div className="topbar-text">
            <p className="ar l1">وزارة العمل و التشغيل و الضمان الاجتماعي</p>
            <p className="ar l2">الصندوق الوطني للتأمينات الاجتماعية للعمال الأجراء</p>
            <p className="l3">
              <span className="fr">Assurances Sociales</span>
              <span className="ar">- التأمينات الاجتماعية</span>
            </p>
          </div>
        </div>

        <div className="content">
          <div className="title-row">
            <div className="title-block">
              <p className="ar-title ar">شـهــادة العمــل و الأجــر</p>
              <p className="fr-title fr">
                ATTESTATION DE <span className="ul">TRAVAIL ET DE</span> SALAIRE
              </p>
            </div>
            <div className="cachet-box">
              <p className="ar">ختم الهيئة</p>
              <p className="fr">Cachet de la Structure</p>
            </div>
          </div>

          {/* ============ SECTION 1: EMPLOYEUR ============ */}
          <div className="sec-title">
            <hr />
            <div className="sec-title-text">
              <span className="ar">هوية رب العمل</span>
              <span className="fr">IDENTIFICATION DE L'EMPLOYEUR</span>
            </div>
            <hr />
          </div>
          <div className="box">
            <div className="row">
              <span className="fr-label fr">Nom et prénom:</span>
              <span
                className="fill"
                contentEditable
                suppressContentEditableWarning
                data-field="employer_name"
              >
                {settings.director || 'مدير المؤسسة'}
              </span>
              <span className="ar-label ar">اللقب و الاسم :</span>
            </div>
            <div className="row flanked">
              <span className="fr-label fr">ou</span>
              <span className="fr-label fr">n° de l'adhérent :</span>
              <span
                className="inbox narrow mn font-mono"
                contentEditable
                suppressContentEditableWarning
                data-field="employer_adherent_no"
              >
                {settings.cnasNum || ''}
              </span>
              <span className="ar-label ar right">رقم المنخرط :</span>
              <span className="ar-label ar">أو</span>
            </div>
            <div className="row">
              <span className="fr-label fr">Raison sociale:</span>
              <span
                className="fill"
                contentEditable
                suppressContentEditableWarning
                data-field="employer_raison_sociale"
              >
                {settings.institution || ''}
              </span>
              <span className="ar-label ar">الطبيعة الاجتماعية :</span>
            </div>
            <div className="row">
              <span className="fr-label fr">Adresse :</span>
              <span
                className="fill"
                contentEditable
                suppressContentEditableWarning
                data-field="employer_address"
              >
                {settings.wilaya ? `ولاية ${settings.wilaya}` : ''}
              </span>
              <span className="ar-label ar">العنوان :</span>
            </div>
          </div>

          {/* ============ SECTION 2: SALARIÉ ============ */}
          <div className="sec-title">
            <hr />
            <div className="sec-title-text">
              <span className="ar">هويــة الأجيــر</span>
              <span className="fr">IDENTIFICATION DU SALARIÉ</span>
            </div>
            <hr />
          </div>
          <div className="box">
            <div className="row">
              <span className="fr-label fr">Nom et prénom:</span>
              <span
                className="fill font-bold"
                contentEditable
                suppressContentEditableWarning
                data-field="employee_name"
              >
                {employee.name || ''}
              </span>
              <span className="ar-label ar">اللقب و الإسم :</span>
            </div>
            <div className="row">
              <span className="fr-label fr" style={{ flex: 0 }}>
                n° d'immatriculation:
              </span>
              <span
                className="inbox mn font-mono font-bold"
                contentEditable
                suppressContentEditableWarning
                data-field="employee_immatriculation_no"
              >
                {employee.ssn || ''}
              </span>
              <span className="ar-label ar">رقم التسجيل :</span>
            </div>
            <div className="row">
              <span className="fr-label fr" style={{ flex: 0 }}>
                Né(e) le :
              </span>
              <span className="db3 font-mono" data-date="employee_dob">
                <i className="day" contentEditable suppressContentEditableWarning>
                  {dob.day}
                </i>
                <i className="month" contentEditable suppressContentEditableWarning>
                  {dob.month}
                </i>
                <i className="year" contentEditable suppressContentEditableWarning>
                  {dob.year}
                </i>
              </span>
              <span className="fr-label fr" style={{ flex: 0 }}>
                à :
              </span>
              <span
                className="fill"
                contentEditable
                suppressContentEditableWarning
                data-field="employee_pob"
              >
                {employee.birthPlace || ''}
              </span>
              <span className="ar-label ar" style={{ flex: 0 }}>
                بـ
              </span>
              <span className="db3 font-mono" data-date="employee_dob_ar">
                <i className="day" contentEditable suppressContentEditableWarning>
                  {dob.day}
                </i>
                <i className="month" contentEditable suppressContentEditableWarning>
                  {dob.month}
                </i>
                <i className="year" contentEditable suppressContentEditableWarning>
                  {dob.year}
                </i>
              </span>
              <span className="ar-label ar" style={{ flex: 0 }}>
                تاريخ الازدياد :
              </span>
            </div>
            <div className="row">
              <span className="fr-label fr">Adresse :</span>
              <span
                className="fill"
                contentEditable
                suppressContentEditableWarning
                data-field="employee_address"
              >
                {employee.address || ''}
              </span>
              <span className="ar-label ar">العنوان :</span>
            </div>
            <div className="row">
              <span className="fr-label fr">Profession :</span>
              <span
                className="fill font-bold"
                contentEditable
                suppressContentEditableWarning
                data-field="employee_profession"
              >
                {job?.name || ''}
              </span>
              <span className="ar-label ar">المهنـة :</span>
            </div>
          </div>

          {/* ============ SECTION 3: RENSEIGNEMENTS ============ */}
          <div className="sec-title">
            <hr />
            <div className="sec-title-text">
              <span className="ar">المعلومات الضرورية لدراسة تخويل الحقوق</span>
              <span className="fr">RENSEIGNEMENTS NÉCESSAIRES POUR L'ÉTUDE DES DROITS</span>
            </div>
            <hr />
          </div>
          <div className="box" id="renseignements-box">
            <div className="row">
              <span className="fr-label fr">Date de recrutement :</span>
              <span className="db3 font-mono" data-date="date_recrutement">
                <i className="day" contentEditable suppressContentEditableWarning>
                  {hireDate.day}
                </i>
                <i className="month" contentEditable suppressContentEditableWarning>
                  {hireDate.month}
                </i>
                <i className="year" contentEditable suppressContentEditableWarning>
                  {hireDate.year}
                </i>
              </span>
              <span className="ar-label ar">تاريخ التوظيف :</span>
            </div>
            <div className="row">
              <span className="fr-label fr">Date du dernier jour de travail :</span>
              <span className="db3 font-mono" data-date="date_dernier_jour">
                <i className="day" contentEditable suppressContentEditableWarning>
                  {lastWorkDate.day}
                </i>
                <i className="month" contentEditable suppressContentEditableWarning>
                  {lastWorkDate.month}
                </i>
                <i className="year" contentEditable suppressContentEditableWarning>
                  {lastWorkDate.year}
                </i>
              </span>
              <span className="ar-label ar">تاريخ آخر يوم عمل :</span>
            </div>
            <div className="row">
              <span className="fr-label fr">Date de reprise de travail :</span>
              <span className="db3 font-mono" data-date="date_reprise">
                <i className="day" contentEditable suppressContentEditableWarning>
                  {resumeDate.day}
                </i>
                <i className="month" contentEditable suppressContentEditableWarning>
                  {resumeDate.month}
                </i>
                <i className="year" contentEditable suppressContentEditableWarning>
                  {resumeDate.year}
                </i>
              </span>
              <span className="ar-label ar">تاريخ استئناف العمل :</span>
            </div>
            <div className="row row-nofill">
              <span className="fr-label fr">L'intéressé(e) n'a pas repris son travail à ce jour :</span>
              <span
                className="row-spacer font-bold"
                data-field="pas_repris"
                contentEditable
                suppressContentEditableWarning
              >
                {employee.lastWorkDate && !employee.resumeDate ? 'نعم' : ''}
              </span>
              <span className="ar-label ar">المعني(ة) بالامر لم يستأنف العمل الى يومنا هذا :</span>
            </div>
          </div>

          {/* ============ SECTION 4: MATERNITÉ ============ */}
          <div className="sec-title plain">
            <div className="sec-title-text">
              <span className="ar">في حالة التوقف عن العمل لمدة تقل عن 06 أشهر أو في حالة الأمومة</span>
              <span className="fr">
                EN CAS D'ARRET DE TRAVAIL D'UNE DURÉE INFERIEUR À 06 MOIS ET EN CAS DE MATERNITÉ
              </span>
            </div>
          </div>
          <div className="box">
            <div className="duree-row">
              <span className="fr-label fr">L'assuré(e) a travaillé pendant :</span>
              <span className="cellgroup" data-cells="3" data-field="mat_jours">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="inline-label fr">jours</span>
              <span className="cellgroup" data-cells="3" data-field="mat_heures">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="inline-label fr">heures</span>
              <span className="mid-spacer"></span>
              <span className="inline-label ar">ساعة</span>
              <span className="cellgroup" data-cells="3" data-field="mat_heures_ar">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="inline-label ar">يوما</span>
              <span className="cellgroup" data-cells="3" data-field="mat_jours_ar">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="ar-label ar">المؤمن له اشتغل لمدة :</span>
            </div>
            <div className="duree-row">
              <span className="fr-label fr">du :</span>
              <span className="db3 font-mono" data-date="mat_du">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
              <span className="fr-label fr" style={{ marginInlineStart: '8px' }}>
                au :
              </span>
              <span className="db3 font-mono" data-date="mat_au">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
              <span className="mid-spacer"></span>
              <span className="ar-label ar">إلى :</span>
              <span className="db3 font-mono" data-date="mat_au_ar">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
              <span className="ar-label ar" style={{ marginInlineEnd: '8px' }}>
                من :
              </span>
              <span className="db3 font-mono" data-date="mat_du_ar">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
            </div>
            <div className="selon">
              <span className="fr">Selon le cas</span>
              <span className="ar">حسب الحالة :</span>
            </div>
            <div className="explain">
              <div className="fr">
                Au cours du trimestre civil qui précède la date de la première constatation de la maladie ou les trois (03) mois qui précèdent la date de la constatation de la grossesse .<br />
                Au cours des douze (12) mois (de date à date) précèdant la date de la premiéère constatation de la maladie ou de la date de constatation de la grossesse .
              </div>
              <div className="ar">
                خلال الثلاثي المدني الأخير الذي يسبق تاريخ أول معاينة للمرض أو خلال الثلاثة (03) أشهر التي تسبق تاريخ معاينة الحمل .<br />
                خلال الإثني عشرة (12) شهرا (من تاريخ إلى تاريخ) التي تسبق تاريخ أول معاينة للمرض أو معاينة الحمل .
              </div>
            </div>
          </div>

          {/* ============ SECTION 5: INVALIDITÉ ============ */}
          <div className="sec-title plain">
            <div className="sec-title-text">
              <span className="ar">في حالة التوقف عن العمل لأكثر من 06 أشهر أو في حالة العجز</span>
              <span className="fr">EN CAS D'ARRET DE TRAVAIL DÉPASSANT 06 MOIS OU EN CAS D'INVALIDITÉ</span>
            </div>
          </div>
          <div className="box">
            <div className="duree-row">
              <span className="fr-label fr">L'assuré(e) a travaillé pendant :</span>
              <span className="cellgroup" data-cells="3" data-field="inv_jours">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="inline-label fr">jours</span>
              <span className="cellgroup" data-cells="3" data-field="inv_heures">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="inline-label fr">heures</span>
              <span className="mid-spacer"></span>
              <span className="inline-label ar">ساعة</span>
              <span className="cellgroup" data-cells="3" data-field="inv_heures_ar">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="inline-label ar">يوما</span>
              <span className="cellgroup" data-cells="3" data-field="inv_jours_ar">
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
                <span className="cell" contentEditable suppressContentEditableWarning />
              </span>
              <span className="ar-label ar">المؤمن له اشتغل لمدة :</span>
            </div>
            <div className="duree-row">
              <span className="fr-label fr">du :</span>
              <span className="db3 font-mono" data-date="inv_du">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
              <span className="fr-label fr" style={{ marginInlineStart: '8px' }}>
                au :
              </span>
              <span className="db3 font-mono" data-date="inv_au">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
              <span className="mid-spacer"></span>
              <span className="ar-label ar">إلى :</span>
              <span className="db3 font-mono" data-date="inv_au_ar">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
              <span className="ar-label ar" style={{ marginInlineEnd: '8px' }}>
                من :
              </span>
              <span className="db3 font-mono" data-date="inv_du_ar">
                <i className="day" contentEditable suppressContentEditableWarning />
                <i className="month" contentEditable suppressContentEditableWarning />
                <i className="year" contentEditable suppressContentEditableWarning />
              </span>
            </div>
            <div className="explain">
              <div className="fr">
                Au cours des douze (12) mois ou des trois (03) années (de date à date) précède la date de la première constatation de la maladie .
              </div>
              <div className="ar">
                خلال الإثني عشرة (12) شهرا (من تاريخ إلى تاريخ) أو الثلاث (03) سنوات التي تسبق تاريخ أول معاينة للمرض .
              </div>
            </div>
          </div>
        </div>

        <div className="footer-vert">IMP.CNAS 03-2021 - AS.01</div>
      </div>
    </div>
  );
};
