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
import { PensionDocument } from './PensionDocument';
import { CnrAnnexDocs } from './CnrAnnexDocs';
import { AutoFitScale } from './DeviceScaler';
import { exportElementsToPdf } from '../utils/exportPdf';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Info,
  ListTree,
  ShieldCheck,
  Users,
  ClipboardList,
  Award,
  ChevronLeft
} from 'lucide-react';

interface AdminDocsProps {
  employees: Employee[];
  settings: Settings;
  selectedEmpId?: string;
  initialDocType?: string;
  onUpdateEmployee?: (emp: Employee) => void;
}

/* ============================================================
   قائمة الوثائق — مجموعات بعناوين (تُعرض في إطار يساري بلون الشريط العلوي)
   ============================================================ */
interface DocGroup {
  title: string;
  icon: React.ReactNode;
  items: { id: string; label: string }[];
}

const DOC_GROUPS: DocGroup[] = [
  {
    title: 'وثائق CNAS — الضمان الاجتماعي',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    items: [
      { id: 'ats-front', label: 'ATS — الوجه الأول (AS.01)' },
      { id: 'ats-back', label: 'ATS — الوجه الثاني (جدول 12 شهرا)' },
      { id: 'ats-both', label: 'ATS — الوثيقة الكاملة (وجهان)' },
      { id: 'drt', label: 'استئناف العمل DRT (AS-09)' }
    ]
  },
  {
    title: 'وثائق المنح العائلية',
    icon: <Users className="w-3.5 h-3.5" />,
    items: [
      { id: 'family-cert', label: 'شهادة عدم تقاضي المنح العائلية' },
      { id: 'family-withdraw', label: 'شهادة توقيف الدفع (سحب المنحة)' },
      { id: 'family-insert', label: 'شهادة تحيين الوضعية — إدراج' }
    ]
  },
  {
    title: 'استمارات مختلفة',
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    items: [
      { id: 'form', label: 'استمارة معلومات الموظف السنوية' },
      { id: 'request-docs', label: 'طلب وثائق الملف الإداري' },
      { id: 'salary-disclosure', label: 'كشف المرتبات (منحة دراسية)' }
    ]
  },
  {
    title: 'وثائق التقاعد CNR',
    icon: <Award className="w-3.5 h-3.5" />,
    items: [
      { id: 'pension', label: 'ملف التقاعد الرسمي (CNR)' },
      { id: 'mutuelle-cert', label: 'شهادة التعاضدية الوطنية لعمال التربية' },
      { id: 'explanation-letter', label: 'خطاب التوضيح (المادة 36)' },
      { id: 'munatec', label: 'شهادة استنفاء الاشتراكات MUNATEC' },
      { id: 'af-stop', label: 'شهادة توقيف الدفع للمنح (CNR)' },
      { id: 'periodes', label: 'المدة المأجورة (جدول السنوات)' },
      { id: 'attestation', label: 'شهادة عمل Attestation' }
    ]
  }
];

const ANNEX_TYPES = ['munatec', 'af-stop', 'periodes', 'attestation'];

function findDocLabel(docType: string): string {
  for (const g of DOC_GROUPS) {
    const item = g.items.find(i => i.id === docType);
    if (item) return item.label;
  }
  return 'وثيقة';
}

export const AdminDocs: React.FC<AdminDocsProps> = ({
  employees,
  settings,
  selectedEmpId,
  initialDocType,
  onUpdateEmployee
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

  // وثائق التقاعد وملحق CNR تُعرض بمكوّناتها الكاملة (لها أدواتها الخاصة)
  const isPensionView = docType === 'pension';
  const isAnnexView = ANNEX_TYPES.includes(docType);

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

  const today = new Date().toLocaleDateString('ar-DZ');
  const currentLabel = findDocLabel(docType);

  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      <div className="flex flex-col lg:flex-row gap-5 items-start">

        {/* ============ القائمة اليسارية: مجموعات الوثائق داخل إطار بلون الشريط العلوي ============ */}
        <aside className="w-full lg:w-80 xl:w-88 flex-shrink-0 lg:order-2 print:hidden">
          <div className="bg-white border-2 border-[#047857] rounded-3xl overflow-hidden shadow-md lg:sticky lg:top-4">
            <div className="bg-[#047857] px-4 py-3 flex items-center gap-2">
              <ListTree className="w-4 h-4 text-emerald-200" />
              <span className="text-white font-black text-sm">قائمة الوثائق والاستمارات</span>
            </div>

            {DOC_GROUPS.map(group => (
              <div key={group.title} className="border-t border-[#a7f3d0]">
                {/* عنوان المجموعة — شريط بلون الشريط العلوي */}
                <div className="bg-[#065f46] px-4 py-2 flex items-center gap-1.5">
                  {group.icon}
                  <span className="text-white text-xs font-black tracking-tight">{group.title}</span>
                </div>
                <ul className="p-2 space-y-1 bg-[#f8fafc]">
                  {group.items.map(item => {
                    const active = docType === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setDocType(item.id)}
                          className={
                            'w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ' +
                            (active
                              ? 'bg-[#047857] text-white border-[#047857] shadow-sm'
                              : 'bg-white text-[#0f172a] border-[#e2e8f0] hover:bg-[#d1fae5] hover:border-[#6ee7b7]')
                          }
                        >
                          <ChevronLeft className={'w-3.5 h-3.5 flex-shrink-0 ' + (active ? 'text-emerald-200' : 'text-[#94a3b8]')} />
                          <span>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* ============ المنطقة الرئيسية: الوثيقة المختارة ============ */}
        <div className="flex-1 min-w-0 w-full lg:order-1">
          {isPensionView && (
            /* وثائق التقاعد الرسمية — المكوّن الكامل بأدواته */
            <PensionDocument
              employees={employees}
              settings={settings}
              selectedEmpId={empId}
              onUpdateEmployee={onUpdateEmployee || (() => { /* تعديلات التقاعد تُدار داخلياً */ })}
            />
          )}

          {isAnnexView && (
            /* ملحق CNR — وثائق طبق الأصل */
            <CnrAnnexDocs
              employees={employees}
              settings={settings}
              selectedEmpId={empId}
              initialDocType={docType}
            />
          )}

          {!isPensionView && !isAnnexView && !currentEmployee && (
            <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-12 shadow-sm text-center text-[#64748b] print:hidden">
              لا توجد موظفون. أضف موظفا من قسم الموظفين أولا.
            </div>
          )}

          {!isPensionView && !isAnnexView && currentEmployee && (
            <>
              {/* Control bar */}
              <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e2e8f0]">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] flex items-center gap-2">
                      <FileText className="w-6 h-6 text-[#047857]" />
                      <span>{currentLabel}</span>
                    </h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      اختر الوثيقة من القائمة الجانبية — تُملأ آليا من بيانات البرنامج الرسمية وتعديل يدوي ممكن.
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
                  {/* 1. OFFICIAL ATS FRONT (AS.01) */}
                  {docType === 'ats-front' && (
                    <AutoFitScale docWidth={794}>
                      <ATSFront employee={currentEmployee} settings={settings} />
                    </AutoFitScale>
                  )}

                  {/* 2. OFFICIAL ATS BACK (VERSO - 12 MONTHS) */}
                  {docType === 'ats-back' && (
                    <AutoFitScale docWidth={1123}>
                      <ATSBack employee={currentEmployee} settings={settings} startMonth={refMonth} startYear={refYear} />
                    </AutoFitScale>
                  )}

                  {/* 3. OFFICIAL ATS BOTH (RECTO & VERSO) */}
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

                  {/* 4. DRT */}
                  {docType === 'drt' && (
                    <AutoFitScale docWidth={529}>
                      <DrtExcelDoc employee={currentEmployee} settings={settings} />
                    </AutoFitScale>
                  )}

                  {/* 5. Employee Information Form */}
                  {docType === 'form' && (
                    <AutoFitScale docWidth={794}>
                      <InfoForm employee={currentEmployee} settings={settings} />
                    </AutoFitScale>
                  )}

                  {/* 6. Family Cert */}
                  {docType === 'family-cert' && (
                    <AutoFitScale docWidth={794}>
                      <FamilyAllowanceCert employee={currentEmployee} settings={settings} />
                    </AutoFitScale>
                  )}

                  {/* 7. Request for Missing Documents */}
                  {docType === 'request-docs' && (
                    <AutoFitScale docWidth={794}>
                      <DocsRequest employee={currentEmployee} settings={settings} />
                    </AutoFitScale>
                  )}

                  {/* 8. Salary Disclosure Form */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
