import React, { useState } from 'react';
import { Employee, Settings } from '../types';
import { AutoFitScale } from './DeviceScaler';
import { ATSFront } from './ATSFront';
import { ATSBack } from './ATSBack';
import { PayslipView } from './PayslipView';
import { PensionDocument } from './PensionDocument';
import { CnrAnnexDocs } from './CnrAnnexDocs';
import { DrtExcelDoc } from './DrtExcelDoc';
import { InfoForm } from './InfoForm';
import { FamilyAllowanceCert } from './FamilyAllowanceCert';
import { DocsRequest } from './DocsRequest';
import { SalaryDisclosureForm } from './SalaryDisclosureForm';

interface AllDocsBundleProps {
  employees: Employee[];
  settings: Settings;
  selectedEmpId?: string;
}

const DocSep: React.FC<{ n: number; label: string; last?: boolean }> = ({ n, label, last }) => (
  <div
    className="doc-sep"
    style={{
      paddingTop: '8mm',
      paddingBottom: '4mm',
      textAlign: 'center',
      fontWeight: 900,
      fontSize: '11pt',
      color: '#047857',
      borderTop: '2px dashed #a7f3d0',
      background: '#f0fdf4'
    }}
    data-docsep={n}
    data-last={last ? '1' : ''}
  >
    {n}. {label}
  </div>
);

/**
 * معاينة جميع الوثائق في وثيقة واحدة — كل وثيقة كما هي (بدون أزرار أو خلفيات أو شاشات).
 * الطباعة: كل وثيقة تخرج في صفحة (صفحات) خاصة بها ضمن ورقة واحدة متواصلة.
 */
export const AllDocsBundle: React.FC<AllDocsBundleProps> = ({ employees, settings, selectedEmpId }) => {
  const employee = employees.find(e => e.id === selectedEmpId) || employees[0];
  const [noopUpdate] = useState<(emp: Employee) => void>(() => () => {});
  if (!employee) return <div className="p-6 text-center text-sm">لا توجد موظفات بعد.</div>;

  return (
    <div className="alldocs-wrap" dir="rtl" style={{ background: '#fff' }}>
      <style>{`
        /* إخفاء كل الزوائد (أشرطة التحكم، الأزرار، شاشات الإعداد) الموسومة print:hidden داخل الوثائق نفسها */
        .alldocs-wrap [class~="print:hidden"] { display: none !important; }
        /* إزالة الخلفيات والظلال فقط حول الوثائق دون المساس بمحتواها */
        .alldocs-wrap { background: #fff !important; }
        .alldocs-wrap .doc-page { padding: 0; margin: 0; background: transparent; }
        .alldocs-wrap .doc-page * { box-shadow: none !important; }
        /* الطباعة: كل وثيقة تنكسر على صفحاتها */
        @media print {
          .alldocs-wrap { background: #fff !important; }
          .alldocs-wrap .doc-page { break-after: page; break-inside: avoid; page-break-after: always; page-break-inside: avoid; }
          .alldocs-wrap .doc-sep { display: none !important; }
          .alldocs-wrap .doc-page:last-of-type { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      {/* 1. كشف الراتب (كما هي — الشاشة تُخفى آليا مع الطباعة) */}
      <div className="doc-page" data-doc="payslip">
        <DocSep n={1} label="كشف الراتب" />
        <AutoFitScale docWidth={794}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PayslipView employees={employees} settings={settings} selectedEmpId={employee.id} />
          </div>
        </AutoFitScale>
      </div>

      {/* 2. ATS Recto (CNAS) */}
      <div className="doc-page" data-doc="ats-front">
        <DocSep n={2} label="ATS — شهادة التوقف عن العمل (الوجه الأول)" />
        <AutoFitScale docWidth={794}>
          <ATSFront employee={employee} settings={settings} />
        </AutoFitScale>
      </div>

      {/* 3. ATS Verso (CNAS) */}
      <div className="doc-page" data-doc="ats-back">
        <DocSep n={3} label="ATS — جدول الأشهر (الوجه الثاني)" />
        <AutoFitScale docWidth={1123}>
          <ATSBack employee={employee} settings={settings} />
        </AutoFitScale>
      </div>

      {/* 4. استئناف العمل DRT */}
      <div className="doc-page" data-doc="drt">
        <DocSep n={4} label="استئناف العمل DRT (A4)" />
        <AutoFitScale docWidth={444}>
          <DrtExcelDoc employee={employee} settings={settings} />
        </AutoFitScale>
      </div>

      {/* 5. وثائق التقاعد CNR */}
      <div className="doc-page" data-doc="pension">
        <DocSep n={5} label="وثائق التقاعد CNR — شهادة الأجور 60 شهرا" />
        <AutoFitScale docWidth={1123}>
          <PensionDocument
            employees={employees}
            settings={settings}
            selectedEmpId={employee.id}
            onUpdateEmployee={noopUpdate}
          />
        </AutoFitScale>
      </div>

      {/* 6. استمارة الموظف السنوية */}
      <div className="doc-page" data-doc="form">
        <DocSep n={6} label="استمارة الموظف السنوية" />
        <AutoFitScale docWidth={794}>
          <InfoForm employee={employee} settings={settings} />
        </AutoFitScale>
      </div>

      {/* 7. طلب وثائق الملف الإداري */}
      <div className="doc-page" data-doc="request-docs">
        <DocSep n={7} label="طلب وثائق الملف الإداري" />
        <AutoFitScale docWidth={794}>
          <DocsRequest employee={employee} settings={settings} />
        </AutoFitScale>
      </div>

      {/* 8. شهادة عدم تقاضي المنح العائلية */}
      <div className="doc-page" data-doc="family-cert">
        <DocSep n={8} label="شهادة عدم تقاضي المنح العائلية" />
        <AutoFitScale docWidth={794}>
          <FamilyAllowanceCert employee={employee} settings={settings} />
        </AutoFitScale>
      </div>

      {/* 9. استمارة كشف المرتبات (منحة دراسية) */}
      <div className="doc-page" data-doc="salary-disclosure">
        <DocSep n={9} label="استمارة كشف المرتبات (منحة دراسية)" />
        <AutoFitScale docWidth={794}>
          <SalaryDisclosureForm employee={employee} settings={settings} />
        </AutoFitScale>
      </div>

      {/* 10-13. استمارات وملحقات CNR الأربع */}
      {(['munatec', 'af-stop', 'periodes', 'attestation'] as const).map((dt, i) => (
        <div key={dt} className="doc-page" data-doc={`annex-${dt}`}>
          <DocSep n={10 + i} label={({
            munatec: 'استمارة استنفاء الاشتراكات MUNATEC',
            'af-stop': 'شهادة توقيف الدفع للمنح العائلية (CNR)',
            periodes: 'المدة المأجورة — جدول السنوات (CNR)',
            attestation: 'شهادة العمل Attestation (CNR)'
          } as Record<string, string>)[dt]} last={i === 3} />
          <AutoFitScale docWidth={1123}>
            <CnrAnnexDocs employees={employees} settings={settings} selectedEmpId={employee.id} initialDocType={dt} />
          </AutoFitScale>
        </div>
      ))}
    </div>
  );
};
