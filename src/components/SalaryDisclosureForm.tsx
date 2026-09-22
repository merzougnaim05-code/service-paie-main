import React from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';
import { computePayslip, fmt, amountWordsDZD } from '../utils/salaryCalculator';

interface SalaryDisclosureFormProps {
  employee: Employee;
  settings: Settings;
}

const splitName = (full: string) => {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: '', firstName: '' };
  if (parts.length === 1) return { lastName: parts[0], firstName: '' };
  return { lastName: parts[parts.length - 1], firstName: parts.slice(0, -1).join(' ') };
};

export const SalaryDisclosureForm: React.FC<SalaryDisclosureFormProps> = ({ employee, settings }) => {
  const job = JOBS[employee.jobIdx];
  const { lastName } = splitName(employee.name);

  const today = new Date();
  const payslip = computePayslip(employee, today.getMonth() + 1, today.getFullYear(), settings);
  // المرتب الصافي السنوي = الصافي الشهري × 12
  const annualNet = Math.round((payslip.net * 12) * 100) / 100;

  return (
    <div className="sdf-wrapper">
      <style>{`
        @page { size: 210mm 297mm; margin: 0; }
        .sdf-page * { box-sizing: border-box; }
        .sdf-page {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          margin: 0 auto;
          padding: 15mm 20mm;
          direction: rtl;
          text-align: right;
          color: #000;
          font-family: 'Amiri', 'Traditional Arabic', 'Simplified Arabic', 'Times New Roman', serif;
          font-size: 14pt;
          line-height: 1.5;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 210mm; height: 297mm; overflow: hidden; }
          .sdf-page { box-shadow: none !important; height: 296.5mm !important; overflow: hidden !important; margin: 0 !important; }
        }

        .sdf-page .sdf-input {
          border: none;
          outline: none;
          font-family: inherit;
          font-size: inherit;
          font-weight: bold;
          background: transparent;
          padding: 0 5px;
          text-align: center;
          unicode-bidi: plaintext;
        }
        .sdf-page .sdf-input:focus { background: #eef5ff; outline: 1.5px solid #0070C0; }
        .sdf-page .sdf-input.dotted { border-bottom: 1px dotted #000; }

        .sdf-page .top-header { text-align: center; font-size: 14pt; font-weight: normal; margin-bottom: 20px; }

        .sdf-page .right-header-block { text-align: right; font-size: 13pt; line-height: 1.8; margin-right: 20px; }
        .sdf-page .right-header-block .header-row { display: flex; align-items: baseline; }
        .sdf-page .right-header-block .header-row .label { min-width: 140px; font-weight: bold; }

        .sdf-page .title-box-container { margin: 25px auto 5px auto; width: 85%; text-align: center; }
        .sdf-page .title-box {
          background-color: #d9d9d9;
          border: 1px solid #000;
          padding: 12px 10px;
          font-size: 22pt;
          font-weight: bold;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.1);
        }
        .sdf-page .subtitle { text-align: center; font-size: 11pt; margin-bottom: 35px; }

        .sdf-page .form-section { margin-top: 20px; line-height: 2.2; }
        .sdf-page .form-row { display: flex; align-items: baseline; margin-bottom: 12px; position: relative; }
        .sdf-page .dotted-line {
          flex-grow: 1;
          border-bottom: 1px dotted #000;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: 2px;
        }

        .sdf-page .gray-field-band {
          background-color: #d9d9d9;
          width: 100%;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 5px;
          margin-bottom: 10px;
          font-weight: bold;
        }

        .sdf-page .amount-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 5px;
          border-bottom: 1px dotted #000;
          padding-bottom: 4px;
        }

        .sdf-page .date-stamp-section { margin-top: 25px; text-align: center; font-size: 13pt; font-weight: bold; }
        .sdf-page .date-line { border-bottom: 1px dotted #000; padding-bottom: 2px; margin-bottom: 15px; }

        .sdf-page .footnotes-container { margin-top: 60px; display: flex; justify-content: flex-end; }
        .sdf-page .footnotes-block {
          width: 40%;
          border-top: 1px solid #000;
          padding-top: 5px;
          font-size: 10.5pt;
          line-height: 1.5;
        }
        .sdf-page .footnotes-block div { margin-bottom: 2px; }
      `}</style>

      <div className="sdf-page" id="salary-disclosure-form">
        {/* Country Title */}
        <div className="top-header">الجمهورية الجزائرية الديمقراطية الشعبية</div>

        {/* Right-Aligned Header Metadata */}
        <div className="right-header-block">
          <div>وزارة التربية الوطنية</div>
          <div className="header-row">
            <span>مديرية التربية لولاية :</span>
            <span className="sdf-input dotted" style={{ width: 120, textAlign: 'right' }} contentEditable suppressContentEditableWarning>{settings.wilaya || ''}</span>
          </div>
          <div className="header-row">
            <span style={{ fontWeight: 'bold' }}>المؤسسة :</span>
            <span className="sdf-input dotted" style={{ width: 250, textAlign: 'right' }} contentEditable suppressContentEditableWarning>{settings.institution || ''}</span>
          </div>
        </div>

        {/* Shaded Title Box */}
        <div className="title-box-container">
          <div className="title-box">إستمارة خاصة بكشف المرتبات</div>
        </div>
        <div className="subtitle">يرفق هذا الكشف بطلب المنحة الدراسية الجامعية</div>

        {/* Main Content Section */}
        <div className="form-section">
          {/* Row 1 */}
          <div className="form-row">
            <span style={{ fontWeight: 'bold', width: 220 }}>أنا الممضي أسفله ( 1 ) :</span>
            <div className="dotted-line">
              <span className="sdf-input" style={{ width: 60 }} contentEditable suppressContentEditableWarning>{lastName}</span>
              <div>
                <span style={{ fontWeight: 'bold' }}>لـ :</span>
                <span className="sdf-input" style={{ width: 250, textAlign: 'right' }} contentEditable suppressContentEditableWarning>{settings.institution || ''}</span>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-row">
            <span style={{ fontWeight: 'bold', width: 220 }}>أشهد أن الســـــــــــد :</span>
            <div className="dotted-line">
              <span className="sdf-input" style={{ width: '100%', textAlign: 'center' }} contentEditable suppressContentEditableWarning>{employee.name || ''}</span>
            </div>
          </div>

          {/* Row 3 */}
          <div className="form-row">
            <span style={{ fontWeight: 'bold', width: 220 }}>يمارس بالمؤسستنا ( 2 ) :</span>
            <div className="dotted-line">
              <span className="sdf-input" style={{ width: '100%', textAlign: 'center' }} contentEditable suppressContentEditableWarning>{settings.institution || ''}</span>
            </div>
          </div>

          {/* Row 4 */}
          <div className="form-row">
            <span style={{ fontWeight: 'bold', width: 220 }}>وظيـــــــــــــــــــــته :</span>
            <div className="dotted-line">
              <span className="sdf-input" style={{ width: '100%', textAlign: 'center' }} contentEditable suppressContentEditableWarning>{job?.name || ''}</span>
            </div>
          </div>

          {/* Statement Text */}
          <div style={{ fontWeight: 'bold', marginTop: 15 }}>
            وأنه يتقاضى مرتبا سنويا صافيا خال من كل التعويضات والمنح العائلية
          </div>
          <div style={{ fontWeight: 'bold', marginBottom: 10 }}>
            والمقتطع في إطار الضمان الاجتماعي ( 3 ) :
          </div>

          {/* Field 3 Shaded Box — التحرير بالأحرف */}
          <div className="gray-field-band">
            <span className="sdf-input" style={{ width: '90%', fontWeight: 'bold' }} contentEditable suppressContentEditableWarning>
              {amountWordsDZD(annualNet)}
            </span>
          </div>

          {/* Field 4 Amount Row — التحرير بالأرقام */}
          <div className="amount-row">
            <span style={{ fontWeight: 'bold', marginLeft: 20 }}>:( 4 )</span>
            <span className="sdf-input" style={{ width: 120 }} contentEditable suppressContentEditableWarning>
              {fmt(annualNet)}
            </span>
            <span style={{ fontWeight: 'bold', marginRight: 15 }}>دج</span>
          </div>
        </div>

        {/* Date and Signature */}
        <div className="date-stamp-section">
          <div className="date-line">
            {settings.municipality || settings.wilaya || ''} في : <span className="sdf-input" style={{ width: 140 }} contentEditable suppressContentEditableWarning>
              {today.getFullYear()}/{String(today.getMonth() + 1).padStart(2, '0')}/{String(today.getDate()).padStart(2, '0')}
            </span>
          </div>
          <div style={{ marginTop: 15 }}>الإمضاء والختم</div>
        </div>

        {/* Footnotes Bottom Right */}
        <div className="footnotes-container">
          <div className="footnotes-block">
            <div>(1) - اللقب</div>
            <div>(2) - طبيعة المؤسسة</div>
            <div>(3) - التحرير بالأحرف</div>
            <div>(4) - التحرير يكون بالأرقام</div>
          </div>
        </div>
      </div>
    </div>
  );
};
