import { Employee, Settings } from '../types';

const EMPLOYEES_STORAGE_KEY = 'dz_payroll_employees_v3';
const SETTINGS_STORAGE_KEY = 'dz_payroll_settings_v3';
const LAST_MODIFIED_KEY = 'dz_payroll_last_modified_v3';

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
    pensionHistory: []
  }
];

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to load settings from localStorage', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): boolean {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    touchLastModified();
    return true;
  } catch (err) {
    console.error('Failed to save settings', err);
    return false;
  }
}

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load employees from localStorage', err);
  }
  // Initialize with realistic initial data
  saveEmployees(INITIAL_EMPLOYEES);
  return INITIAL_EMPLOYEES;
}

export function saveEmployees(employees: Employee[]): boolean {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    touchLastModified();
    return true;
  } catch (err) {
    console.error('Failed to save employees', err);
    return false;
  }
}

export function getLastModified(): string {
  try {
    return localStorage.getItem(LAST_MODIFIED_KEY) || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function touchLastModified(): void {
  try {
    localStorage.setItem(LAST_MODIFIED_KEY, new Date().toISOString());
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
    localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    touchLastModified();
    return true;
  } catch (err) {
    console.error('Failed to clear data', err);
    return false;
  }
}
