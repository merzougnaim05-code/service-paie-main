import React from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';

interface InfoFormProps {
  employee: Employee;
  settings: Settings;
}

// Split a full name into { lastName, firstName } — last token is the family name.
const splitName = (full: string) => {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: '', firstName: '' };
  if (parts.length === 1) return { lastName: parts[0], firstName: '' };
  return { lastName: parts[parts.length - 1], firstName: parts.slice(0, -1).join(' ') };
};

const isoDate = (d?: string) => String(d || '').replace(/-/g, '/');

export const InfoForm: React.FC<InfoFormProps> = ({ employee, settings }) => {
  const job = JOBS[employee.jobIdx];
  const { lastName, firstName } = splitName(employee.name);
  const mutuelleDigits = String(employee.mutuelleNum || '').replace(/\D/g, '').slice(-7);

  const fieldCell = (value: string, extraClass = '') => (
    <span
      className={`if-input dots-fill ${extraClass}`}
      contentEditable
      suppressContentEditableWarning
    >
      {value}
    </span>
  );

  return (
    <div className="if-wrapper">
      <style>{`
        @page { size: 210mm 297mm; margin: 0; }
        .if-page * { box-sizing: border-box; }
        .if-page {
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
          font-size: 13pt;
          line-height: 1.35;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm; overflow: hidden; }
          .if-page { box-shadow: none !important; height: 296.5mm !important; overflow: hidden !important; margin: 0 !important; }
        }

        .if-page .if-input {
          display: inline-block;
          border-bottom: 1px dotted #000;
          outline: none;
          font-weight: bold;
          background: transparent;
          padding: 0 4px;
          min-width: 1em;
          unicode-bidi: plaintext;
        }
        .if-page .if-input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .if-page .digit-box-container {
          display: inline-flex;
          flex-direction: row-reverse;
          border: 1.5px solid #000;
          height: 26px;
          vertical-align: middle;
        }
        .if-page .digit-box {
          width: 22px;
          height: 100%;
          border-left: 1px solid #000;
          text-align: center;
          font-weight: bold;
          font-size: 11pt;
          line-height: 24px;
          unicode-bidi: plaintext;
        }
        .if-page .digit-box:last-child { border-left: none; }
        .if-page .digit-box:focus-within { background: #eef5ff; }

        .if-page .single-border-box {
          display: inline-block;
          border: 1.5px solid #000;
          padding: 2px 10px;
          min-width: 180px;
          text-align: center;
          font-weight: bold;
          unicode-bidi: plaintext;
        }

        .if-page .top-header { text-align: center; font-weight: bold; font-size: 13.5pt; margin-bottom: 5px; line-height: 1.3; }
        .if-page .header-grid { display: table; width: 100%; margin-bottom: 15px; }
        .if-page .header-right { display: table-cell; text-align: right; width: 50%; vertical-align: top; font-weight: bold; font-size: 12.5pt; line-height: 1.5; }
        .if-page .header-left { display: table-cell; width: 50%; }

        .if-page .document-title { text-align: center; font-size: 16pt; font-weight: bold; margin: 10px 0 25px 0; letter-spacing: 2px; }

        .if-page .columns-container { display: table; width: 100%; margin-bottom: 25px; table-layout: fixed; }
        .if-page .column { display: table-cell; width: 50%; vertical-align: top; padding: 0 5px; }
        .if-page .column-left { border-right: 2px solid #000; padding-right: 15px; }
        .if-page .column-right { padding-left: 10px; }
        .if-page .column-title { font-size: 14pt; font-weight: bold; margin-bottom: 12px; text-decoration: underline; }

        .if-page .field-row { margin-bottom: 8px; display: flex; align-items: baseline; min-height: 28px; }
        .if-page .field-row .label { font-weight: bold; white-space: nowrap; }
        .if-page .field-row .dots-fill { flex-grow: 1; }

        .if-page .notes-section { font-size: 11pt; margin-top: 25px; line-height: 1.5; }
        .if-page .notes-section strong { font-size: 12pt; text-decoration: underline; display: block; margin-bottom: 4px; }
        .if-page .notes-section p { margin: 2px 0; padding-right: 15px; }

        .if-page .signatures-section { display: table; width: 100%; margin-top: 50px; font-size: 13pt; font-weight: bold; }
        .if-page .sig-box { display: table-cell; width: 50%; text-align: center; }
      `}</style>

      <div className="if-page" id="info-form">
        {/* Centered Republic Header */}
        <div className="top-header">
          <div>الجمهورية الجزائرية الديمقراطية الشعبية</div>
          <div>وزارة التربية الوطنية</div>
        </div>

        {/* Right Ministry Meta Information */}
        <div className="header-grid">
          <div className="header-right">
            <div>مديرية التربية لولاية <span className="if-input" contentEditable suppressContentEditableWarning>{settings.wilaya || ''}</span></div>
            <div>مصلحة تسيير نفقات المستخدمين</div>
          </div>
          <div className="header-left"></div>
        </div>

        {/* Main Title */}
        <div className="document-title">إستـمــــــارة معلــــومــــــات</div>

        {/* Content Split Columns */}
        <div className="columns-container">
          {/* Right Column: Employee Info */}
          <div className="column column-right">
            <div className="column-title">* الموظــــف:</div>

            <div className="field-row">
              <span className="label" style={{ marginLeft: 10 }}>رقم التعريف:</span>
              <div className="single-border-box">
                <span className="if-input" style={{ width: '90%', border: 'none' }} contentEditable suppressContentEditableWarning></span>
              </div>
            </div>

            <div className="field-row">
              <span className="label">اللـــــقـب:</span>
              {fieldCell(lastName)}
            </div>

            <div className="field-row">
              <span className="label">اللقب الأصلي للمتزوجات:</span>
              {fieldCell('')}
            </div>

            <div className="field-row">
              <span className="label">الإســـم:</span>
              {fieldCell(firstName)}
            </div>

            <div className="field-row">
              <span className="label">تاريخ الميلاد:</span>
              {fieldCell(isoDate(employee.birthDate), 'text-center')}
            </div>

            <div className="field-row">
              <span className="label">الوظيفة:</span>
              {fieldCell(job?.name || '')}
            </div>

            <div className="field-row">
              <span className="label">مكان العمل:</span>
              {fieldCell(settings.municipality || settings.wilaya || '')}
            </div>

            <div className="field-row" style={{ marginTop: 6 }}>
              <span className="label" style={{ marginLeft: 10 }}>رقم الضمان الإجتماعي:</span>
              <div className="single-border-box">
                <span className="if-input" style={{ width: '90%', border: 'none' }} contentEditable suppressContentEditableWarning>
                  {employee.ssn || ''}
                </span>
              </div>
            </div>

            <div className="field-row" style={{ marginTop: 6 }}>
              <span className="label" style={{ marginLeft: 10 }}>رقم التعاضدية:</span>
              <div className="digit-box-container">
                {Array.from({ length: 7 }).map((_, i) => (
                  <span key={i} className="digit-box if-input" style={{ border: 'none', padding: 0 }} contentEditable suppressContentEditableWarning>
                    {employee.mutuelle ? (mutuelleDigits[i] || '') : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="field-row">
              <span className="label">الحالة العائلية:</span>
              {fieldCell(employee.marital || '', 'text-center')}
            </div>

            <div className="field-row">
              <span className="label">عدد الأطفال تحت الكفالة:</span>
              {fieldCell(String(employee.children10 ?? ''), 'text-center')}
            </div>
          </div>

          {/* Left Column: Spouse Info */}
          <div className="column column-left">
            <div className="column-title">* الــــزوج:</div>

            <div className="field-row">
              <span className="label" style={{ marginLeft: 10 }}>رقم التعريف:</span>
              <div className="digit-box-container">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="digit-box if-input" style={{ border: 'none', padding: 0 }} contentEditable suppressContentEditableWarning></span>
                ))}
              </div>
            </div>

            <div className="field-row">
              <span className="label">اللـــــقـب:</span>
              {fieldCell('')}
            </div>

            <div className="field-row">
              <span className="label">اللقب الأصلي للمتزوجات:</span>
              {fieldCell('')}
            </div>

            <div className="field-row">
              <span className="label">الإســـم:</span>
              {fieldCell('')}
            </div>

            <div className="field-row">
              <span className="label">تاريخ الميلاد:</span>
              {fieldCell('')}
            </div>

            <div className="field-row">
              <span className="label">الوظيفة:</span>
              {fieldCell('')}
            </div>

            <div className="field-row">
              <span className="label">مكان العمل:</span>
              {fieldCell('')}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="notes-section">
          <strong>ملاحظة:</strong>
          <p>* تنجز هذه الإستمارة مع مطلع كل سنة دراسية.</p>
          <p>* أو أثناء تغيير حركة تحول الموظفين.</p>
        </div>

        {/* Signatures */}
        <div className="signatures-section">
          <div className="sig-box">إمضاء الموظـــف</div>
          <div className="sig-box">المــــديـــــر</div>
        </div>
      </div>
    </div>
  );
};
