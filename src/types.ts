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

// جدول نقاط استدلالية كامل (كل جدول = قرار/مرسوم مع تغييراته)
export interface PointTable {
  id: string;
  name: string;           // اسم الشبكة/الجدول
  decree: string;         // المرسوم المرجعي
  basePoints: number;     // النقطة الأساس قبل الإضافات
  fromYear: number;
  toYear?: number;
  note?: string;
  active: boolean;        // تفعيل/تعطيل الجدول في كل الوثائق
  rows: PointChangeRow[];
}

// منحة مخصصة (جديدة) تُضاف مركزياً إلى كل كشوف الرواتب
export interface CustomAllowance {
  id: string;
  name: string;
  type: 'percent' | 'fixed'; // نسبة من الأجر التصاعدي أو مبلغ ثابت
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
