export type DomainType = 'teach' | 'edu' | 'eco' | 'lab' | 'other';
export type EmploymentStatus = 'مرسم' | 'متعاقد';
export type MaritalStatus = 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل';

export interface Job {
  name: string;
  cat: number | string;
  domain: DomainType;
  directorType: string | null;
  code: number | string | null;
  prevcat: number | null;
  sect: number | null;
  auresCode?: string;
}

export interface GrilleCategory {
  cat: string;
  group: string;
  base: number;
  ech: number[];
}

export interface Allowance {
  name: string;
  amount: number;
  cnas: boolean;
  irg: boolean;
  perfBonus?: boolean;
  auto?: boolean;
}

/* ===== مركز الجداول والمعطيات ===== */

// سطر تغيير داخل جدول النقطة الاستدلالية (كل تعديل = سطر)
export interface PointChangeRow {
  id: string;
  label: string;          // مثال: "+75 نقطة (المرحلة الأولى)"
  effectiveYear: number;  // سارية ابتداء من هذه السنة
  bonusPoints: number;    // نقاط إضافية فوق النقطة الأساس
  note?: string;
  active: boolean;
}

// خلية نقاط استدلالية: الرقم الاستدلالي الكامل لصنف معين في درجة معينة داخل الشبكة
export interface PointCell {
  id: string;
  cat: string;        // اسم الصنف كما في الشبكة ('1'..'17'، 'خارج الفئة 1'..'خارج الفئة 7')
  grade: number;      // الدرجة (1..12)
  points: number;     // الرقم الاستدلالي الكامل لهذه الدرجة
  active: boolean;    // تعطيل الخلية يعيد قيمة الشبكة الرسمية المدمجة
}

// تعويض المنطقة — المرسوم 82-183 (كيفيات الحساب) وقوائم المناطق بمراسيم 93-130 و95-90 و96-62 و97-246
// ثلاث مجموعات (أ، ب، ج) وكل مجموعة فروع وكل فرع يضم بلديات
export interface ZoneEntry {
  id: string;
  wilaya: string;       // الولاية
  commune: string;      // البلدية
  group: 'أ' | 'ب' | 'ج';
  subgroup: string;     // الفرع (أ-1، ب-2، ج-3 ...)
  points: number;       // عدد النقاط (500/450/400/350/300/250/200/150/100) — قابلة للتعديل
  note?: string;
  active: boolean;
}

// جدول نقاط استدلالية كامل (كل جدول = قرار/مرسوم مع تغييراته)
export interface PointTable {
  id: string;
  name: string;           // اسم الشبكة/الجدول
  decree: string;         // المرسوم المرجعي
  basePoints: number;     // قيمة النقطة (دج) قبل إضافات سطور التغيير
  fromYear: number;
  toYear?: number;
  note?: string;
  active: boolean;        // تفعيل/تعطيل الجدول في كل الوثائق
  rows: PointChangeRow[];
  cells?: PointCell[];    // شبكة النقاط الاستدلالية لكل صنف وكل درجة
}

// منحة مخصصة (جديدة) تُضاف مركزياً إلى كل كشوف الرواتب
export interface CustomAllowance {
  id: string;
  name: string;
  type: 'percent' | 'fixed'; // نسبة من الأجر الرئيسي أو مبلغ ثابت
  value: number;
  cnas: boolean;         // تدخل في الأجر الخاضع للضمان الاجتماعي
  active: boolean;       // تفعيل/تعطيل في كل الوثائق
  note?: string;
}

export interface PensionHistoryRecord {
  key: string; // e.g. "2024-03" or "2024-Q1"
  effectiveFrom?: string;
  jobIdx?: number;
  rank?: string;
  category?: number | string;
  echelon?: number;
  wage?: number | string;
  perf?: number | string;
  perfRank?: string;
  perfCategory?: number | string;
  perfGrade?: number | string;
  perfAmount?: number | string;
  note?: string;
}

export interface PensionPeriodRule {
  from: string; // YYYY-MM
  to: string;   // YYYY-MM
  rank: string;
  cat: string;
  grade: string;
  wage?: string;
  amount?: string;
}

export interface Employee {
  id: string;
  name: string;
  jobIdx: number;
  ssn: string;
  category: number; // index in GRILLE (0..23)
  echelon: number;  // 0..12
  employmentStatus: EmploymentStatus;
  hireDate: string;
  yearsOverride: number | null;
  marital: MaritalStatus;
  children: number;
  children10: number;
  singleWage: boolean;
  mutuelle: boolean;
  mutuelleNum: string;
  performancePct: number;
  incomeDifference: number;
  experienceDifference: number;
  birthPlace: string;
  birthDate: string;
  address: string;
  postalAccount: string;
  zoneWilaya?: string;   // ولاية تعويض المنطقة (المرسوم 82-183)
  zoneCommune?: string;  // البلدية المؤهلة للتعويض
  lastWorkDate: string;
  resumeDate: string;
  allowances: Allowance[];
  pensionHistory: PensionHistoryRecord[];
}

export interface Settings {
  institution: string;
  wilaya: string;
  municipality: string;
  cnasAgency: string;
  cnasNum: string;
  paymentCenter: string;
  socialNature: string;
  pointValue: number;
  cnasRate: number;
  mutuelleRate: number;
  childRate: number;
  child10Rate: number;
  singleWageRate: number;
  maritalNoChildRate: number;
  auresEnabled: boolean;
  signatory?: string;
  director?: string;
  /* مركز الجداول والمعطيات */
  pointTables?: PointTable[];
  customAllowances?: CustomAllowance[];
  disabledBuiltins?: string[];
  zoneEntries?: ZoneEntry[];          // بلديات تعويض المنطقة (82-183 ومراسيم التحديث)
  zoneAllowanceEnabled?: boolean;     // تفعيل/تعطيل المنحة في كل الوثائق
}

export interface PayslipResult {
  g: GrilleCategory;
  pointVal: number;
  years: number;
  basic: number;
  seniority: number;
  incomeDifference: number;
  experienceDifference: number;
  allowTotal: number;
  familyTotal: number;
  gross: number;
  auresAllowance: number;
  cnasBase: number;
  cnasDeduction: number;
  mutDeduction: number;
  irgBase: number;
  irgTax: number;
  perfBonusTotal: number;
  perfBonusTax: number;
  net: number;
  allAllowances: Allowance[];
  job: Job | undefined;
  cnasRate: number;
  gridName: string;
  gridDecree: string;
}
