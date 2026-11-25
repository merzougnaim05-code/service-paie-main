import * as XLSX from 'xlsx';
import { Employee, EmploymentStatus, MaritalStatus } from '../types';
import { JOBS } from '../data/salaryGrids';
import { GRILLE } from '../data/salaryGrids';

/* ===== استيراد المعطيات من ملف برنامج الرواتب الأصلي (Excel) =====
   المصدران:
   1) ورقة «حجز المعلومات» (المصدر الرئيسي): سجل الموظفين الكامل —
      الاسم | اللقب | رقم الحساب البريدي | المهنة | تاريخ الإزدياد | مكان الإزدياد |
      العنوان | رقم الضمان الاجتماعي | تاريخ التوظيف | تاريخ آخر يوم عمل |
      تاريخ الاستئناف | عدد سنوات العمل | الرمز | رمز منحة الأوراس | الصنف الحالي |
      الصنف القديم 89 | الدرجة | الحالة العائلية | عدد الأطفال | أكبر من 10س |
      الأجر الوحيد | التعاضدية | الصفة | ... — تُقرأ الأعمدة من ترويسات الصف
      نفسه فلا تضر إزاحة الأعمدة، مع رجوع للأعمدة الثابتة عند غياب ترويسة.
   2) ورقة «سحب المنح العائلية»: مصدر تواريخ ميلاد الأطفال (10 كتل)،
      وبديل للحقول الأساسية عند غياب ورقة «حجز المعلومات».
   الدمج بين الورقتين بالاسم (بعد التطبيع).                                  */

/** تطبيع النص العربي للمطابقة */
const norm = (s: string): string =>
  (s || '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئي]/g, 'ي')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const key = (s: string): string => norm(s).replace(/\s/g, '');

/** مفتاح الدمج بالاسم: المفتاح المطبّع، وإن كان فارغاً (اسم بلا حروف عربية
    كما في الأسماء الرمزية L/N) يُستعمل الاسم الخام صغير الحروف حتى لا
    تتصادم أسماء مختلفة كلها على مفتاح فارغ واحد. */
const mergeKey = (s: string): string => key(s) || s.trim().toLowerCase();

/** رقم تسلسل إكسل أو نص dd/mm/yyyy إلى yyyy-mm-dd */
function anyToDate(v: unknown): string {
  if (v === null || v === undefined || v === '' || v === '0' || v === 0) return '';
  const n = Number(v);
  if (!isNaN(n) && n > 1000 && n < 90000) {
    const d = new Date(Math.round((n - 25569) * 86400000));
    const iso = d.toISOString().slice(0, 10);
    return isNaN(d.getTime()) ? '' : iso;
  }
  const s = String(v).trim();
  const m = s.match(/(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})/);
  if (m) {
    let a = +m[1], b = +m[2], y = +m[3];
    if (a < 32) { const d = a, mo = b; a = mo; b = d; }
    return (y < 100 ? 1900 + y : y) + '-' + String(a).padStart(2, '0') + '-' + String(b).padStart(2, '0');
  }
  return '';
}

/** مطابقة اسم المهنة المختصرة (ناظر متوسطة، مشرف التربية، عون تقني...) مع قائمة JOBS */
export function matchJobIdx(label: string): number {
  const raw = key(label);
  if (!raw || raw === '0') return -1;
  // 0) مطابقة تامة (بعد التطبيع) تفوق أي تقريب — وإلا قد يتفوق عليها
  //    التقريب بالكلمات المفتاحية (مثال: «أستاذ التعليم الثانوي» كان
  //    يُطابَق خطأً مع «أستاذ مميز في التعليم الثانوي» لأن التقريب
  //    يصل إلى 121 نقطة مقابل 100 للمطابقة التامة).
  const exact = JOBS.findIndex(j => key(j.name) === raw);
  if (exact >= 0) return exact;
  // 1) مطابقة مباشرة
  let best = -1, bestScore = 0;
  JOBS.forEach((j, i) => {
    const jk = key(j.name);
    if (!jk) return;
    let sc = 0;
    if (jk === raw) sc = 100;
    else if (jk.includes(raw) || raw.includes(jk)) {
      const overlap = Math.min(jk.length, raw.length);
      sc = 60 + (overlap >= 10 ? 15 : 0);
    } else {
      // كلمات مفتاحية مشتركة + مستوى + أولوية كلمة الأساس (ناظر/مدير/مشرف/أستاذ...)
      const labelN = norm(label);
      const toks = labelN.split(' ').filter(t => t.length > 2);
      const firstWord = key(toks[0] || '');
      const hits = toks.filter(t => jk.includes(key(t))).length;
      const levels = ['ابتدائي', 'متوسط', 'ثانوي'];
      const lv = levels.find(l => labelN.includes(l) && jk.includes(l));
      sc = hits * 12 + (lv ? 30 : 0);
      if (firstWord.length > 2 && jk.startsWith(firstWord)) sc += 55;
    }
    if (sc > bestScore) { bestScore = sc; best = i; }
  });
  return bestScore >= 40 ? best : -1;
}

/** حالة عائلية من صيغ الورقة (عازب/عازبة/متزوج...) */
function matchMarital(v: string): MaritalStatus | '' {
  if (!v || v === '0') return '';
  const k = norm(v);
  if (k.startsWith('عاز')) return 'أعزب';
  if (k.startsWith('متز')) return 'متزوج';
  if (k.startsWith('مطل')) return 'مطلق';
  if (k.startsWith('أرم') || k.startsWith('ارم')) return 'أرمل';
  return '';
}

/** نعم/لا (أو 1/0، true/false) إلى منطقي — null عند غياب قيمة واضحة */
function parseYesNo(v: unknown): boolean | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const raw = String(v).trim().toLowerCase();
  if (['yes', 'oui', 'true', '1'].includes(raw)) return true;
  if (['no', 'non', 'false', '0'].includes(raw)) return false;
  const s = norm(raw);
  if (!s || s === '0') return null;
  if (s.startsWith('نعم')) return true;
  if (s.startsWith('لا')) return false;
  return null;
}

/** الصفة من الورقة إلى حالة التوظيف — '' عند غياب قيمة واضحة.
    ملاحظة: نوع EmploymentStatus لا يعرف «متربص» فيُقرَّب إلى «متعاقد». */
function matchEmploymentStatus(v: string): EmploymentStatus | '' {
  if (!v || v === '0') return '';
  const k = norm(v);
  if (k.startsWith('مرس')) return 'مرسم';
  if (k.startsWith('متع')) return 'متعاقد';
  if (k.startsWith('مترب')) return 'متعاقد';
  return '';
}

/** الصنف: من الورقة إن وُجد في الشبكة، وإلا صنف الخاصية للوظيفة */
function resolveCategory(catVal: number, jobIdx: number): number {
  const j = jobIdx >= 0 ? JOBS[jobIdx] : null;
  if (catVal > 0) {
    const gi = GRILLE.findIndex(g => String(g.cat) === String(catVal));
    return gi >= 0 ? gi : (typeof j?.cat === 'number' ? j.cat - 1 : 0);
  }
  if (typeof j?.cat === 'number') {
    const gi = GRILLE.findIndex(g => String(g.cat) === String(j.cat));
    return gi >= 0 ? gi : j.cat - 1;
  }
  return 0;
}

export interface ImportReport {
  imported: number;
  updated: number;
  skipped: number;      // صفوف بلا اسم
  unmatchedJobs: string[]; // مهنات لم تطابق قائمة الوظائف
  drafts: Employee[];
}

/* ---------- ورقة «سحب المنح العائلية» ---------- */

interface FamRec {
  key: string; name: string; num: unknown;
  postal: string; jobLabel: string; jobIdx: number;
  hireDate: string; catVal: number; echVal: number;
  marital: MaritalStatus | ''; children: number; children10: number;
  births: string[]; realChildren: number; older10: number;
}

/** قراءة ورقة المنح العائلية: الحقول الأساسية + تواريخ ميلاد الأطفال */
function parseFamSheet(ws: XLSX.WorkSheet): { recs: FamRec[]; skipped: number; unmatched: string[] } {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cell = (r: number, c: number) => {
    const cc = ws[XLSX.utils.encode_cell({ r, c })];
    return cc ? cc.v : undefined;
  };
  // كتلتا ميلاد الأطفال: كل كتلة عنوانها L..الخ (عمود البداية كل 5 أعمدة من L=11)
  const childBlocks = [11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
  const recs: FamRec[] = [];
  const unmatched: Record<string, true> = {};
  let skipped = 0;
  const isName = (s: string) => !!s && s !== '0' && !/^[\d.,\s]+$/.test(s) && s.trim().length >= 1 && !s.includes('الاسم') && !s.includes('اللقب');

  for (let row = 3; row <= range.e.r; row++) {
    const num = cell(row, 0);
    const prenom = String(cell(row, 1) ?? '').trim();   // الاسم
    const nom = String(cell(row, 2) ?? '').trim();      // اللقب
    if (!isName(prenom) && !isName(nom)) { skipped++; continue; }

    const postalRaw = String(cell(row, 3) ?? '').trim();
    const postal = postalRaw && postalRaw !== '0' ? postalRaw : '';
    const jobLabel = String(cell(row, 4) ?? '').trim(); // المهنة
    const hireDate = anyToDate(cell(row, 5));           // تاريخ التوظيف
    const catVal = Number(cell(row, 6)) || 0;           // الصنف
    const echVal = Number(cell(row, 7)) || 0;           // الدرجة
    const marital = matchMarital(String(cell(row, 8) ?? ''));
    const children = Number(cell(row, 9)) || 0;         // عدد الأولاد
    const children10 = Number(cell(row, 10)) || 0;      // أكبر من 10 سنوات

    const jobIdx = matchJobIdx(jobLabel);
    if (jobIdx < 0 && jobLabel && jobLabel !== '0') unmatched[jobLabel] = true;

    // تواريخ ميلاد الأطفال → العدد الفعلي وأكبر من 10 سنوات (كل كتلة: تاريخ serial + سنة/شهر/يوم)
    let realChildren = 0, older10 = 0;
    const births: string[] = [];
    for (const c of childBlocks) {
      let bd = '';
      const first = Number(cell(row, c));
      if (first > 25000 && first < 80000) {
        bd = anyToDate(first);
      } else {
        const y = Number(cell(row, c + 1)), mo = Number(cell(row, c + 2)), d = Number(cell(row, c + 3));
        if (y > 1900 && d > 0 && d <= 31) bd = `${y}-${String(Math.min(mo || 1, 12)).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
      if (bd) {
        births.push(bd);
        realChildren++;
        const ageD = (Date.now() - new Date(bd + 'T00:00:00Z').getTime()) / 31557600000;
        if (ageD >= 10) older10++;
      }
    }

    const name = (isName(prenom) ? prenom : '') + (isName(prenom) && isName(nom) ? ' ' : '') + (isName(nom) ? nom : '');
    if (!name) { skipped++; continue; }

    recs.push({
      key: mergeKey(name), name, num, postal, jobLabel, jobIdx, hireDate,
      catVal, echVal, marital, children, children10, births, realChildren, older10,
    });
  }

  return { recs, skipped, unmatched: Object.keys(unmatched) };
}

/* ---------- ورقة «حجز المعلومات» (المصدر الرئيسي) ---------- */

/** أعمدة ورقة «حجز المعلومات» الثابتة (احتياط عند غياب الترويسة) — 0-based */
const INFO_FIXED: Record<string, number> = {
  first: 1, last: 2, postal: 3, job: 4, birthDate: 5, birthPlace: 6, address: 7,
  ssn: 8, hireDate: 9, lastWorkDate: 10, resumeDate: 11, years: 12, code: 13,
  auresCode: 14, category: 15, oldCat: 16, echelon: 17, marital: 18,
  children: 19, children10: 20, singleWage: 21, mutuelle: 24, status: 26,
  singleWageAmt: 44,
};
/** مفاتيح الترويسات (بعد التطبيع key) لكل حقل في ورقة «حجز المعلومات» —
    تُحسب بـ key نفسها حتى لا يختلف حرف مكتوب هنا عن التطبيع
    (مثال: «الإستئناف» ترويستها تُطبَّع إلى «الاستيناف» بالياء). */
const INFO_HEADERS: Record<string, string> = {
  first: key('الاسم'), last: key('اللقب'), postal: key('رقم الحساب البريدي'), job: key('الوظيفة'),
  birthDate: key('تاريخ الإزدياد'), birthPlace: key('مكان الإزدياد'), address: key('العنوان'),
  ssn: key('رقم الضمان الإجتماعي'), hireDate: key('تاريخ التوظيف'), lastWorkDate: key('تاريخ أخر يوم عمل'),
  resumeDate: key('تاريخ الإستئناف'), years: key('عدد سنوات العمل'), code: key('الرمز'),
  auresCode: key('رمز منحة الاوراس'), category: key('الصنف الحالي'), oldCat: key('الصنف القديم 89'),
  echelon: key('الدرجة'), marital: key('الحالة العائلية'), children: key('عدد الأطفال'),
  children10: key('اكبر من 10س'), singleWage: key('الاجر الوحيد'), mutuelle: key('التعاضدية'),
  status: key('الصفة'),
};

interface InfoRec {
  key: string; name: string; num: unknown;
  postal: string; jobLabel: string; jobIdx: number;
  ssn: string; catVal: number; echVal: number;
  category: number; echelon: number;
  employmentStatus: EmploymentStatus; hireDate: string; yearsOverride: number | null;
  marital: MaritalStatus | ''; children: number; children10: number;
  singleWage: boolean; mutuelle: boolean;
  birthPlace: string; birthDate: string; address: string;
  lastWorkDate: string; resumeDate: string;
}

/** قراءة ورقة «حجز المعلومات»: الحقول الكاملة للموظف.
    الأعمدة تُحدَّد من ترويسات الصف نفسه (فلا تضر إزاحة الأعمدة)،
    ومن لم توجد ترويسة له يُؤخذ من العمود الثابت. ترويسة «الأجر الوحيد»
    تظهر مرتين: الأولى (نعم/لا) والثانية مبلغه — تُستعمل الثانية دليلاً
    احتياطياً للأجر الوحيد عند غياب الأولى. */
function parseInfoSheet(ws: XLSX.WorkSheet): { recs: InfoRec[]; skipped: number; unmatched: string[] } {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cell = (r: number, c: number) => {
    const cc = ws[XLSX.utils.encode_cell({ r, c })];
    return cc ? cc.v : undefined;
  };
  // إيجاد صف الترويسات: الصف الذي يحوي «الإسم» و«اللقب» في أي عمودين
  // (فلا تضر إزاحة الأعمدة) — وإلا الصف 10 ثابتاً
  let headerRow = 9;
  for (let r = 0; r <= Math.min(20, range.e.r); r++) {
    let hasFirst = false, hasLast = false;
    for (let c = 0; c <= Math.min(20, range.e.c); c++) {
      const k = key(String(cell(r, c) ?? ''));
      if (k === 'الاسم') hasFirst = true;
      if (k === 'اللقب') hasLast = true;
    }
    if (hasFirst && hasLast) { headerRow = r; break; }
  }
  // خريطة الترويسات: مفتاح الترويسة → الأعمدة التي تحمله
  const headerCols: Record<string, number[]> = {};
  for (let c = 0; c <= range.e.c; c++) {
    const k = key(String(cell(headerRow, c) ?? ''));
    if (!k) continue;
    (headerCols[k] = headerCols[k] || []).push(c);
  }
  const col = (field: string): number => {
    if (field === 'singleWage') return headerCols[INFO_HEADERS.singleWage]?.[0] ?? INFO_FIXED.singleWage;
    if (field === 'singleWageAmt') return headerCols[INFO_HEADERS.singleWage]?.[1] ?? INFO_FIXED.singleWageAmt;
    return headerCols[INFO_HEADERS[field]]?.[0] ?? INFO_FIXED[field];
  };
  const isName = (s: string) => !!s && s !== '0' && !/^[\d.,\s]+$/.test(s) && s.trim().length >= 1 && !s.includes('الاسم') && !s.includes('اللقب');
  const str = (v: unknown): string => {
    const s = String(v ?? '').trim();
    return s === '0' ? '' : s;
  };
  const recs: InfoRec[] = [];
  const unmatched: Record<string, true> = {};
  let skipped = 0;

  for (let row = headerRow + 1; row <= range.e.r; row++) {
    const prenom = str(cell(row, col('first')));
    const nom = str(cell(row, col('last')));
    if (!isName(prenom) && !isName(nom)) { skipped++; continue; }

    const jobLabel = str(cell(row, col('job')));
    const jobIdx = matchJobIdx(jobLabel);
    if (jobIdx < 0 && jobLabel) unmatched[jobLabel] = true;

    const catVal = Number(cell(row, col('category'))) || 0;   // الصنف الحالي
    const echVal = Number(cell(row, col('echelon'))) || 0;    // الدرجة
    const marital = matchMarital(str(cell(row, col('marital'))));
    const sw = parseYesNo(cell(row, col('singleWage')));      // الأجر الوحيد (نعم/لا)
    const swAmt = Number(cell(row, col('singleWageAmt'))) || 0; // مبلغ الأجر الوحيد (دليل احتياطي)
    const singleWage = sw !== null ? sw : swAmt > 0;
    const mut = parseYesNo(cell(row, col('mutuelle')));       // التعاضدية
    const status = matchEmploymentStatus(str(cell(row, col('status')))); // الصفة
    const years = Number(cell(row, col('years'))) || 0;       // عدد سنوات العمل

    const name = (isName(prenom) ? prenom : '') + (isName(prenom) && isName(nom) ? ' ' : '') + (isName(nom) ? nom : '');
    if (!name) { skipped++; continue; }

    recs.push({
      key: mergeKey(name), name, num: cell(row, 0),
      postal: str(cell(row, col('postal'))), jobLabel, jobIdx,
      ssn: str(cell(row, col('ssn'))),
      catVal, echVal,
      category: resolveCategory(catVal, jobIdx),
      echelon: echVal > 0 && echVal <= 12 ? echVal : 0,
      employmentStatus: status || 'مرسم',
      hireDate: anyToDate(cell(row, col('hireDate'))),
      yearsOverride: years > 0 ? years : null,
      marital,
      children: Number(cell(row, col('children'))) || 0,
      children10: Number(cell(row, col('children10'))) || 0,
      singleWage,
      mutuelle: mut !== null ? mut : true,
      birthPlace: str(cell(row, col('birthPlace'))),
      birthDate: anyToDate(cell(row, col('birthDate'))),
      address: str(cell(row, col('address'))),
      lastWorkDate: anyToDate(cell(row, col('lastWorkDate'))),
      resumeDate: anyToDate(cell(row, col('resumeDate'))),
    });
  }

  return { recs, skipped, unmatched: Object.keys(unmatched) };
}

/* ---------- بناء المسودات ---------- */

interface DraftParams {
  id: string; name: string; jobIdx: number; ssn: string; category: number; echelon: number;
  employmentStatus: EmploymentStatus; hireDate: string; yearsOverride: number | null;
  marital: MaritalStatus; children: number; children10: number; singleWage: boolean;
  mutuelle: boolean; birthPlace: string; birthDate: string; address: string;
  postalAccount: string; lastWorkDate: string; resumeDate: string; births: string[];
}

function toDraft(p: DraftParams): Employee {
  return {
    id: p.id, name: p.name, jobIdx: p.jobIdx, ssn: p.ssn, category: p.category,
    echelon: p.echelon, employmentStatus: p.employmentStatus, hireDate: p.hireDate,
    yearsOverride: p.yearsOverride, marital: p.marital, children: p.children,
    children10: p.children10, singleWage: p.singleWage, mutuelle: p.mutuelle,
    mutuelleNum: '', performancePct: 40, incomeDifference: 0, experienceDifference: 0,
    birthPlace: p.birthPlace, birthDate: p.birthDate, address: p.address,
    postalAccount: p.postalAccount, lastWorkDate: p.lastWorkDate, resumeDate: p.resumeDate,
    allowances: [], childrenBirths: p.births, pensionHistory: [],
    teacherType: 'عادي', auresMode: 'auto', auresAmount: 0,
  };
}

/** مسودة من صف ورقة المنح العائلية وحده (المنطق القديم) */
function famToDraft(r: FamRec): Employee {
  return toDraft({
    id: 'imp_' + String(r.num ?? '') + '_' + r.key.slice(0, 8),
    name: r.name, jobIdx: r.jobIdx >= 0 ? r.jobIdx : 1, ssn: '',
    category: resolveCategory(r.catVal, r.jobIdx),
    echelon: r.echVal > 0 && r.echVal <= 12 ? r.echVal : 0,
    employmentStatus: 'مرسم', hireDate: r.hireDate, yearsOverride: null,
    marital: r.marital || 'أعزب',
    children: Math.max(r.children, r.realChildren),
    children10: Math.max(r.children10, r.older10),
    singleWage: false, mutuelle: true,
    birthPlace: '', birthDate: '', address: '',
    postalAccount: r.postal, lastWorkDate: '', resumeDate: '', births: r.births,
  });
}

/** قراءة الملف الأصلي وبناء قوائم الموظفين (بدون حفظ) */
export async function parseOriginalWorkbook(file: File): Promise<ImportReport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: false });
  const famName = wb.SheetNames.find(s => s.includes('سحب المنح العائلية'))
    || wb.SheetNames.find(s => s.includes('المنح العائلية') && s.includes('سحب'));
  const infoName = wb.SheetNames.find(s => s.includes('حجز المعلومات'));
  if (!famName && !infoName) throw new Error('لم يتم العثور على ورقة سجل الموظفين «حجز المعلومات» أو «سحب المنح العائلية» في الملف');
  const drafts: Employee[] = [];
  const unmatched: Record<string, true> = {};
  let skipped = 0;

  let fam: { recs: FamRec[]; skipped: number; unmatched: string[] } | null = null;
  if (famName) {
    fam = parseFamSheet(wb.Sheets[famName]);
    skipped += fam.skipped;
    fam.unmatched.forEach(u => { unmatched[u] = true; });
  }
  const famByKey = new Map<string, FamRec>();
  if (fam) for (const r of fam.recs) if (!famByKey.has(r.key)) famByKey.set(r.key, r);

  if (infoName) {
    const info = parseInfoSheet(wb.Sheets[infoName]);
    skipped += info.skipped;
    info.unmatched.forEach(u => { unmatched[u] = true; });
    const infoKeys = new Set<string>();
    for (const r of info.recs) {
      infoKeys.add(r.key);
      const f = famByKey.get(r.key);
      // تواريخ ميلاد الأطفال من ورقة المنح العائلية (بالاسم)
      const births = f?.births ?? [];
      const children = Math.max(r.children, f?.realChildren ?? 0);
      const children10 = Math.max(r.children10, f?.older10 ?? 0);
      // بدائل من ورقة المنح عند فراغ الحقل في «حجز المعلومات»
      const category = r.catVal > 0 ? r.category : (f && f.catVal > 0 ? resolveCategory(f.catVal, r.jobIdx) : r.category);
      const echelon = r.echelon > 0 ? r.echelon : (f && f.echVal > 0 && f.echVal <= 12 ? f.echVal : r.echelon);
      drafts.push(toDraft({
        id: 'imp_' + String(r.num ?? drafts.length + 1) + '_' + r.key.slice(0, 8),
        name: r.name, jobIdx: r.jobIdx >= 0 ? r.jobIdx : 1, ssn: r.ssn,
        category, echelon, employmentStatus: r.employmentStatus,
        hireDate: r.hireDate || f?.hireDate || '',
        yearsOverride: r.yearsOverride,
        marital: r.marital || f?.marital || 'أعزب',
        children, children10, singleWage: r.singleWage, mutuelle: r.mutuelle,
        birthPlace: r.birthPlace, birthDate: r.birthDate, address: r.address,
        postalAccount: r.postal || f?.postal || '',
        lastWorkDate: r.lastWorkDate, resumeDate: r.resumeDate, births,
      }));
    }
    // من لا يوجد إلا في ورقة المنح العائلية: بالمنطق القديم
    if (fam) for (const r of fam.recs) {
      if (infoKeys.has(r.key)) continue;
      drafts.push(famToDraft(r));
    }
  } else if (fam) {
    for (const r of fam.recs) drafts.push(famToDraft(r));
  }

  return { imported: drafts.length, updated: 0, skipped, unmatchedJobs: Object.keys(unmatched), drafts };
}

/** دمج المسودات مع الموظفين الحاليين: تحديث المتطابق بالاسم وإلا إضافته */
export function mergeEmployees(current: Employee[], drafts: Employee[]): { changed: Employee[]; updated: number; added: number } {
  const out = current.map(e => ({ ...e }));
  const changed: Employee[] = [];
  let updated = 0, added = 0;
  for (const d of drafts) {
    const dk = mergeKey(d.name);
    const at = out.findIndex(e => mergeKey(e.name) === dk);
    if (at >= 0) {
      const e = out[at];
      if (!e.hireDate && d.hireDate) e.hireDate = d.hireDate;
      if (!e.postalAccount && d.postalAccount) e.postalAccount = d.postalAccount;
      e.marital = d.marital;
      e.children = d.children;
      e.children10 = d.children10;
      if (d.childrenBirths && d.childrenBirths.length) e.childrenBirths = d.childrenBirths;
      if (d.jobIdx > 0) e.jobIdx = d.jobIdx;
      if (d.category > 0) e.category = d.category;
      if (d.echelon > 0) e.echelon = d.echelon;
      // الحقول الجديدة من ورقة «حجز المعلومات»: تُنسخ فقط عندما تحمل
      // المسودة قيمة فعلية — فلا تُمحى قيمة موجودة بقيمة فارغة من الملف.
      // (القيم الافتراضية للمسودة — مثل false للأجر الوحيد أو «مرسم» للصفة —
      // لا تعني «غير موجود في الملف» دائماً، فلا تُلغي قيمة قائمة.)
      if (d.ssn) e.ssn = d.ssn;
      if (d.birthDate) e.birthDate = d.birthDate;
      if (d.birthPlace) e.birthPlace = d.birthPlace;
      if (d.address) e.address = d.address;
      if (d.lastWorkDate) e.lastWorkDate = d.lastWorkDate;
      if (d.resumeDate) e.resumeDate = d.resumeDate;
      if (d.singleWage) e.singleWage = true;
      if (!d.mutuelle) e.mutuelle = false;
      if (d.employmentStatus === 'متعاقد') e.employmentStatus = 'متعاقد';
      if (d.yearsOverride != null) e.yearsOverride = d.yearsOverride;
      changed.push(e);
      updated++;
    } else { out.push(d); changed.push(d); added++; }
  }
  return { changed, updated, added };
}
