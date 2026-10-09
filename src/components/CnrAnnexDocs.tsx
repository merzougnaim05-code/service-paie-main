import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Employee, Settings } from '../types';
import { JOBS } from '../data/salaryGrids';
import {
  Printer,
  Download,
  Eye,
  EyeOff,
  Sparkles,
  Eraser,
  FileText,
  Info
} from 'lucide-react';

export type AnnexDocType = 'munatec' | 'af-stop' | 'periodes' | 'attestation';

interface CnrAnnexDocsProps {
  employees: Employee[];
  settings: Settings;
  selectedEmpId?: string;
  initialDocType?: string;
}

interface AnnexForm {
  secteur: string;
  institution: string;
  employeeName: string;
  employeeFather: string;
  employeeMother: string;
  jobBefore: string;
  workPlaceBefore: string;
  periodFrom: string;
  periodTo: string;
  dateInBatna: string;
  // AF stop
  employerName: string;
  cnasEmployerNum: string;
  birthDate: string;
  address: string;
  afStopFrom: string;
  madePlace: string;
  madeDate: string;
  // Attestation de travail
  civilite: 'Mr' | 'Mme' | 'Melle';
  birthPlace: string;
  wilaya: string;
  hireFrom: string;
  hireTo: string;
  allocFamEmployer: string;
  allocFamAssure: string;
  allocSocEmployer: string;
  allocSocAssure: string;
  assurNum1: string;
  assurNum2: string;
  profession: string;
  attestFrom: string;
  attestTo: string;
  wilayaAgence: string;
  merouanaPlace: string;
  merouanaDate: string;
  employerSignDate: string;
}

const BLANK_FORM: AnnexForm = {
  secteur: '',
  institution: '',
  employeeName: '',
  employeeFather: '',
  employeeMother: '',
  jobBefore: '',
  workPlaceBefore: '',
  periodFrom: '',
  periodTo: '',
  dateInBatna: '',
  employerName: '',
  cnasEmployerNum: '',
  birthDate: '',
  address: '',
  afStopFrom: '',
  madePlace: '',
  madeDate: '',
  civilite: 'Mr',
  birthPlace: '',
  wilaya: '',
  hireFrom: '',
  hireTo: '',
  allocFamEmployer: '',
  allocFamAssure: '',
  allocSocEmployer: '',
  allocSocAssure: '',
  assurNum1: '',
  assurNum2: '',
  profession: '',
  attestFrom: '',
  attestTo: '',
  wilayaAgence: '',
  merouanaPlace: 'مروانة',
  merouanaDate: '',
  employerSignDate: ''
};

function buildAutoForm(emp: Employee | undefined, settings: Settings): AnnexForm {
  const job = emp && emp.jobIdx >= 0 ? JOBS[emp.jobIdx] : undefined;
  const today = new Date().toLocaleDateString('ar-DZ');
  return {
    secteur: 'التربية الوطنية',
    institution: settings.institution || '',
    employeeName: emp?.name || '',
    employeeFather: '',
    employeeMother: '',
    jobBefore: job?.name || '',
    workPlaceBefore: settings.institution || '',
    periodFrom: '',
    periodTo: '',
    dateInBatna: today,
    employerName: settings.institution || '',
    cnasEmployerNum: settings.cnasNum || '',
    birthDate: emp?.birthDate || '',
    address: emp?.address || '',
    afStopFrom: '',
    madePlace: settings.wilaya || 'باتنة',
    madeDate: today,
    civilite: 'Mr',
    birthPlace: emp?.birthPlace || '',
    wilaya: settings.wilaya || 'باتنة',
    hireFrom: emp?.hireDate || '',
    hireTo: emp?.lastWorkDate || '',
    allocFamEmployer: settings.cnasNum || '',
    allocFamAssure: emp?.ssn || '',
    allocSocEmployer: '',
    allocSocAssure: emp?.ssn || '',
    assurNum1: emp?.ssn || '',
    assurNum2: '',
    profession: job?.name || '',
    attestFrom: emp?.hireDate || '',
    attestTo: emp?.lastWorkDate || '',
    wilayaAgence: settings.wilaya || 'باتنة',
    merouanaPlace: 'مروانة',
    merouanaDate: today,
    employerSignDate: today
  };
}

const DOC_TITLES: Record<AnnexDocType, string> = {
  munatec: 'شهادة استنفاء الاشتراكات (MUNATEC)',
  'af-stop': 'شهادة توقيف الدفع للمنح العائلية (CNR)',
  periodes: 'المدة المأجورة — PERIODES DE SALARIAT',
  attestation: 'شهادة عمل — ATTESTATION DE TRAVAIL (CNR)'
};

const SHARED_CSS = `
  .annex-page * { box-sizing: border-box; }
  .annex-page {
    background: #fff; color: #000; margin: 0 auto; position: relative;
    box-shadow: 0 0 10px rgba(0,0,0,.30);
    font-family: 'Traditional Arabic','Arabic Typesetting','Noto Naskh Arabic','Cairo',Tahoma,serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .annex-page .dots { flex: 1; border-bottom: 1.6px dotted #000; min-height: 1.2em; margin: 0 4px; text-align: center; font-weight: 700; padding: 0 6px; }
  .annex-page .dots[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }
  .annex-page .ln { display: flex; align-items: flex-end; gap: 4px; }
  @media print {
    .annex-portrait { box-shadow: none !important; margin: 0 !important; }
    .annex-landscape { box-shadow: none !important; margin: 0 !important; }
  }
`;

/* ================= Doc 1 : MUNATEC ================= */
const MunatecDoc: React.FC<{ form: AnnexForm }> = ({ form }) => (
  <div className="annex-page annex-portrait" style={{ width: '210mm', minHeight: '297mm', padding: '12mm 14mm', direction: 'rtl' }}>
    <style>{`${SHARED_CSS} @page { size: 210mm 297mm; margin: 0; }`}</style>
    <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '17pt', lineHeight: 2 }}>
      الجمهورية الجزائرية الديمقراطية الشعبية
    </div>
    <div className="ln" style={{ marginTop: '6mm', fontSize: '13pt' }}>
      <span className="dots" contentEditable suppressContentEditableWarning>{form.secteur}</span>
      <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>: القطاع</span>
    </div>
    <div className="ln" style={{ marginTop: '4mm', fontSize: '13pt' }}>
      <span className="dots" contentEditable suppressContentEditableWarning>{form.institution}</span>
      <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>: المؤسسة</span>
    </div>
    <div style={{ borderTop: '4px double #000', margin: '8mm 0 0' }} />
    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '22pt', marginTop: '28mm' }}>
      شهادة استنفاء الاشتراكات
    </div>
    <div style={{ marginTop: '22mm', fontSize: '14pt', lineHeight: 2.4, textAlign: 'right' }}>
      <div>نحن السيد المسير المالي للمؤسسة.</div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.employeeName}</span>
        <span style={{ whiteSpace: 'nowrap' }}>نشهد بأن السيد (ة) :</span>
      </div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.jobBefore}</span>
        <span style={{ whiteSpace: 'nowrap' }}>الوظيفة قبل الإحالة على التقاعد:</span>
      </div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.workPlaceBefore}</span>
        <span style={{ whiteSpace: 'nowrap' }}>مكان العمل قبل الإحالة على التقاعد :</span>
      </div>
      <div>سدد (ت) اشتراكاته (ها) للتعاضدية الوطنية لعمال التربية و الثقافة</div>
      <div className="ln" style={{ flexWrap: 'wrap' }}>
        <span>بانتظام و دون انقطاع .</span>
        <span className="dots" style={{ minWidth: '52mm' }} contentEditable suppressContentEditableWarning>{form.periodTo}</span>
        <span style={{ whiteSpace: 'nowrap' }}>: إلى</span>
        <span className="dots" style={{ minWidth: '52mm' }} contentEditable suppressContentEditableWarning>{form.periodFrom}</span>
        <span style={{ whiteSpace: 'nowrap' }}>من :</span>
      </div>
    </div>
    <div className="ln" style={{ marginTop: '26mm', fontSize: '13pt', maxWidth: '90mm' }}>
      <span className="dots" contentEditable suppressContentEditableWarning>{form.dateInBatna}</span>
      <span style={{ whiteSpace: 'nowrap' }}>باتنة في :</span>
    </div>
    <div style={{ marginTop: '18mm', display: 'flex', justifyContent: 'flex-end', fontSize: '12pt', fontWeight: 700 }}>
      <div style={{ textAlign: 'center' }}>
        <div>ختم وإمضاء المسير المالي</div>
        <div style={{ height: '22mm' }} />
      </div>
    </div>
  </div>
);

/* ================= Doc 2 : AF STOP ================= */
const AfStopDoc: React.FC<{ form: AnnexForm }> = ({ form }) => (
  <div className="annex-page annex-portrait" style={{ width: '210mm', minHeight: '297mm', padding: '10mm 14mm', direction: 'rtl' }}>
    <style>{`${SHARED_CSS} @page { size: 210mm 297mm; margin: 0; }`}</style>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6mm' }}>
      <div style={{ width: '26mm', height: '26mm', border: '2px solid #000', clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15pt', fontFamily: 'Arial' }}>
        CNR
      </div>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: '21pt' }}>الصندوق الوطني للتقاعد</div>
        <div style={{ fontWeight: 900, fontSize: '13pt', fontFamily: 'Arial' }}>CAISSE NATIONALE DES RETRAITES</div>
        <div style={{ fontSize: '12pt', marginTop: '1mm' }}>
          <span style={{ fontFamily: 'Arial' }}>AGENCE LOCALE DE BATNA</span>
          <span style={{ marginRight: '6mm', fontWeight: 700 }}>الوكالة المحلية ـ باتنة</span>
        </div>
      </div>
    </div>
    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '17pt', marginTop: '10mm' }}>
      * <span style={{ textDecoration: 'underline' }}>شهادة توقيف الدفع للمنح العائلية</span> *
    </div>
    <div style={{ marginTop: '10mm', fontSize: '13.5pt', lineHeight: 2.3, textAlign: 'right' }}>
      <div>تطبيقا للمنشور الوزاري المشترك الصادر في : 1988/03/20 المعدل و المتمم</div>
      <div>و المتعلق بالتكفل بالمنح العائلية المستحقة للأعوان التابعين للإدارة العمومية</div>
      <div className="ln" style={{ marginTop: '6mm' }}>
        <span className="dots" contentEditable suppressContentEditableWarning>{form.employerName}</span>
        <span style={{ whiteSpace: 'nowrap' }}>إن صاحب العمل الموقع أدناه :</span>
      </div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.cnasEmployerNum}</span>
        <span style={{ whiteSpace: 'nowrap' }}>رقم الانتماء للضمان الاجتماعي :</span>
      </div>
      <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '20pt', textDecoration: 'underline', margin: '6mm 0' }}>
        يصرح بأن
      </div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.employeeName}</span>
        <span style={{ whiteSpace: 'nowrap' }}>السيد (ة) :</span>
      </div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.birthDate}</span>
        <span style={{ whiteSpace: 'nowrap' }}>المزداد (ة) بتاريخ :</span>
      </div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.address}</span>
        <span style={{ whiteSpace: 'nowrap' }}>الساكن (ة) ب :</span>
      </div>
      <div className="ln">
        <span className="dots" contentEditable suppressContentEditableWarning>{form.afStopFrom}</span>
        <span style={{ whiteSpace: 'nowrap' }}>لا يـ(ت)ـستفيد من أية منحة عائلية ابتداء من :</span>
      </div>
      <div style={{ marginTop: '4mm' }}>سلمت هذه الشهادة للمعني(ة) من أجل إثبات ما هو حق له(ا) .</div>
      <div className="ln" style={{ marginTop: '8mm', maxWidth: '120mm' }}>
        <span className="dots" contentEditable suppressContentEditableWarning>{form.madeDate}</span>
        <span style={{ whiteSpace: 'nowrap' }}>في :</span>
        <span className="dots" contentEditable suppressContentEditableWarning>{form.madePlace}</span>
        <span style={{ whiteSpace: 'nowrap' }}>حرر بـ :</span>
      </div>
      <div style={{ marginTop: '10mm', fontWeight: 700, textDecoration: 'underline', fontSize: '12.5pt' }}>
        ختم و توقيع و تأشيرة صاحب العمل
      </div>
      <div style={{ height: '20mm' }} />
    </div>
  </div>
);

/* ================= Doc 3 : PERIODES ================= */
interface PeriodRow { annee: string; du: string; au: string; duree: string; salaire: string; emploi: string; designation: string; }
const EMPTY_ROW: PeriodRow = { annee: '', du: '', au: '', duree: '', salaire: '', emploi: '', designation: '' };

const PeriodesDoc: React.FC<{
  rows: PeriodRow[];
  form: AnnexForm;
  onCell: (r: number, k: keyof PeriodRow, v: string) => void;
}> = ({ rows, form, onCell }) => (
  <div className="annex-page annex-landscape" style={{ width: '297mm', minHeight: '210mm', padding: '6mm 8mm', direction: 'rtl' }}>
    <style>{`${SHARED_CSS} @page { size: 297mm 210mm; margin: 0; }
      .per-table, .per-table th, .per-table td { border: 1px solid #000; border-collapse: collapse; }
      .per-table th { font-size: 8.5pt; padding: 1.5mm 1mm; vertical-align: top; background: #fff; }
      .per-table td { height: 7.2mm; padding: 0; }
      .per-table td input { width: 100%; height: 100%; border: none; text-align: center; font-size: 9pt; background: transparent; }
      .per-table td input:focus { background: #eef5ff; outline: 1.5px solid #0070C0; }
    `}</style>
    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '15pt' }}>المدة المأجورة</div>
    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: '14pt', fontFamily: 'Arial', marginBottom: '3mm' }}>PERIODES DE SALARIAT</div>
    <table className="per-table" style={{ width: '100%', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th style={{ width: '9%' }}>ANNEE<br />عام</th>
          <th style={{ width: '15%' }}>Périodes الفترة<br /><span style={{ display: 'flex' }}><span style={{ flex: 1, borderTop: '1px solid #000' }}>Au من</span><span style={{ flex: 1, borderTop: '1px solid #000', borderRight: '1px solid #000' }}>Du إلى</span></span></th>
          <th style={{ width: '16%' }}>Durée du travail وقت العمل<br />Jours-heures-vacations<br />اليوم ـ الساعة ـ الأجرة</th>
          <th style={{ width: '24%' }}>Salaire soumis a retenue sécurité sociale par année civile<br />الأجرة الخاضعة لاشتراكات الضمان الاجتماعي خلال السنة المدنية</th>
          <th style={{ width: '16%' }}>Désignation de l&apos;emploi<br />نوعية الاستخدام</th>
          <th style={{ width: '20%' }}>Désignation de la d&apos;allocation familiales des congés payes ou d&apos;assurance sociale d&apos;affiliation<br />تحديد الصندوق المنتمي إليه</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td><input value={r.annee} onChange={e => onCell(i, 'annee', e.target.value)} /></td>
            <td style={{ display: 'flex', height: '7.2mm' }}>
              <input style={{ flex: 1, borderLeft: '1px solid #000' }} value={r.au} onChange={e => onCell(i, 'au', e.target.value)} />
              <input style={{ flex: 1 }} value={r.du} onChange={e => onCell(i, 'du', e.target.value)} />
            </td>
            <td><input value={r.duree} onChange={e => onCell(i, 'duree', e.target.value)} /></td>
            <td><input value={r.salaire} onChange={e => onCell(i, 'salaire', e.target.value)} /></td>
            <td><input value={r.emploi} onChange={e => onCell(i, 'emploi', e.target.value)} /></td>
            <td><input value={r.designation} onChange={e => onCell(i, 'designation', e.target.value)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4mm', fontSize: '9pt', gap: '4mm' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>Visa de l&apos;APC</div>
        <div>(En cas d&apos;activité dans le secteur privé) أشهد بأن المعلومات السابقة مطابقة للواقع و أؤكد صحتها</div>
        <div>تأشيرة البلدية</div>
      </div>
      <div style={{ flex: 1.4, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>Bon pour accord sur les renseignements Ci-dessus</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2mm' }}>
          <span>A Merouana Le <span className="dots" style={{ display: 'inline-block', minWidth: '30mm' }} contentEditable suppressContentEditableWarning>{form.merouanaDate}</span></span>
          <span>le <span className="dots" style={{ display: 'inline-block', minWidth: '30mm' }} contentEditable suppressContentEditableWarning>{form.employerSignDate}</span></span>
        </div>
        <div>حرر بمروانة في <span className="dots" style={{ display: 'inline-block', minWidth: '30mm' }} contentEditable suppressContentEditableWarning>{form.merouanaPlace}</span> ( في حالة كون العمل لدى الخواص )</div>
        <div style={{ fontWeight: 700, marginTop: '2mm' }}>(signature du salarié)<br />توقيع الأجير</div>
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 700 }}>signature de l&apos;employeur</div>
        <div style={{ fontWeight: 700, marginTop: '6mm' }}>( certifié exacte )<br />مطابق للحقيقة</div>
      </div>
    </div>
  </div>
);

/* ================= Doc 4 : ATTESTATION ================= */
const AttestationDoc: React.FC<{ form: AnnexForm }> = ({ form }) => {
  const box: React.CSSProperties = { border: '1.5px solid #000', padding: '3mm 4mm', marginTop: '3mm' };
  const cb = (active: boolean) => (
    <span style={{ display: 'inline-block', width: '4mm', height: '4mm', border: '1.2px solid #000', textAlign: 'center', lineHeight: '4mm', fontWeight: 900 }}>{active ? '✕' : ''}</span>
  );
  return (
    <div className="annex-page annex-portrait" style={{ width: '210mm', minHeight: '297mm', padding: '8mm 10mm', direction: 'rtl', fontSize: '10.5pt' }}>
      <style>{`${SHARED_CSS} @page { size: 210mm 297mm; margin: 0; }`}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4mm' }}>
        <div style={{ width: '34mm', textAlign: 'center' }}>
          <div style={{ width: '20mm', height: '20mm', margin: '0 auto', border: '2px solid #000', clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontFamily: 'Arial' }}>CNR</div>
          <div style={{ fontWeight: 700, fontSize: '9pt' }}>الصندوق الوطني للتقاعد</div>
          <div style={{ fontSize: '7.5pt', fontFamily: 'Arial' }}>Caisse Nationale des Retraites</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 900, fontSize: '22pt' }}>شهادة عمل</div>
          <div style={{ fontWeight: 900, fontSize: '15pt', fontFamily: 'Arial' }}>ATTESTATION DE TRAVAIL</div>
          <div style={{ fontSize: '8.5pt' }}>(تملأ من طرف المستخدم مبينا فترات الأجرة خلال العمل في المؤسسة)</div>
          <div style={{ fontSize: '8pt', fontFamily: 'Arial' }}>(A établir par l&apos;employeur pour certifier la durée de salariat accomplie dans l&apos;entreprise)</div>
        </div>
        <div style={{ width: '34mm', textAlign: 'left', fontWeight: 700 }}>
          <div>وكالة ولاية :</div>
          <div className="dots" contentEditable suppressContentEditableWarning>{form.wilayaAgence}</div>
        </div>
      </div>

      <div style={{ ...box, direction: 'ltr', textAlign: 'left', fontFamily: 'Arial, Tahoma' }}>
        <div>L&apos;employeur soussigné : <span className="dots" style={{ display: 'inline-block', minWidth: '60mm' }} contentEditable suppressContentEditableWarning>{form.employerName}</span> Déclare que Mr {cb(form.civilite === 'Mr')} Mme {cb(form.civilite === 'Mme')} Melle {cb(form.civilite === 'Melle')}</div>
        <div style={{ fontSize: '8.5pt' }}>(Cachet, raison sociale ou nom et adresse)</div>
        <div className="dots" contentEditable suppressContentEditableWarning>{form.institution}</div>
        <div style={{ marginTop: '2mm' }}>Adresse : <span className="dots" style={{ display: 'inline-block', minWidth: '80mm' }} contentEditable suppressContentEditableWarning>{form.address}</span></div>
        <div style={{ marginTop: '2mm' }}>Né(e) le : <span className="dots" style={{ display: 'inline-block', minWidth: '34mm' }} contentEditable suppressContentEditableWarning>{form.birthDate}</span> à <span className="dots" style={{ display: 'inline-block', minWidth: '40mm' }} contentEditable suppressContentEditableWarning>{form.birthPlace}</span> wilaya <span className="dots" style={{ display: 'inline-block', minWidth: '34mm' }} contentEditable suppressContentEditableWarning>{form.wilaya}</span></div>
        <div style={{ marginTop: '2mm' }}>A fait partie du personnel de l&apos;entreprise du : <span className="dots" style={{ display: 'inline-block', minWidth: '34mm' }} contentEditable suppressContentEditableWarning>{form.hireFrom}</span> au <span className="dots" style={{ display: 'inline-block', minWidth: '34mm' }} contentEditable suppressContentEditableWarning>{form.hireTo}</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '3mm', fontSize: '9.5pt' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '1.5mm' }}>Numéro</th>
              <th style={{ border: '1px solid #000', padding: '1.5mm' }}>Employeur</th>
              <th style={{ border: '1px solid #000', padding: '1.5mm' }}>Assuré</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '1.5mm' }}>Allocations Familiales</td>
              <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center' }} contentEditable suppressContentEditableWarning>{form.allocFamEmployer}</td>
              <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center' }} contentEditable suppressContentEditableWarning>{form.allocFamAssure}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '1.5mm' }}>Allocations Sociales</td>
              <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center' }} contentEditable suppressContentEditableWarning>{form.allocSocEmployer}</td>
              <td style={{ border: '1px solid #000', padding: '1.5mm', textAlign: 'center' }} contentEditable suppressContentEditableWarning>{form.allocSocAssure}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ ...box, textAlign: 'right', lineHeight: 2 }}>
        <div className="ln"><span className="dots" contentEditable suppressContentEditableWarning>{form.employeeMother} و {form.employeeFather}</span><span style={{ whiteSpace: 'nowrap' }}>إبن(ة) : ......{/* keep exact like scan */}</span><span className="dots" contentEditable suppressContentEditableWarning>{form.employeeName}</span><span style={{ whiteSpace: 'nowrap' }}>يصرح بأن السيد(ة) :</span></div>
        <div className="ln"><span style={{ whiteSpace: 'nowrap' }}>ولاية :</span><span className="dots" contentEditable suppressContentEditableWarning>{form.wilaya}</span><span style={{ whiteSpace: 'nowrap' }}>في :</span><span className="dots" contentEditable suppressContentEditableWarning>{form.birthPlace}</span><span style={{ whiteSpace: 'nowrap' }}>المولود(ة) بتاريخ :</span><span className="dots" contentEditable suppressContentEditableWarning>{form.birthDate}</span></div>
        <div className="ln"><span style={{ whiteSpace: 'nowrap' }}>المهنة :</span><span className="dots" contentEditable suppressContentEditableWarning>{form.profession}</span><span className="dots" contentEditable suppressContentEditableWarning>{form.assurNum2} / {form.assurNum1}</span><span style={{ whiteSpace: 'nowrap' }}>المؤمن(ة) الاجتماعي(ة) تحت الرقم :</span></div>
        <div className="ln"><span style={{ whiteSpace: 'nowrap' }}>العنوان :</span><span className="dots" contentEditable suppressContentEditableWarning>{form.address}</span></div>
        <div className="ln"><span style={{ whiteSpace: 'nowrap' }}>إلى :</span><span className="dots" contentEditable suppressContentEditableWarning>{form.attestTo}</span><span style={{ whiteSpace: 'nowrap' }}>يعد من مستخدمي المؤسسة ابتداء من :</span><span className="dots" contentEditable suppressContentEditableWarning>{form.attestFrom}</span></div>
      </div>

      <div style={{ ...box, textAlign: 'right', fontSize: '9pt', lineHeight: 1.9 }}>
        <div style={{ textAlign: 'center', fontWeight: 900 }}>—— نصائح مهمة ——</div>
        <div>تنص المادتان 82 و 83 من قانون المنازعات رقم 08-08 الصادر في 23 فبراير 2008 على أنه: يعاقب بالحبس من ستة ( 6 ) أشهر إلى سنتين ( 2 ) وبغرامة مالية من ثلاثين ألف دينار ( 30.000 دج ) إلى مائة ألف دينار ( 100.000 دج ) ، كل من أدلى بتصريحات كاذبة ، عرض خدمات أو قبلها أو قدمها بغرض حصوله أو حصول الغير على أداءات غير مستحقة.</div>
        <div style={{ textAlign: 'center', fontWeight: 900, fontFamily: 'Arial', marginTop: '2mm' }}>—— RECOMMANDATIONS IMPORTANTES ——</div>
        <div style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'Arial', fontSize: '8.5pt' }}>Est puni d&apos;un emprisonnement de six (06) mois à deux (02) ans et d&apos;une amende de trente mille dinars (30.000 DA) à cent mille dinars (100.000 DA), toute personne ayant fait de fausses déclarations, offert, accepté ou prêté des services pour obtenir, pour lui-même ou faire obtenir indûment des prestations à des tiers &quot;. (Art.82 et 83 Loi n°08-08 du 23 février 2008)</div>
        <div style={{ fontSize: '7.5pt', marginTop: '2mm' }}>mp. CNAS/10/2014 - RET.03.Mod</div>
        <div style={{ fontSize: '8.5pt' }}>أنتم غير ملزمين بجمع عدة سنوات في السطر الواحد، و هذا في الجدول الخلفي المتعلق بالمدة المأجورة، بل يوضع في كل سطر سنة مدنية، و لا ضرر في وضع سنة واحدة في السطرين، إذا ثبت أن المستخدم قد عمل خلال السنة المدنية الواحدة فترات عمل منقطعة.</div>
        <div style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'Arial', fontSize: '8pt' }}>Vous ne devez jamais bloquer sur la même ligne de ce tableau des renseignements concernant plusieurs années civiles (1966 et 1967 par exemple), vous devez remplir une ligne ou moins pour chaque année civile. Vous pourrez être amené à remplir deux lignes pour une même année s&apos;il se produit en cours d&apos;année deux périodes de travail séparées par une interruption.</div>
      </div>
    </div>
  );
};

/* ================= Container ================= */
export const CnrAnnexDocs: React.FC<CnrAnnexDocsProps> = ({
  employees,
  settings,
  selectedEmpId,
  initialDocType
}) => {
  const [empId, setEmpId] = useState<string>(selectedEmpId || employees[0]?.id || '');
  const [docType, setDocType] = useState<AnnexDocType>(
    (initialDocType as AnnexDocType) || 'munatec'
  );
  const [form, setForm] = useState<AnnexForm>(() =>
    buildAutoForm(
      employees.find(e => e.id === (selectedEmpId || employees[0]?.id)),
      settings
    )
  );
  const [rows, setRows] = useState<PeriodRow[]>(() =>
    Array.from({ length: 18 }, () => ({ ...EMPTY_ROW }))
  );
  const [showPreview, setShowPreview] = useState(true);
  const [blankPrinting, setBlankPrinting] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDocType === 'munatec' || initialDocType === 'af-stop' || initialDocType === 'periodes' || initialDocType === 'attestation') {
      setDocType(initialDocType as AnnexDocType);
    }
  }, [initialDocType]);

  useEffect(() => {
    if (selectedEmpId) setEmpId(selectedEmpId);
  }, [selectedEmpId]);

  const currentEmployee = useMemo(
    () => employees.find(e => e.id === empId) || employees[0],
    [employees, empId]
  );

  const set = (k: keyof AnnexForm, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const autoFill = () => {
    setForm(buildAutoForm(currentEmployee, settings));
  };

  const clearForm = () => {
    setForm({ ...BLANK_FORM, merouanaPlace: 'مروانة' });
    setRows(Array.from({ length: 18 }, () => ({ ...EMPTY_ROW })));
  };

  const onCell = (r: number, k: keyof PeriodRow, v: string) => {
    setRows(prev => prev.map((row, i) => (i === r ? { ...row, [k]: v } : row)));
  };

  const handlePrint = () => window.print();

  const handlePrintBlank = () => {
    setBlankPrinting(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setBlankPrinting(false), 800);
    }, 250);
  };

  const handleDownload = () => {
    if (!docRef.current) return;
    const landscape = docType === 'periodes';
    const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${DOC_TITLES[docType]} - ${currentEmployee?.name || ''}</title><style>@page { size: ${landscape ? '297mm 210mm' : '210mm 297mm'}; margin: 0; } body { margin:0; padding:0; background:#fff; }</style></head><body>${docRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${DOC_TITLES[docType]}_${currentEmployee?.name || 'فارغ'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const viewForm: AnnexForm = blankPrinting ? { ...BLANK_FORM, merouanaPlace: '' } : form;
  const viewRows: PeriodRow[] = blankPrinting
    ? Array.from({ length: 18 }, () => ({ ...EMPTY_ROW }))
    : rows;

  const inputCls =
    'w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1a3d2b] focus:outline-none focus:border-[#176b4a]';
  const labelCls = 'block text-xs font-bold text-[#443e33] mb-1';

  if (!currentEmployee && employees.length === 0) {
    return (
      <div className="py-12 text-center text-[#736a58]">
        يرجى تسجيل موظف أولاً لاستعمال هذه الوثائق.
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      {/* Control bar */}
      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e5ddcb]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a3d2b] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#176b4a]" />
              <span>وثائق التقاعد الملحقة (CNR + MUNATEC) — نسخ طبق الأصل</span>
            </h2>
            <p className="text-xs text-[#706856] mt-1">
              ملء آلي من سجل الموظفين أو يدوي، مع معاينة حية وطباعة مملوءة أو فارغة.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowPreview(v => !v)} className="bg-white hover:bg-[#f5f2e8] text-[#176b4a] border border-[#176b4a] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer">
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPreview ? 'إخفاء المعاينة' : 'معاينة الوثيقة'}</span>
            </button>
            <button onClick={handlePrint} className="bg-[#176b4a] hover:bg-[#12553b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer">
              <Printer className="w-4 h-4" />
              <span>طباعة (مملوءة)</span>
            </button>
            <button onClick={handlePrintBlank} className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer">
              <Printer className="w-4 h-4" />
              <span>طباعة نسخة فارغة</span>
            </button>
            <button onClick={handleDownload} className="bg-white hover:bg-[#f5f2e8] text-[#176b4a] border border-[#176b4a] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer">
              <Download className="w-4 h-4" />
              <span>تحميل HTML</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className={labelCls}>الموظف (للملء الآلي)</label>
            <select value={empId} onChange={e => setEmpId(e.target.value)} className={inputCls}>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} — ({JOBS[e.jobIdx]?.name || 'موظف'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>الوثيقة</label>
            <select value={docType} onChange={e => setDocType(e.target.value as AnnexDocType)} className={`${inputCls} border-[#176b4a] text-[#176b4a]`}>
              <option value="munatec">1 — شهادة استنفاء الاشتراكات (MUNATEC)</option>
              <option value="af-stop">2 — شهادة توقيف الدفع للمنح العائلية (CNR)</option>
              <option value="periodes">3 — المدة المأجورة (جدول السنوات)</option>
              <option value="attestation">4 — شهادة عمل ATTESTATION DE TRAVAIL</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={autoFill} className="flex-1 bg-[#2c4e80] hover:bg-[#203a60] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
              <Sparkles className="w-4 h-4" /><span>ملء آلي</span>
            </button>
            <button onClick={clearForm} className="flex-1 bg-white hover:bg-[#f5f2e8] text-[#8c3b2d] border border-[#8c3b2d] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
              <Eraser className="w-4 h-4" /><span>إفراغ</span>
            </button>
          </div>
          <div className="bg-[#eef5ff] border border-[#b8d4fe] rounded-xl p-2.5 text-xs text-[#004e9a] flex items-center gap-2">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>كل الحقول المنقطة في المعاينة قابلة للنقر والتعديل المباشر قبل الطباعة.</span>
          </div>
        </div>

        {/* Manual form */}
        <div className="mt-4 pt-4 border-t border-[#e5ddcb]">
          {docType === 'munatec' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className={labelCls}>القطاع</label><input value={form.secteur} onChange={e => set('secteur', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>المؤسسة</label><input value={form.institution} onChange={e => set('institution', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>السيد (ة)</label><input value={form.employeeName} onChange={e => set('employeeName', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>الوظيفة قبل الإحالة على التقاعد</label><input value={form.jobBefore} onChange={e => set('jobBefore', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>مكان العمل قبل الإحالة</label><input value={form.workPlaceBefore} onChange={e => set('workPlaceBefore', e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>من</label><input value={form.periodFrom} onChange={e => set('periodFrom', e.target.value)} className={inputCls} placeholder="مثال: 2008/09/01" /></div>
                <div><label className={labelCls}>إلى</label><input value={form.periodTo} onChange={e => set('periodTo', e.target.value)} className={inputCls} placeholder="مثال: 2026/08/31" /></div>
              </div>
              <div><label className={labelCls}>باتنة في</label><input value={form.dateInBatna} onChange={e => set('dateInBatna', e.target.value)} className={inputCls} /></div>
            </div>
          )}
          {docType === 'af-stop' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className={labelCls}>صاحب العمل الموقع أدناه</label><input value={form.employerName} onChange={e => set('employerName', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>رقم الانتماء للضمان الاجتماعي</label><input value={form.cnasEmployerNum} onChange={e => set('cnasEmployerNum', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>السيد (ة)</label><input value={form.employeeName} onChange={e => set('employeeName', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>المزداد بتاريخ</label><input value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>الساكن بـ</label><input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>لا يستفيد من منحة عائلية ابتداء من</label><input value={form.afStopFrom} onChange={e => set('afStopFrom', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>حرر بـ</label><input value={form.madePlace} onChange={e => set('madePlace', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>في (تاريخ)</label><input value={form.madeDate} onChange={e => set('madeDate', e.target.value)} className={inputCls} /></div>
            </div>
          )}
          {docType === 'periodes' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className={labelCls}>حرر بمروانة في</label><input value={form.merouanaPlace} onChange={e => set('merouanaPlace', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>بتاريخ (A Merouana Le)</label><input value={form.merouanaDate} onChange={e => set('merouanaDate', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>توقيع المستخدم بتاريخ (le)</label><input value={form.employerSignDate} onChange={e => set('employerSignDate', e.target.value)} className={inputCls} /></div>
              <div className="sm:col-span-3 text-xs text-[#706856]">جدول السنوات يُملأ مباشرة داخل خلايا الجدول في المعاينة (18 سطراً قابلة للزيادة بالنقر والتعديل).</div>
            </div>
          )}
          {docType === 'attestation' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><label className={labelCls}>وكالة ولاية</label><input value={form.wilayaAgence} onChange={e => set('wilayaAgence', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>المستخدم الموقع أدناه</label><input value={form.employerName} onChange={e => set('employerName', e.target.value)} className={inputCls} /></div>
              <div>
                <label className={labelCls}>الصفة</label>
                <select value={form.civilite} onChange={e => setForm(p => ({ ...p, civilite: e.target.value as AnnexForm['civilite'] }))} className={inputCls}>
                  <option value="Mr">Mr — السيد</option>
                  <option value="Mme">Mme — السيدة</option>
                  <option value="Melle">Melle — الآنسة</option>
                </select>
              </div>
              <div><label className={labelCls}>السيد (ة) — عربي</label><input value={form.employeeName} onChange={e => set('employeeName', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>ابن (ة) — الأب</label><input value={form.employeeFather} onChange={e => set('employeeFather', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>و — الأم</label><input value={form.employeeMother} onChange={e => set('employeeMother', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>تاريخ الميلاد</label><input value={form.birthDate} onChange={e => set('birthDate', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>مكان الميلاد</label><input value={form.birthPlace} onChange={e => set('birthPlace', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>ولاية</label><input value={form.wilaya} onChange={e => set('wilaya', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>العنوان</label><input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>المهنة</label><input value={form.profession} onChange={e => set('profession', e.target.value)} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>من (فرنسي)</label><input value={form.hireFrom} onChange={e => set('hireFrom', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>إلى (فرنسي)</label><input value={form.hireTo} onChange={e => set('hireTo', e.target.value)} className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={labelCls}>ابتداء من (عربي)</label><input value={form.attestFrom} onChange={e => set('attestFrom', e.target.value)} className={inputCls} /></div>
                <div><label className={labelCls}>إلى (عربي)</label><input value={form.attestTo} onChange={e => set('attestTo', e.target.value)} className={inputCls} /></div>
              </div>
              <div><label className={labelCls}>منح عائلية — مستخدم</label><input value={form.allocFamEmployer} onChange={e => set('allocFamEmployer', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>منح عائلية — مؤمن</label><input value={form.allocFamAssure} onChange={e => set('allocFamAssure', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>منح اجتماعية — مستخدم</label><input value={form.allocSocEmployer} onChange={e => set('allocSocEmployer', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>منح اجتماعية — مؤمن</label><input value={form.allocSocAssure} onChange={e => set('allocSocAssure', e.target.value)} className={inputCls} /></div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="flex justify-center overflow-x-auto pb-12">
          <div ref={docRef} className="w-full flex flex-col items-center">
            {blankPrinting && (
              <div className="w-full text-center py-2 text-xs font-bold text-red-700 print:hidden">— وضع الطباعة الفارغة: كل الحقول فارغة —</div>
            )}
            {docType === 'munatec' && <MunatecDoc form={viewForm} />}
            {docType === 'af-stop' && <AfStopDoc form={viewForm} />}
            {docType === 'periodes' && <PeriodesDoc rows={viewRows} form={viewForm} onCell={onCell} />}
            {docType === 'attestation' && <AttestationDoc form={viewForm} />}
          </div>
        </div>
      )}
    </div>
  );
};
