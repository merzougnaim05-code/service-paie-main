import { Employee, Job, GrilleCategory, Allowance, Settings, PayslipResult } from '../types';
import { GRID1989, JOBS, getGrilleForYear, getGrilleLabelForYear } from '../data/salaryGrids';

export function fmt(n: number): string {
  const val = isFinite(n) ? n : 0;
  return val.toLocaleString('ar-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function computeIRG(base: number): number {
  if (base <= 0) return 0;
  const b = Math.floor(base / 10) * 10;
  if (b <= 30000) return 0;
  if (b > 320000) return (b - 320000) * 0.35 + 90700;
  if (b > 160000) return (b - 160000) * 0.33 + 37900;
  if (b > 80000) return (b - 80000) * 0.30 + 13900;
  if (b > 40000) return (b - 40000) * 0.27 + 3100;
  if (b >= 35000) {
    const val = (b - 20000) * 0.23 * 0.4;
    if (val >= 1500) return (b - 20000) * 0.23 - 1500;
    return (b - 20000) * 0.23 * 0.6;
  }
  if (b > 30000) {
    const val = (b - 20000) * 0.23 * 0.4;
    if (val > 1000 && val < 1500) return ((b - 20000) * 0.23 * 0.6) * (137 / 51) - (27925 / 8);
    return ((b - 20000) * 0.23 - 1000) * (137 / 51) - (27925 / 8);
  }
  return 0;
}

/**
 * سلم IRG الساري من 2012 إلى 2021 (إعفاء حتى 20,000 دج + تخفيض 40% للشريحة الثانية)
 */
export function computeIRG2012(base: number): number {
  if (base <= 0) return 0;
  const b = Math.floor(base / 10) * 10;
  if (b <= 20000) return 0;
  if (b > 320000) return (b - 320000) * 0.35 + 90360;
  if (b > 160000) return (b - 160000) * 0.33 + 37560;
  if (b > 80000) return (b - 80000) * 0.30 + 13560;
  if (b > 40000) return (b - 40000) * 0.27 + 2760;
  return (b - 20000) * 0.23 * 0.6;
}

/**
 * سلم IRG القديم الساري قبل 2012 (إعفاء حتى 15,000 دج)
 */
export function computeIRGPre2012(base: number): number {
  if (base <= 0) return 0;
  const b = Math.floor(base / 10) * 10;
  if (b <= 15000) return 0;
  if (b > 50000) return (b - 50000) * 0.35 + 9000;
  if (b > 30000) return (b - 30000) * 0.30 + 3000;
  return (b - 15000) * 0.20;
}

/**
 * اختيار سلم الضريبة على الدخل المناسب حسب سنة كشف الراتب:
 * - قبل 2012: السلم القديم (إعفاء 15,000 دج)
 * - 2012 - 2021: سلم 2012 (إعفاء 20,000 دج)
 * - 2022 وما بعد: سلم 2022 الجديد (إعفاء 30,000 دج)
 */
export function computeIRGForYear(base: number, year: number): number {
  if (year >= 2022) return computeIRG(base);
  if (year >= 2012) return computeIRG2012(base);
  return computeIRGPre2012(base);
}

export function isProfessionalWorkerJob(job: Job | undefined): boolean {
  if (!job || job.code == null) return false;
  const c = String(job.code);
  return c === '6000' || c === '6010' || c === '6020' || c === '6030' ||
         c === 'O7000' || c === 'O7040' || c === 'O7080' || c === 'O7110' ||
         c === 'B7020' || c === 'B7030' || c === 'B7050' || c === 'B7070' ||
         c === 'V6040' || c === 'V6050' || c === 'V6060' || c === 'V6070';
}

export function professionalWorkerLumpSum(category: number | string): number {
  const c = Number(category);
  if (c === 1) return 7700;
  if (c === 3) return 6900;
  if (c === 5) return 5700;
  if (c === 6) return 5000;
  return 3800;
}

export function commonCorpsLumpSum(category: number | string): number {
  const c = Number(category);
  if (c === 1) return 7700;
  if (c === 2) return 7400;
  if (c === 3) return 6900;
  if (c === 4) return 6400;
  if (c === 5) return 5700;
  if (c === 6) return 5000;
  if (c === 7 || c === 8) return 3800;
  if (c === 9 || c === 10) return 3100;
  return 1500;
}

export function lumpSumAllowance(category: number | string): number {
  const c = Number(category);
  if (c === 1) return 7700;
  if (c === 2) return 7400;
  if (c === 3) return 6900;
  if (c === 4) return 6400;
  if (c === 5) return 5700;
  if (c === 6) return 5000;
  if (c === 7 || c === 8) return 3800;
  if (c === 9 || c === 10) return 3100;
  return 1500;
}

export function isCommonCorpsJob(job: Job | undefined): boolean {
  if (!job) return false;
  const codeNum = typeof job.code === 'number' ? job.code : null;
  return codeNum != null && codeNum >= 4000 && codeNum < 6000;
}

export function commonCorpsAdminRate(job: Job | undefined): number {
  const name = String(job?.name || '');
  if (/^(متصرف|وثائقي|رئيس الوثائقيين|مساعد وثائقي|المهندسون|مهندسو|المهندسين|رئيس المهندسين)/.test(name)) return 0.40;
  return 0.25;
}

export function yearsOfService(hireDateStr: string, atDate: Date = new Date()): number {
  if (!hireDateStr) return 0;
  const hd = new Date(hireDateStr);
  if (isNaN(hd.getTime())) return 0;
  const diff = (atDate.getTime() - hd.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, Math.floor(diff));
}

export function seniorityFor(
  job: Job | undefined,
  g: GrilleCategory,
  echelon: number,
  pointVal: number,
  basic: number,
  years: number,
  employmentStatus: string
): number {
  const codeStr = String(job?.code || '');
  const isContractBOP = /^[OBP]/.test(codeStr);
  const isM = /^M/.test(codeStr);
  const isPW = isProfessionalWorkerJob(job);

  if (isPW && employmentStatus !== 'مرسم') {
    return years > 0 ? Math.round(basic * years * 0.014 * 100) / 100 : 0;
  }
  if (isContractBOP) {
    return years > 0 ? Math.round(basic * years * 0.014 * 100) / 100 : 0;
  }
  if (isM && echelon !== 0) return 0;

  if (echelon > 0 && echelon <= g.ech.length) {
    return Math.round(g.ech[echelon - 1] * pointVal * 100) / 100;
  }
  return 0;
}

export function auresAllowance(job: Job | undefined, echelon: number, years: number): number {
  if (!job) return 0;
  const code = job.auresCode || (job.prevcat != null && job.sect != null ? ('A' + job.sect + job.prevcat) : null);
  if (!code) return 0;
  const row = GRID1989.find(r => r.code === code);
  if (!row) return 0;

  const prevcat = job.prevcat != null ? job.prevcat : (code.length > 2 ? parseInt(code.slice(2), 10) : null);
  const codeStr = String(job.code || '');
  const isContractBOP = /^[OBP]/.test(codeStr);
  let val: number;

  if (isContractBOP) {
    val = years > 0 ? (row.base + row.base * 0.014 * years) * 0.1 : row.base * 0.1;
  } else if (echelon === 0) {
    val = row.base * 0.1;
  } else {
    const idx = Math.min(Math.max(echelon, 1), row.ech.length) - 1;
    if (prevcat != null && prevcat > 12) {
      val = row.minIndex + (row.ech[idx] || 0);
    } else {
      val = (Math.round((row.base / row.minIndex) * 100) / 100 * (row.ech[idx] || 0) + row.base) * 0.1;
    }
  }
  return Math.round(val * 100) / 100;
}

export function autoAllowancesForJob(
  job: Job | undefined,
  basic: number,
  seniority: number,
  category: number | string,
  echelon: number,
  year: number = new Date().getFullYear()
): Allowance[] {
  if (!job) return [];
  // قبل 2008 لا تطبق المنح الحديثة (النظام التعويضي 10-78 ساري بأثر رجعي من 01-01-2008)
  if (year < 2008) return [];
  const list: Allowance[] = [];
  const rp = basic + seniority;
  const catNum = Number(category) || 1;

  const push = (name: string, amount: number, detail?: string, flags?: { cnas?: boolean; irg?: boolean }) => {
    if (amount > 0) {
      list.push({
        name: detail ? `${name} (${detail})` : name,
        amount: Math.round(amount * 100) / 100,
        cnas: flags?.cnas !== undefined ? flags.cnas : true,
        irg: flags?.irg !== undefined ? flags.irg : true,
        auto: true
      });
    }
  };

  if (isProfessionalWorkerJob(job)) {
    push('تعويض الضرر', rp * 0.25, `25% × ${fmt(rp)}`);
    push('منحة دعم نشاط الإدارة', rp * 0.10, `10% × ${fmt(rp)}`);
    push('المنحة الجزافية التعويضية', professionalWorkerLumpSum(category), 'مبلغ ثابت حسب الصنف');
    return list;
  }

  const domain = job.domain || 'other';
  const isEducArticle3 = (domain === 'teach' || domain === 'edu');
  const isArticle4or3 = (domain === 'teach' || domain === 'edu' || domain === 'eco');

  if (isArticle4or3) {
    const doc = catNum <= 10 ? 2000 : (catNum >= 13 ? 3000 : 2500);
    push('تعويض التوثيق التربوي', doc, 'مبلغ ثابت حسب الصنف');
    // نسب التأهيل: 40% (صنف ≤ 12) و45% (صنف ≥ 13) من 2025 — قبلها 25% (صنف ≤ 11) و30% (صنف ≥ 12)
    const qualifRate = year >= 2025 ? (catNum <= 12 ? 0.4 : 0.45) : (catNum <= 11 ? 0.25 : 0.3);
    push('تعويض التأهيل', rp * qualifRate, `${qualifRate * 100}% × ${fmt(rp)}`);
  }

  const isSupervisorCorps = /^مشرف/.test(job.name || '');
  if (catNum >= 12 && !isSupervisorCorps) {
    push('منحة الامتياز', rp * 0.10, `10% × ${fmt(rp)}`, { cnas: true, irg: false });
  }

  const isTeachingCorps = /^أستاذ/.test(job.name || '');
  if (isTeachingCorps && catNum >= 12) {
    push('منحة السكن', 1000, 'مبلغ ثابت — لحين توفير سكن وظيفي', { cnas: false, irg: true });
  }

  const descendedFromTeachers = domain === 'teach' || /^ناظر/.test(job.name || '') || job.name === 'مستشار التربية';
  if (year >= 2025) {
    // المرسوم التنفيذي 25-55 (جانفي 2025): 45% أساتذة التعليم، 30% المشرفين، 15% المصالح الاقتصادية والمخابر
    if (descendedFromTeachers) {
      push('تعويض الدعم المدرسي والمعالجة البيداغوجية', rp * 0.45, `45% × ${fmt(rp)}`);
    } else if (domain === 'edu') {
      push('تعويض الدعم المدرسي والمعالجة البيداغوجية', rp * 0.30, `30% × ${fmt(rp)}`);
    } else if (domain === 'eco' || domain === 'lab') {
      push('تعويض الدعم المدرسي والمعالجة البيداغوجية', rp * 0.15, `15% × ${fmt(rp)}`);
    }
  } else if (year >= 2011 && (domain === 'teach' || domain === 'edu')) {
    // المرسوم التنفيذي 11-171 (2011): 15% من الراتب الرئيسي لفائدة الأسلاك التربوية
    push('تعويض الدعم المدرسي والمعالجة البيداغوجية', rp * 0.15, `15% × ${fmt(rp)}`);
  }

  const isSupervision = ['مشرف التربية', 'مشرف رئيسي للتربية', 'مشرف رئيس', 'مشرف عام للتربية'].includes(job.name);
  if (isEducArticle3 || isSupervision) {
    push('تعويض الخبرة البيداغوجية', basic * 0.04 * echelon, `4% × ${echelon} (الدرجة) × ${fmt(basic)}`);
  }

  if (domain === 'eco') {
    push('تعويض التسيير المالي والمادي', basic * 0.04 * echelon, `4% × ${echelon} (الدرجة) × ${fmt(basic)}`);
  }

  if (job.directorType === 'ابتدائية') push('تعويض تسيير مؤسسة تعليمية', 3000, 'مبلغ ثابت — مدير ابتدائية');
  else if (job.directorType === 'متوسطة') push('تعويض تسيير مؤسسة تعليمية', 4000, 'مبلغ ثابت — مدير متوسطة');
  else if (job.directorType === 'ثانوية') push('تعويض تسيير مؤسسة تعليمية', 5000, 'مبلغ ثابت — مدير ثانوية');

  push('المنحة الجزافية التعويضية', lumpSumAllowance(category), 'مبلغ ثابت حسب الصنف');

  if (domain === 'lab') {
    push('تعويض الخدمات التقنية', rp * 0.25, `25% × ${fmt(rp)}`);
    push('تعويض الضرر', rp * 0.25, `25% × ${fmt(rp)}`);
  }

  if (domain === 'other') {
    if (isCommonCorpsJob(job)) {
      const adminRate = commonCorpsAdminRate(job);
      push('تعويض الخدمات الإدارية المشتركة', rp * adminRate, `${adminRate * 100}% × ${fmt(rp)}`);
      push('تعويض دعم نشاطات الإدارة', rp * 0.10, `10% × ${fmt(rp)}`);
      push('المنحة الجزافية التعويضية', commonCorpsLumpSum(category), 'مبلغ ثابت حسب الصنف');
      return list;
    }
  }

  return list;
}

export function performanceBonusForJob(
  job: Job | undefined,
  basic: number,
  seniority: number,
  pct: number
): Allowance | null {
  if (!job || !pct || pct <= 0) return null;
  let name = 'علاوة المردودية';
  let max = 30;
  const domain = job.domain || 'other';

  if (isProfessionalWorkerJob(job)) {
    name = 'علاوة المردودية (العمال المهنيون)';
    max = 30;
  } else if (domain === 'teach' || domain === 'edu') {
    name = 'علاوة تحسين الأداء التربوي';
    max = 40;
  } else if (domain === 'eco') {
    name = 'علاوة تحسين الأداء في التسيير';
    max = 40;
  } else if (domain === 'lab') {
    name = 'علاوة المردودية (المخابر)';
    max = 30;
  }

  const rp = basic + seniority;
  const rate = Math.min(Number(pct), max) / 100;
  const amount = Math.round(rp * rate * 100) / 100;

  return {
    name: `${name} (${rate * 100}% × ${fmt(rp)})`,
    amount,
    cnas: true,
    irg: false,
    perfBonus: true,
    auto: true
  };
}

export function computePayslip(emp: Employee, month: number, year: number, settings: Settings): PayslipResult {
  // الشبكة الاستدلالية والنقطة تتبدلان تلقائياً حسب سنة الكشف
  // (07-304 للفترة 2008-2021، ثم 22-138 لسنة 2022، ثم 23-54 لسنتي 2023 و2024-2026)
  const grille = getGrilleForYear(year);
  const grilleIndex = emp.category >= 0 && emp.category < grille.length ? emp.category : 0;
  const g = grille[grilleIndex] || grille[0];
  const job = JOBS[emp.jobIdx];
  const pointVal = settings.pointValue || 45;

  const atDate = new Date(year, month - 1, 1);
  const years = emp.yearsOverride != null ? emp.yearsOverride : yearsOfService(emp.hireDate, atDate);

  const basic = Math.round(g.base * pointVal * 100) / 100;
  const seniority = seniorityFor(job, g, emp.echelon, pointVal, basic, years, emp.employmentStatus);

  const autoAllow = autoAllowancesForJob(job, basic, seniority, g.cat, emp.echelon, year);
  const pb = performanceBonusForJob(job, basic, seniority, emp.performancePct || 0);
  if (pb) autoAllow.push(pb);

  const aures = settings.auresEnabled ? auresAllowance(job, emp.echelon, years) : 0;
  if (aures > 0) {
    autoAllow.push({ name: 'منحة الأوراس', amount: aures, cnas: true, irg: false, auto: true });
  }

  const manualAllowances = (emp.allowances || []).filter(a => !a.auto);
  const allAllowances = [...autoAllow, ...manualAllowances];

  let allowTotal = 0;
  let cnasAllow = 0;
  let irgAllow = 0;
  let perfBonusTotal = 0;

  allAllowances.forEach(a => {
    const amt = a.amount || 0;
    allowTotal += amt;
    if (a.cnas) cnasAllow += amt;
    if (a.irg) irgAllow += amt;
    if (a.perfBonus) perfBonusTotal += amt;
  });

  const nChild10Capped = Math.min(emp.children10 || 0, 3);
  const singleWage = emp.singleWage && (emp.children || 0) > 0;
  const maritalNoChild = emp.singleWage && (emp.children || 0) === 0 && emp.marital === 'متزوج';
  const familyTotal = (emp.children || 0) * (settings.childRate || 300)
    + nChild10Capped * (settings.child10Rate || 11.25)
    + (singleWage ? (settings.singleWageRate || 800) : 0)
    + (maritalNoChild ? (settings.maritalNoChildRate || 5.50) : 0);

  const incomeDifference = Number(emp.incomeDifference) || 0;
  const experienceDifference = Number(emp.experienceDifference) || 0;
  const manualDifferences = incomeDifference + experienceDifference;

  const gross = Math.round((basic + seniority + allowTotal + familyTotal + manualDifferences) * 100) / 100;
  const cnasBase = Math.round((basic + seniority + cnasAllow + manualDifferences) * 100) / 100;
  const cnasRate = (settings.cnasRate ?? 9) / 100;
  const cnasDeduction = Math.round(cnasBase * cnasRate * 100) / 100;

  const mutRate = emp.mutuelle ? ((settings.mutuelleRate ?? 1) / 100) : 0;
  const mutDeduction = Math.round(gross * mutRate * 100) / 100;

  const irgBase = Math.max(0, Math.round((basic + seniority + irgAllow - cnasDeduction) * 100) / 100);
  const irgTax = Math.round(computeIRGForYear(irgBase, year) * 100) / 100;

  const perfBonusTax = Math.round(perfBonusTotal * 0.10 * 100) / 100;
  const net = Math.round((gross - cnasDeduction - mutDeduction - irgTax - perfBonusTax) * 100) / 100;

  const gridLabel = getGrilleLabelForYear(year);

  return {
    g,
    pointVal,
    years,
    basic,
    seniority,
    incomeDifference,
    experienceDifference,
    allowTotal,
    familyTotal,
    gross,
    auresAllowance: aures,
    cnasBase,
    cnasDeduction,
    mutDeduction,
    irgBase,
    irgTax,
    perfBonusTotal,
    perfBonusTax,
    net,
    allAllowances,
    job,
    cnasRate: cnasRate * 100,
    gridName: gridLabel.name,
    gridDecree: gridLabel.decree
  };
}

export function amountWordsDZD(value: number): string {
  const n = Math.round((Number(value) || 0) * 100) / 100;
  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

  function under100(x: number): string {
    if (x < 10) return units[x];
    if (x < 20) return teens[x - 10];
    const a = x % 10;
    const b = Math.floor(x / 10);
    return a ? (units[a] + ' و' + tens[b]) : tens[b];
  }

  function under1000(x: number): string {
    if (x < 100) return under100(x);
    const h = Math.floor(x / 100);
    const r = x % 100;
    const hw = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'][h];
    return r ? (hw + ' و' + under100(r)) : hw;
  }

  function words(x: number): string {
    if (x === 0) return 'صفر';
    const parts: string[] = [];
    const m = Math.floor(x / 1000000);
    const k = Math.floor((x % 1000000) / 1000);
    const r = x % 1000;
    if (m) parts.push(m === 1 ? 'مليون' : m === 2 ? 'مليونان' : under1000(m) + ' مليون');
    if (k) parts.push(k === 1 ? 'ألف' : k === 2 ? 'ألفان' : under1000(k) + ' ألف');
    if (r) parts.push(under1000(r));
    return parts.join(' و');
  }

  const din = Math.floor(n);
  const cent = Math.round((n - din) * 100);
  return `${words(din)} دينار جزائري${cent ? ' و' + under100(cent) + ' سنتيماً' : ''}`;
}

export function getClassificationCategory(categoryStr: string): 'exec' | 'moyen' | 'sup' | 'dir' {
  if (categoryStr.includes('خارج')) return 'dir';
  const c = parseInt(categoryStr, 10);
  if (c >= 1 && c <= 6) return 'exec';
  if (c >= 7 && c <= 10) return 'moyen';
  if (c >= 11 && c <= 17) return 'sup';
  return 'dir';
}
