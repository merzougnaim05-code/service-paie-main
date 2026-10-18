import * as XLSX from 'xlsx';
import { Employee, MaritalStatus } from '../types';
import { JOBS } from '../data/salaryGrids';
import { GRILLE } from '../data/salaryGrids';

/* ===== استيراد المعطيات من ملف برنامج الرواتب الأصلي (Excel) =====
   المصدر: ورقة «سحب المنح العائلية» — سجل الموظفين:
   الاسم | اللقب | رقم الحساب البريد | المهنة | تاريخ التوظيف | الصنف | الدرجة |
   الحالة العائلية | عدد الأولاد | (+10) | وتواريخ ميلاد الأطفال (10 خانات)         */

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

export interface ImportReport {
  imported: number;
  updated: number;
  skipped: number;      // صفوف بلا اسم
  unmatchedJobs: string[]; // مهنات لم تطابق قائمة الوظائف
  drafts: Employee[];
}

/** قراءة الملف الأصلي وبناء قوائم الموظفين (بدون حفظ) */
export async function parseOriginalWorkbook(file: File): Promise<ImportReport> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: false });
  const sheetName = wb.SheetNames.find(s => s.includes('سحب المنح العائلية'))
    || wb.SheetNames.find(s => s.includes('المنح العائلية') && s.includes('سحب'));
  if (!sheetName) throw new Error('لم يتم العثور على ورقة سجل الموظفين «سحب المنح العائلية» في الملف');
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cell = (r: number, c: number) => {
    const cc = ws[XLSX.utils.encode_cell({ r, c })];
    return cc ? cc.v : undefined;
  };
  // كتلتا ميلاد الأطفال: كل كتلة عنوانها L..الخ (عمود البداية كل 5 أعمدة من L=11)
  const childBlocks = [11, 16, 21, 26, 31, 36, 41, 46, 51, 56];
  const drafts: Employee[] = [];
  const unmatched: Record<string, true> = {};
  let imported = 0, updated = 0, skipped = 0;

  for (let row = 3; row <= range.e.r; row++) {
    const num = cell(row, 0);
    const prenom = String(cell(row, 1) ?? '').trim();   // الاسم
    const nom = String(cell(row, 2) ?? '').trim();      // اللقب
    const isName = (s: string) => !!s && s !== '0' && !/^[\d.,\s]+$/.test(s) && s.trim().length >= 1 && !s.includes('الاسم') && !s.includes('اللقب');
    if (!isName(prenom) && !isName(nom)) { skipped++; continue; }

    const postal = String(cell(row, 3) ?? '').trim();
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

    const j = jobIdx >= 0 ? JOBS[jobIdx] : null;
    // الصنف: من الورقة إن وُجد في الشبكة، وإلا صنف الخاصية للوظيفة
    let category = 0;
    if (catVal > 0) {
      const gi = GRILLE.findIndex(g => String(g.cat) === String(catVal));
      category = gi >= 0 ? gi : (typeof j?.cat === 'number' ? j.cat - 1 : 0);
    } else if (typeof j?.cat === 'number') {
      const gi = GRILLE.findIndex(g => String(g.cat) === String(j.cat));
      category = gi >= 0 ? gi : j.cat - 1;
    }
    const echelon = echVal > 0 && echVal <= 12 ? echVal : 0;

    drafts.push({
      id: 'imp_' + String(num ?? drafts.length + 1) + '_' + key(name).slice(0, 8),
      name,
      jobIdx: jobIdx >= 0 ? jobIdx : 1,
      ssn: '',
      category,
      echelon,
      employmentStatus: 'مرسم',
      hireDate,
      yearsOverride: null,
      marital: marital || 'أعزب',
      children: Math.max(children, realChildren),
      children10: Math.max(children10, older10),
      singleWage: marital === 'متزوج' ? false : false,
      mutuelle: true,
      mutuelleNum: '',
      performancePct: 40,
      incomeDifference: 0,
      experienceDifference: 0,
      birthPlace: '',
      birthDate: '',
      address: '',
      postalAccount: postal && postal !== '0' ? postal : '',
      lastWorkDate: '',
      resumeDate: '',
      allowances: [],
      childrenBirths: births,
      pensionHistory: [],
      teacherType: 'عادي',
      auresMode: 'auto',
      auresAmount: 0
    });
    imported++;
  }

  return { imported, updated, skipped, unmatchedJobs: Object.keys(unmatched), drafts };
}

/** دمج المسودات مع الموظفين الحاليين: تحديث المتطابق بالاسم وإلا إضافته */
export function mergeEmployees(current: Employee[], drafts: Employee[]): { changed: Employee[]; updated: number; added: number } {
  const out = current.map(e => ({ ...e }));
  const changed: Employee[] = [];
  let updated = 0, added = 0;
  for (const d of drafts) {
    const dk = key(d.name);
    const at = out.findIndex(e => key(e.name) === dk);
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
      changed.push(e);
      updated++;
    } else { out.push(d); changed.push(d); added++; }
  }
  return { changed, updated, added };
}
