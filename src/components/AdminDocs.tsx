import React, { useState, useRef } from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';
import { ATSFront } from './ATSFront';
import { ATSBack } from './ATSBack';
import { InfoForm } from './InfoForm';
import { FamilyAllowanceCert } from './FamilyAllowanceCert';
import { DocsRequest } from './DocsRequest';
import { SalaryDisclosureForm } from './SalaryDisclosureForm';
import { DrtExcelDoc } from './DrtExcelDoc';
import { FamilyTableDoc, ExplanationLetter, MutuelleCert } from './FamilyDocs';
import { AutoFitScale } from './DeviceScaler';
import { exportElementsToPdf } from '../utils/exportPdf';
import {
  FileText,
  Printer,
  Download,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface AdminDocsProps {
  employees: Employee[];
  settings: Settings;
  selectedEmpId?: string;
  initialDocType?: string;
}

export const AdminDocs: React.FC<AdminDocsProps> = ({
  employees,
  settings,
  selectedEmpId,
  initialDocType
}) => {
  const [empId, setEmpId] = useState<string>(selectedEmpId || employees[0]?.id || '');
  const [docType, setDocType] = useState<string>(initialDocType || 'ats-front');
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  // الشهر المرجعي للوجه الثاني من ATS (يُعاد توليد 12 شهرا ending بهذا الشهر)
  const [refMonth, setRefMonth] = useState<number>(new Date().getMonth() + 1);
  const [refYear, setRefYear] = useState<number>(new Date().getFullYear());
  const docRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (initialDocType) {
      setDocType(initialDocType);
    }
  }, [initialDocType]);

  React.useEffect(() => {
    if (selectedEmpId) {
      setEmpId(selectedEmpId);
    }
  }, [selectedEmpId]);

  const currentEmployee = employees.find(e => e.id === empId) || employees[0];
  const currentJob = currentEmployee ? JOBS[currentEmployee.jobIdx] : undefined;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const root = docRef.current;
    if (!root || exportingPdf) return;
    // لأجل A4 في PDF: نستعمل الحواف الداخلية .afs-inner لتقصير الصفحات قبل التصدير
    const inners = (Array.from(root.querySelectorAll('.afs-inner')) as HTMLElement[])
      .filter(el => el.offsetWidth > 0);
    if (inners.length === 0) return;

    setExportingPdf(true);
    try {
      await exportElementsToPdf(inners, `وثيقة_${docType}_${currentEmployee?.name || 'موظف'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('تعذر إنشاء ملف PDF، تحقق من الإعدادات وحاول مرة أخرى.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!currentEmployee) {
    return (
      <div className="py-12 text-center text-[#64748b]">
        لا توجد موظفون. أضف موظفا من قسم الموظفين أولا.
      </div>
    );
  }

  const today = new Date().toLocaleDateString('ar-DZ');

  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      {/* Control bar */}
      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e2e8f0]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#047857]" />
              <span>شهادة التوقف عن العمل (ATS) المؤمن عليه لدى CNAS</span>
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              الطباعة الرسمية وفق نموذج (CNAS AS.01) — الوجه الأمامي والخلفي وجدول 12 شهرا ببيانات البرنامج الرسمية.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة مباشرة</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={exportingPdf}
              className="bg-white hover:bg-[#f1f5f9] text-[#047857] border border-[#047857] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? 'جاري التصدير...' : 'تصدير (PDF)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">اختر الموظف</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} - ({JOBS[e.jobIdx]?.name || 'موظف'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">نوع الوثيقة المطلوبة</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full bg-white border border-[#047857] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#047857] focus:outline-none shadow-sm"
            >
              <option value="ats-front">الوجه الأول لاستئناف العمل ATS (الصفحة الأولى - AS.01)</option>
              <option value="ats-back">الوجه الثاني لاستئناف العمل ATS (جدول 12 شهرا)</option>
              <option value="ats-both">الوثيقة الكاملة لاستئناف العمل ATS (الوجهان معا - Recto/Verso)</option>
              <option value="drt">وثيقة استئناف العمل (DRT - طبق الأصل الرسمي)</option>
              <option value="form">استمارة معلومات الموظف</option>
              <option value="family-cert">شهادة عدم تقاضي المنح العائلية</option>
              <option value="request-docs">طلب وثائق الملف الإداري</option>
              <option value="salary-disclosure">استمارة كشف المرتبات (منحة دراسية)</option>
              <option value="family-withdraw">شهادة توقيف الدفع للمنح العائلية (سحب المنحة)</option>
              <option value="family-insert">شهادة تحيين الوضعية العائلية - إدراج (إفادة إدماج)</option>
              <option value="explanation-letter">خطاب التوضيح (المادة 36)</option>
              <option value="mutuelle-cert">شهادة جماعية التغطية الإجتماعية للموظفين</option>
            </select>
          </div>

          <div className="bg-[#eef5ff] border border-[#b8d4fe] rounded-xl p-2.5 text-xs text-[#004e9a] flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-[#0070C0]" />
            <span>
              تُملأ الوثائق آليا من بيانات البرنامج الرسمية <strong>(كشف حساب الراتب و الوثائق السابقة)</strong> وتعديل يدوي ممكن.
            </span>
          </div>

          {(docType === 'ats-back' || docType === 'ats-both') && (
            <div>
              <label className="block text-xs font-bold text-[#1e293b] mb-1">الشهر المرجعي (توليد 12 شهرا)</label>
              <input
                type="month"
                value={`${refYear}-${String(refMonth).padStart(2, '0')}`}
                onChange={e => {
                  const [y, m] = e.target.value.split('-').map(Number);
                  if (y && m) {
                    setRefYear(y);
                    setRefMonth(m);
                  }
                }}
                className="w-full bg-white border border-[#047857] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#047857] focus:outline-none shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Document Display */}
      <div className="flex justify-center pb-12">
        <div ref={docRef} className="w-full flex flex-col items-center">
          {/* ======================================================== */}
          {/* 1. OFFICIAL ATS FRONT (AS.01) */}
          {/* ======================================================== */}
          {docType === 'ats-front' && (
            <AutoFitScale docWidth={794}>
              <ATSFront employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 2. OFFICIAL ATS BACK (VERSO - 12 MONTHS) */}
          {/* ======================================================== */}
          {docType === 'ats-back' && (
            <AutoFitScale docWidth={1123}>
              <ATSBack employee={currentEmployee} settings={settings} startMonth={refMonth} startYear={refYear} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 3. OFFICIAL ATS BOTH (RECTO & VERSO) */}
          {/* ======================================================== */}
          {docType === 'ats-both' && (
            <div className="space-y-8 w-full flex flex-col items-center">
              <div className="w-full text-center py-2 text-xs font-bold text-[#64748b] print:hidden">
                - الوجه الأول (Recto - ورقة A4) -
              </div>
              <AutoFitScale docWidth={794}>
                <ATSFront employee={currentEmployee} settings={settings} />
              </AutoFitScale>

              <div className="w-full text-center py-2 text-xs font-bold text-[#64748b] print:hidden">
                - الوجه الثاني (Verso - ورقة A4) -
              </div>
              <AutoFitScale docWidth={1123}>
                <ATSBack employee={currentEmployee} settings={settings} startMonth={refMonth} startYear={refYear} />
              </AutoFitScale>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. DRT - استئناف العمل الرسمي (طبق الأصل من AS-09) */}
          {/* ======================================================== */}
          {docType === 'drt' && (
            <AutoFitScale docWidth={529}>
              <DrtExcelDoc employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 5. Employee Information Form (استمارة معلومات الموظف) */}
          {/* ======================================================== */}
          {docType === 'form' && (
            <AutoFitScale docWidth={794}>
              <InfoForm employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 6. Family Cert (شهادة المنحة العائلية) */}
          {/* ======================================================== */}
          {docType === 'family-cert' && (
            <AutoFitScale docWidth={794}>
              <FamilyAllowanceCert employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 7. Request for Missing Documents (طلب وثائق الملف الإداري) */}
          {/* ======================================================== */}
          {docType === 'request-docs' && (
            <AutoFitScale docWidth={794}>
              <DocsRequest employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 8. Salary Disclosure Form (استمارة كشف المرتبات) */}
          {/* ======================================================== */}
          {docType === 'salary-disclosure' && (
            <AutoFitScale docWidth={794}>
              <SalaryDisclosureForm employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {docType === 'family-withdraw' && (
            <AutoFitScale docWidth={794}><FamilyTableDoc employee={currentEmployee} settings={settings} mode={"withdraw"} /></AutoFitScale>
          )}

          {docType === 'family-insert' && (
            <AutoFitScale docWidth={794}><FamilyTableDoc employee={currentEmployee} settings={settings} mode={"insert"} /></AutoFitScale>
          )}

          {docType === 'explanation-letter' && (
            <AutoFitScale docWidth={794}><ExplanationLetter employee={currentEmployee} settings={settings} /></AutoFitScale>
          )}

          {docType === 'mutuelle-cert' && (
            <AutoFitScale docWidth={794}><MutuelleCert employee={currentEmployee} settings={settings} /></AutoFitScale>
          )}
        </div>
      </div>
    </div>
  );
};
