import { Employee, Settings } from '../types';
import { DEFAULT_POINT_TABLES, DEFAULT_ZONE_ENTRIES, buildOfficialCells } from '../data/salaryGrids';

const EMPLOYEES_STORAGE_KEY = 'dz_payroll_employees_v3';
const SETTINGS_STORAGE_KEY = 'dz_payroll_settings_v3';
const LAST_MODIFIED_KEY = 'dz_payroll_last_modified_v3';

/* =====================================================================
   موزّع التخزين — نسخة سطح المكتب مقابل الويب:
   - في تطبيق سطح المكتب (Electron): البيانات في ملف JSON حقيقي على القرص
     (userData/payroll-data.json مع نسخ احتياطية تلقائية) عبر جسر preload.
   - في المتصفح: localStorage كما كان دون أي تغيير في السلوك.
   ===================================================================== */
interface DesktopBridge {
  isDesktop: boolean;
  readData(key: string): string | null;
  writeData(key: string, value: string): boolean;
  removeData(key: string): boolean;
}

const desktopBridge = (): DesktopBridge | null => {
  const w = window as unknown as { payrollDesktop?: DesktopBridge };
  return w.payrollDesktop && w.payrollDesktop.isDesktop ? w.payrollDesktop : null;
};

const storeGet = (key: string): string | null => {
  const d = desktopBridge();
  if (d) {
    try {
      return d.readData(key);
    } catch {
      return null;
    }
  }
  return localStorage.getItem(key);
};

const storeSet = (key: string, value: string): void => {
  const d = desktopBridge();
  if (d) {
    try {
      d.writeData(key, value);
      return;
    } catch {
      // عند الفشل نكتب في localStorage كاحتياط
    }
  }
  localStorage.setItem(key, value);
};

const storeRemove = (key: string): void => {
  const d = desktopBridge();
  if (d) {
    try {
      d.removeData(key);
    } catch {
      // ignore
    }
  }
  localStorage.removeItem(key);
};

export const DEFAULT_SETTINGS: Settings = {
  institution: 'ثانوية الشهيد محمد العربي التبسي',
  wilaya: 'باتنة',
  municipality: 'باتنة',
  cnasAgency: 'وكالة باتنة',
  cnasNum: '05/1234567',
  paymentCenter: 'مركز باتنة وسط',
  socialNature: 'مؤسسة عمومية إدارية',
  pointValue: 45,
  cnasRate: 9,
  mutuelleRate: 1,
  childRate: 300,
  child10Rate: 11.25,
  singleWageRate: 800,
  maritalNoChildRate: 5.50,
  auresEnabled: true,
  signatory: 'المدير: لخضر بن سالم',
  director: 'لخضر بن سالم'
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_01',
    name: 'أحمد بلقاسمي',
    jobIdx: 1, // أستاذ التعليم الابتدائي
    ssn: '1978051203445501',
    category: 11, // صنف 12
    echelon: 6,
    employmentStatus: 'مرسم',
    hireDate: '2008-09-01',
    yearsOverride: null,
    marital: 'متزوج',
    children: 3,
    children10: 2,
    singleWage: true,
    mutuelle: true,
    mutuelleNum: 'MUT-05-9921',
    performancePct: 40,
    incomeDifference: 0,
    experienceDifference: 0,
    birthPlace: 'باتنة',
    birthDate: '1978-05-12',
    address: 'حي النصر، عمارة 14 رقم 3، باتنة',
    postalAccount: '0012345678 مفتاح 44',
    lastWorkDate: '',
    resumeDate: '',
    allowances: [],
    teacherType: 'عادي',
    auresMode: 'auto',
    auresAmount: 0,
    pensionHistory: [
      { key: '2021-01', rank: 'أستاذ التعليم الابتدائي', category: 11, echelon: 4, wage: 54200 },
      { key: '2023-01', rank: 'أستاذ التعليم الابتدائي', category: 11, echelon: 5, wage: 58900 },
      { key: '2025-01', rank: 'أستاذ التعليم الابتدائي', category: 11, echelon: 6, wage: 64500 }
    ]
  },
  {
    id: 'emp_02',
    name: 'فاطمة الزهراء معوش',
    jobIdx: 52, // مقتصد
    ssn: '1982112401889902',
    category: 12, // صنف 13
    echelon: 5,
    employmentStatus: 'مرسم',
    hireDate: '2010-10-15',
    yearsOverride: null,
    marital: 'متزوج',
    children: 2,
    children10: 1,
    singleWage: false,
    mutuelle: true,
    mutuelleNum: 'MUT-05-7734',
    performancePct: 35,
    incomeDifference: 0,
    experienceDifference: 0,
    birthPlace: 'بريكة',
    birthDate: '1982-11-24',
    address: 'حي الزهور، باتنة',
    postalAccount: '0087654321 مفتاح 88',
    lastWorkDate: '',
    resumeDate: '',
    allowances: [],
    teacherType: 'عادي',
    auresMode: 'auto',
    auresAmount: 0,
    pensionHistory: []
  },
  {
    id: 'emp_03',
    name: 'عمار بن عيسى',
    jobIdx: 88, // عون الخدمة من المستوى الأول
    ssn: '1972031502334403',
    category: 0, // صنف 1
    echelon: 0,
    employmentStatus: 'متعاقد',
    hireDate: '2012-01-02',
    yearsOverride: 14,
    marital: 'متزوج',
    children: 4,
    children10: 3,
    singleWage: true,
    mutuelle: false,
    mutuelleNum: '',
    performancePct: 30,
    incomeDifference: 0,
    experienceDifference: 0,
    birthPlace: 'عين التوتة',
    birthDate: '1972-03-15',
    address: 'حي الاستقلال، باتنة',
    postalAccount: '0098712345 مفتاح 12',
    lastWorkDate: '',
    resumeDate: '',
    allowances: [],
    teacherType: 'عادي',
    auresMode: 'auto',
    auresAmount: 0,
    pensionHistory: []
  }
];

/**
 * بذر مركز الجداول والمعطيات: جداول النقاط الرسمية + حاويات المنح
 * والترقية: إرفاق شبكة النقاط الرسمية (كل صنف × كل درجة) بأي جدول محفوظ سابقاً بدون خلايا
 * + تصحيح قيمة النقطة الاستدلالية إلى 45 دج الثابتة منذ 2008 في السطور المبدئية (ptr-*)
 */
function sanitizePointTables(tables: any[]): any[] {
  return (tables || []).map(t => {
    if (!t || typeof t.id !== 'string' || !t.id.startsWith('pt-')) return t;
    return {
      ...t,
      basePoints: 45,
      rows: (t.rows || []).map((r: any) =>
        r && typeof r.id === 'string' && r.id.startsWith('ptr-')
          ? { ...r, bonusPoints: 0, label: 'قيمة النقطة الاستدلالية 45 دج' }
          : r
      )
    };
  });
}

function withDataHubDefaults(s: Settings): Settings {
  const pointTables = sanitizePointTables(
    !s.pointTables || s.pointTables.length === 0
      ? DEFAULT_POINT_TABLES
      : s.pointTables.map(t =>
        !t.cells || t.cells.length === 0
          ? { ...t, cells: buildOfficialCells(Number(t.fromYear) || new Date().getFullYear()) }
          : t
        )
  );
  return {
    ...s,
    pointTables,
    customAllowances: s.customAllowances || [],
    disabledBuiltins: s.disabledBuiltins || [],
    zoneEntries: !s.zoneEntries || s.zoneEntries.length === 0 ? DEFAULT_ZONE_ENTRIES : s.zoneEntries,
    zoneAllowanceEnabled: s.zoneAllowanceEnabled !== false
  };
}

export function loadSettings(): Settings {
  try {
    const raw = storeGet(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return withDataHubDefaults({ ...DEFAULT_SETTINGS, ...parsed });
    }
  } catch (err) {
    console.warn('Failed to load settings from localStorage', err);
  }
  return withDataHubDefaults(DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): boolean {
  try {
    storeSet(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    touchLastModified();
    return true;
  } catch (err) {
    console.error('Failed to save settings', err);
    return false;
  }
}

export function loadEmployees(): Employee[] {
  const migrate = (list: Employee[]): Employee[] =>
    list.map(e => ({
      teacherType: 'عادي',
      auresMode: 'auto',
      auresAmount: 0,
      ...e
    } as Employee));
  try {
    const raw = storeGet(EMPLOYEES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return migrate(parsed);
      }
    }
  } catch (err) {
    console.warn('Failed to load employees from localStorage', err);
  }
  // Initialize with realistic initial data
  saveEmployees(INITIAL_EMPLOYEES);
  return migrate(INITIAL_EMPLOYEES);
}

export function saveEmployees(employees: Employee[]): boolean {
  try {
    storeSet(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    touchLastModified();
    return true;
  } catch (err) {
    console.error('Failed to save employees', err);
    return false;
  }
}

export function getLastModified(): string {
  try {
    return storeGet(LAST_MODIFIED_KEY) || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function touchLastModified(): void {
  try {
    storeSet(LAST_MODIFIED_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function loadData(): Employee[] {
  return loadEmployees();
}

export function loadLastModified(): string {
  return getLastModified();
}

export function saveEmployee(emp: Employee): boolean {
  const current = loadEmployees();
  const idx = current.findIndex(e => e.id === emp.id);
  let updated: Employee[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = emp;
  } else {
    updated = [emp, ...current];
  }
  return saveEmployees(updated);
}

export function deleteEmployee(id: string): boolean {
  const current = loadEmployees();
  const updated = current.filter(e => e.id !== id);
  return saveEmployees(updated);
}

export function resetToDefault(): void {
  saveEmployees(INITIAL_EMPLOYEES);
  saveSettings(DEFAULT_SETTINGS);
  touchLastModified();
}

export function clearAllData(): boolean {
  try {
    storeRemove(EMPLOYEES_STORAGE_KEY);
    storeRemove(SETTINGS_STORAGE_KEY);
    touchLastModified();
    return true;
  } catch (err) {
    console.error('Failed to clear data', err);
    return false;
  }
}
