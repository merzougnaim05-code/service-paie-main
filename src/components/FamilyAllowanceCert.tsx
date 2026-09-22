import React from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';

interface FamilyAllowanceCertProps {
  employee: Employee;
  settings: Settings;
}

export const FamilyAllowanceCert: React.FC<FamilyAllowanceCertProps> = ({ employee, settings }) => {
  const job = JOBS[employee.jobIdx];
  const today = new Date();
  const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="fac-wrapper">
      <style>{`
        @page { size: 210mm 297mm; margin: 0; }
        .fac-page * { box-sizing: border-box; }
        .fac-page {
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
          .fac-page { box-shadow: none !important; height: 296.5mm !important; overflow: hidden !important; margin: 0 !important; }
        }

        .fac-page .fac-input {
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
        .fac-page .fac-input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .fac-page .top-header { text-align: center; font-weight: bold; font-size: 14.5pt; margin-bottom: 15px; line-height: 1.4; }
        .fac-page .header-grid { display: table; width: 100%; margin-bottom: 25px; }
        .fac-page .header-right { display: table-cell; text-align: right; width: 50%; vertical-align: top; font-weight: bold; font-size: 13.5pt; line-height: 1.6; }
        .fac-page .header-left { display: table-cell; text-align: left; width: 50%; vertical-align: top; font-weight: bold; font-size: 13.5pt; line-height: 1.6; }
        .fac-page .header-left .recipient-title { text-align: right; display: inline-block; width: 100%; }

        .fac-page .title-container { text-align: center; margin: 25px 0 35px 0; }
        .fac-page .title-frame {
          display: inline-block;
          border: 2px solid #000;
          border-radius: 50%;
          padding: 12px 45px;
          box-shadow: 0 0 0 4px #fff, 0 0 0 6px #000;
        }
        .fac-page .title-text { font-size: 18pt; font-weight: bold; letter-spacing: 0.5px; }

        .fac-page .content-body { margin-bottom: 30px; font-size: 14pt; line-height: 2.1; }
        .fac-page .field-row { display: flex; align-items: baseline; margin-bottom: 8px; }
        .fac-page .field-row .label { font-weight: bold; min-width: 180px; }

        .fac-page .closing-text { text-align: center; margin-top: 35px; margin-bottom: 40px; font-size: 14pt; }

        .fac-page .footer-section {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-top: 30px;
          padding-left: 60px;
          font-size: 14pt;
          font-weight: bold;
        }
        .fac-page .footer-date { margin-bottom: 10px; }
      `}</style>

      <div className="fac-page" id="family-allowance-cert">
        {/* Centered Header Block */}
        <div className="top-header">
          <div>الجمهورية الجزائرية الديمقراطية الشعبية</div>
          <div>وزارة التربية الوطنية</div>
        </div>

        {/* Header Grid (Right / Left Information) */}
        <div className="header-grid">
          <div className="header-right">
            <div>مديرية التربية لولاية : <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 180 }}>{settings.wilaya || ''}</span></div>
            <div>المؤسسة : <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 240 }}>{settings.institution || ''}</span></div>
          </div>
          <div className="header-left">
            <div className="recipient-title" style={{ paddingRight: 50 }}>
              <div>الى السيد :</div>
              <div>مدير الضمان الاجتماعي</div>
              <div>فرع {settings.wilaya || '...'} -ولاية {settings.wilaya || '...'} -</div>
            </div>
          </div>
        </div>

        {/* Double-Border Oval Badge Title */}
        <div className="title-container">
          <div className="title-frame">
            <span className="title-text">شهادة عدم تقاضي المنح العائلية</span>
          </div>
        </div>

        {/* Form Content Body */}
        <div className="content-body">
          <div className="field-row">
            <span style={{ fontWeight: 'bold', marginLeft: 10 }}>يشهد السيد</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 200 }}>{settings.signatory || settings.director || ''}</span>
            <span style={{ fontWeight: 'bold', margin: '0 10px' }}>لـ :</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 320 }}>{settings.institution || ''}</span>
          </div>

          <div className="field-row">
            <span className="label">بأن السيد (ة) اللقب والإسم :</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 380 }}>{employee.name || ''}</span>
          </div>

          <div className="field-row">
            <span className="label">تاريخ ومكان الميلاد :</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 180, textAlign: 'center' }}>
              {String(employee.birthDate || '').replace(/-/g, '/')}
            </span>
            <span style={{ margin: '0 10px' }}>بـ :</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 180 }}>{employee.birthPlace || ''}</span>
          </div>

          <div className="field-row">
            <span className="label">الوظيفـــــــــــــــــــــــــــــة :</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 380 }}>{job?.name || ''}</span>
          </div>

          <div className="field-row">
            <span className="label">رقم الضمــــــان الإجتماعي :</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 380 }}>{employee.ssn || ''}</span>
          </div>

          <div className="field-row">
            <span className="label">رقم / ح . ج . البريــــــــدي :</span>
            <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 380 }}>{employee.postalAccount || ''}</span>
          </div>

          <div className="field-row" style={{ marginTop: 10 }}>
            <span style={{ fontWeight: 'bold', marginLeft: 15 }}>لا يتقاضى أي</span>
            <span style={{ fontWeight: 'bold', marginLeft: 15 }}>منح عائلية</span>
            <span>و هذا وفقا لكشوفات الراتب الشهرية التابعة للمؤسسة .</span>
          </div>
        </div>

        {/* Legal Attestation Statement */}
        <div className="closing-text">
          سلمت هذه الشهادة للإدلاء بها في حدود ما يسمح به القانون.
        </div>

        {/* Footer Date */}
        <div className="footer-section">
          <div className="footer-date">
            بوادي الماء في: <span className="fac-input" contentEditable suppressContentEditableWarning style={{ width: 160, textAlign: 'center' }}>{dateStr}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
