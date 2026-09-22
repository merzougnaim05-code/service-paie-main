import React, { useState, useRef } from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';
import { ATSFront } from './ATSFront';
import { ATSBack } from './ATSBack';
import { InfoForm } from './InfoForm';
import { FamilyAllowanceCert } from './FamilyAllowanceCert';
import { DocsRequest } from './DocsRequest';
import { SalaryDisclosureForm } from './SalaryDisclosureForm';
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
    // كل وثيقة A4 ملفوفة داخل .afs-inner — نلتقطها بحجمها الطبيعي
    const inners = (Array.from(root.querySelectorAll('.afs-inner')) as HTMLElement[])
      .filter(el => el.offsetWidth > 0);
    if (inners.length === 0) return;

    setExportingPdf(true);
    try {
      await exportElementsToPdf(inners, `وثيقة_${docType}_${currentEmployee?.name || 'موظف'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('تعذر توليد ملف PDF، يرجى المحاولة مرة أخرى.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!currentEmployee) {
    return (
      <div className="py-12 text-center text-[#736a58]">
        يرجى اختيار أو تسجيل موظف أولاً لعرض الوثائق الإدارية.
      </div>
    );
  }

  const today = new Date().toLocaleDateString('ar-DZ');

  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      {/* Control bar */}
      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e5ddcb]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a3d2b] font-['Cairo'] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#176b4a]" />
              <span>شهادة العمل والأجر (ATS) والنماذج الرسمية CNAS</span>
            </h2>
            <p className="text-xs text-[#706856] mt-0.5">
              نماذج مطابقة طبق الأصل لـ (CNAS AS.01) مع الملء الآلي من جدول الرواتب وقابلية التعديل والطباعة.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="bg-[#176b4a] hover:bg-[#12553b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوثيقة</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={exportingPdf}
              className="bg-white hover:bg-[#f5f2e8] text-[#176b4a] border border-[#176b4a] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? 'جاري التوليد...' : 'تحميل (PDF)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-[#443e33] mb-1">اختيار الموظف</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1a3d2b] focus:outline-none"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — ({JOBS[e.jobIdx]?.name || 'موظف'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#443e33] mb-1">نوع الوثيقة الرسمية</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full bg-white border border-[#176b4a] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#176b4a] focus:outline-none shadow-sm"
            >
              <option value="ats-front">⭐ شهادة العمل والأجر ATS (الوجه الأول - AS.01)</option>
              <option value="ats-back">⭐ شهادة العمل والأجر ATS (الوجه الثاني - جدول 12 شهراً)</option>
              <option value="ats-both">⭐ شهادة العمل والأجر ATS (الوجهان معاً - Recto/Verso)</option>
              <option value="drt">تصريح مباشرة واستئناف العمل (DRT AS-09)</option>
              <option value="form">استمارة معلومات الموظف</option>
              <option value="family-cert">شهادة عدم تقاضي المنح العائلية</option>
              <option value="request-docs">طلب وثائق لإتمام ملف</option>
              <option value="salary-disclosure">استمارة خاصة بكشف المرتبات (منحة دراسية)</option>
            </select>
          </div>

          <div className="bg-[#eef5ff] border border-[#b8d4fe] rounded-xl p-2.5 text-xs text-[#004e9a] flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-[#0070C0]" />
            <span>
              جميع الحقول والخلايا والتواريخ تفاعلية <strong>(قابلة للنقر والتعديل المباشر)</strong> قبل الطباعة أو التصدير.
            </span>
          </div>
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
              <ATSBack employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 3. OFFICIAL ATS BOTH (RECTO & VERSO) */}
          {/* ======================================================== */}
          {docType === 'ats-both' && (
            <div className="space-y-8 w-full flex flex-col items-center">
              <div className="w-full text-center py-2 text-xs font-bold text-[#706856] print:hidden">
                — الوجه الأول (Recto - عمودي A4) —
              </div>
              <AutoFitScale docWidth={794}>
                <ATSFront employee={currentEmployee} settings={settings} />
              </AutoFitScale>

              <div className="w-full text-center py-2 text-xs font-bold text-[#706856] print:hidden">
                — الوجه الثاني (Verso - أفقي A4) —
              </div>
              <AutoFitScale docWidth={1123}>
                <ATSBack employee={currentEmployee} settings={settings} />
              </AutoFitScale>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. DRT (AS-09) */}
          {/* ======================================================== */}
          {docType === 'drt' && (
            <AutoFitScale docWidth={840}>
            <div
              className="bg-white border-2 border-gray-300 shadow-md p-8 sm:p-12 max-w-[800px] w-full text-black font-['Times_New_Roman',serif] text-sm leading-relaxed"
              style={{ direction: 'rtl' }}
            >
              <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
                <div className="text-right">
                  <div className="text-xs font-bold">الجمهورية الجزائرية الديمقراطية الشعبية</div>
                  <div className="text-xs font-bold">الصندوق الوطني للتأمينات الاجتماعية للعمال الأجراء (CNAS)</div>
                </div>
                <div className="text-left font-mono font-bold text-xs">
                  <div>RÉF : AS-09</div>
                  <div>D.R.T</div>
                </div>
              </div>

              <div className="text-center my-6">
                <h1 className="text-2xl font-black font-['Cairo'] text-black underline tracking-wide">
                  تــصــريـــح بـمـبـاشــرة / اسـتـئـنــاف الــعــمــل
                </h1>
                <div className="text-sm font-bold font-mono tracking-widest text-gray-800 mt-1">
                  DÉCLARATION DE REPRISE DU TRAVAIL
                </div>
              </div>

              <div className="space-y-5 text-justify leading-loose my-6">
                <p>
                  نحن الموقعين أسفله، إدارة مؤسسة <strong>{settings.institution}</strong> تحت رقم صاحب العمل المنتسب{' '}
                  <strong>{settings.cnasNum || '................................'}</strong>:
                </p>

                <p>
                  نصرح بأن الموظف(ة): <strong>{currentEmployee.name}</strong>، الحامل لرقم الضمان الاجتماعي{' '}
                  <strong className="font-mono">{currentEmployee.ssn || '................................'}</strong>، والمولود(ة) بتاريخ{' '}
                  <strong className="font-mono">{currentEmployee.birthDate || '..../../..'}</strong>.
                </p>

                <div className="border border-black p-4 space-y-3 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">الوظيفة / المنصب:</span>
                    <span>{currentJob?.name || 'موظف'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">تاريخ التوقف عن العمل:</span>
                    <span className="font-mono">{currentEmployee.lastWorkDate || '..../../..'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">تاريخ استئناف العمل الفعلي:</span>
                    <span className="font-mono font-bold text-[#176b4a]">
                      {currentEmployee.resumeDate || today}
                    </span>
                  </div>
                </div>

                <p>
                  وقد استأنف مهامه بصفة عادية ابتداءً من التاريخ المذكور أعلاه بعد انقضاء فترة الغياب أو العطلة المرضية المبررة قانوناً.
                </p>
              </div>

              <div className="flex justify-between items-end mt-12 pt-8">
                <div>
                  <div className="text-xs text-gray-600">حرر بـ: {settings.wilaya || 'باتنة'}</div>
                  <div className="text-xs text-gray-600">بتاريخ: {today}</div>
                </div>

                <div className="text-center min-w-[200px]">
                  <div className="font-bold text-sm">ختم وتوقيع رئيس المؤسسة</div>
                  <div className="h-16" />
                </div>
              </div>
            </div>
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 5. Employee Information Form (استمارة معلومات) */}
          {/* ======================================================== */}
          {docType === 'form' && (
            <AutoFitScale docWidth={794}>
              <InfoForm employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 6. Family Cert (شهادة عدم تقاضي المنح العائلية) */}
          {/* ======================================================== */}
          {docType === 'family-cert' && (
            <AutoFitScale docWidth={794}>
              <FamilyAllowanceCert employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 7. Request for Missing Documents (طلب وثائق لإتمام ملف) */}
          {/* ======================================================== */}
          {docType === 'request-docs' && (
            <AutoFitScale docWidth={794}>
              <DocsRequest employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 8. Salary Disclosure Form (استمارة خاصة بكشف المرتبات) */}
          {/* ======================================================== */}
          {docType === 'salary-disclosure' && (
            <AutoFitScale docWidth={794}>
              <SalaryDisclosureForm employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}
        </div>
      </div>
    </div>
  );
};
