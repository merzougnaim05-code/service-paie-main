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
  // Reference month for the ATS back face (12 months regenerate ending at this month)
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
    // ?? ????? A4 ?????? ???? .afs-inner � ??????? ?????? ???????
    const inners = (Array.from(root.querySelectorAll('.afs-inner')) as HTMLElement[])
      .filter(el => el.offsetWidth > 0);
    if (inners.length === 0) return;

    setExportingPdf(true);
    try {
      await exportElementsToPdf(inners, `?????_${docType}_${currentEmployee?.name || '????'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('???? ????? ??? PDF? ???? ???????? ??? ????.');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!currentEmployee) {
    return (
      <div className="py-12 text-center text-[#64748b]">
        ???? ?????? ?? ????? ???? ????? ???? ??????? ????????.
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
              <span>????? ????? ?????? (ATS) ???????? ??????? CNAS</span>
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              ????? ?????? ??? ????? ?? (CNAS AS.01) ?? ????? ????? ?? ???? ??????? ??????? ??????? ????????.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>????? ???????</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={exportingPdf}
              className="bg-white hover:bg-[#f1f5f9] text-[#047857] border border-[#047857] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? '???? ???????...' : '????? (PDF)'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">?????? ??????</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} � ({JOBS[e.jobIdx]?.name || '????'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">??? ??????? ???????</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full bg-white border border-[#047857] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#047857] focus:outline-none shadow-sm"
            >
              <option value="ats-front">? ????? ????? ?????? ATS (????? ????? - AS.01)</option>
              <option value="ats-back">? ????? ????? ?????? ATS (????? ?????? - ???? 12 ?????)</option>
              <option value="ats-both">? ????? ????? ?????? ATS (??????? ???? - Recto/Verso)</option>
              <option value="drt">???? ??????? ????? (DRT � ??? ??? ??????)</option>
              <option value="form">??????? ??????? ??????</option>
              <option value="family-cert">????? ??? ????? ????? ????????</option>
              <option value="request-docs">??? ????? ?????? ???</option>
              <option value="salary-disclosure">??????? ???? ???? ???????? (???? ??????)</option>
              <option value="family-withdraw">???? ??? ????? ???????? (??? ?????)</option>
              <option value="family-insert">???? ?????? ?????? ???????? � ????? (??? ?????)</option>
              <option value="explanation-letter">????? ??????? (?????? 36 ????)</option>
              <option value="mutuelle-cert">????????? ??????? ????? ??????? ????????</option>
            </select>
          </div>

          <div className="bg-[#eef5ff] border border-[#b8d4fe] rounded-xl p-2.5 text-xs text-[#004e9a] flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0 text-[#0070C0]" />
            <span>
              ???? ?????? ???????? ????????? ??????? <strong>(????? ????? ???????? ???????)</strong> ??? ??????? ?? ???????.
            </span>
          </div>

          {(docType === 'ats-back' || docType === 'ats-both') && (
            <div>
              <label className="block text-xs font-bold text-[#1e293b] mb-1">????? ??????? (????? ??? 12 ?????)</label>
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
                � ????? ????? (Recto - ????? A4) �
              </div>
              <AutoFitScale docWidth={794}>
                <ATSFront employee={currentEmployee} settings={settings} />
              </AutoFitScale>

              <div className="w-full text-center py-2 text-xs font-bold text-[#64748b] print:hidden">
                � ????? ?????? (Verso - ???? A4) �
              </div>
              <AutoFitScale docWidth={1123}>
                <ATSBack employee={currentEmployee} settings={settings} startMonth={refMonth} startYear={refYear} />
              </AutoFitScale>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. DRT � ???? ??????? ????? (??? ??? ??? ??????) */}
          {/* ======================================================== */}
          {docType === 'drt' && (
            <AutoFitScale docWidth={529}>
              <DrtExcelDoc employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 5. Employee Information Form (??????? ???????) */}
          {/* ======================================================== */}
          {docType === 'form' && (
            <AutoFitScale docWidth={794}>
              <InfoForm employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 6. Family Cert (????? ??? ????? ????? ????????) */}
          {/* ======================================================== */}
          {docType === 'family-cert' && (
            <AutoFitScale docWidth={794}>
              <FamilyAllowanceCert employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 7. Request for Missing Documents (??? ????? ?????? ???) */}
          {/* ======================================================== */}
          {docType === 'request-docs' && (
            <AutoFitScale docWidth={794}>
              <DocsRequest employee={currentEmployee} settings={settings} />
            </AutoFitScale>
          )}

          {/* ======================================================== */}
          {/* 8. Salary Disclosure Form (??????? ???? ???? ????????) */}
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

