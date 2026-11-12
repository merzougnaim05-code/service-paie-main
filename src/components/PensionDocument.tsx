import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Employee, Settings, Job, PensionSalaryRule, PensionYieldRule, PensionDocRecord } from '../types';
import { JOBS, GRILLE, MONTHS_AR, MAJAZ_CODES } from '../data/salaryGrids';
import { computePayslip, fmt, getClassificationCategory, isProfessionalWorkerJob, yearsOfService } from '../utils/salaryCalculator';
import { loadPensionDraft, savePensionDraft, listPensionDocs, upsertPensionDoc, deletePensionDoc } from '../utils/storage';
import { exportElementsToPdf } from '../utils/exportPdf';
import { CNR_LOGO } from '../data/cnrLogo';
import { AutoFitScale } from './DeviceScaler';
import {
  Award,
  Printer,
  Download,
  Settings2,
  Sparkles,
  Save,
  FileCheck
} from 'lucide-react';

interface PensionDocumentProps {
  employees: Employee[];
  settings: Settings;
  selectedEmpId?: string;
  onUpdateEmployee: (emp: Employee) => void;
}

interface MonthItem {
  key: string;       // YYYY-MM
  label: string;     // e.g. "جانفي 2021"
  salary: number;
  yieldVal: number;  // علاوة المردودية الفصلية (تدفع بعد مارس/جوان/سبتمبر/ديسمبر)
};

// أشهر دفع المردودية: نهاية كل ثلاثي (مارس، جوان، سبتمبر، ديسمبر)
const isYieldMonth = (key: string) => {
  const m = Number(key.slice(5, 7));
  return m === 3 || m === 6 || m === 9 || m === 12;
};

// Split a full name into { lastName, firstName } — last token is the family name.
const splitName = (full: string) => {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: '', firstName: '' };
  if (parts.length === 1) return { lastName: parts[0], firstName: '' };
  return { lastName: parts[parts.length - 1], firstName: parts.slice(0, -1).join(' ') };
};

// Split YYYY-MM-DD into 3-cell date digits
const parseDate = (dStr?: string) => {
  if (!dStr) return { day: '', month: '', year: '' };
  const parts = dStr.split('-');
  if (parts.length === 3) return { day: parts[2], month: parts[1], year: parts[0] };
  return { day: '', month: '', year: '' };
};

export const PensionDocument: React.FC<PensionDocumentProps> = ({
  employees,
  settings,
  selectedEmpId,
  onUpdateEmployee
}) => {
  const [empId, setEmpId] = useState<string>(selectedEmpId || employees[0]?.id || '');
  const [refMonth, setRefMonth] = useState<number>(new Date().getMonth() + 1);
  const [refYear, setRefYear] = useState<number>(new Date().getFullYear());
  // عدد أشهر الوثيقة: 60 افتراضياً — قابل للتغيير (12 إلى 60) فتتولد الأشهر المطلوبة فقط
  const [monthsCount, setMonthsCount] = useState<number>(60);

  const [activeFace, setActiveFace] = useState<'both' | 'front' | 'back'>('both');
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);

  // 60 months data state
  const [monthsData, setMonthsData] = useState<MonthItem[]>([]);

  // 5 Salary evolution rules — الرتبة/الصنف/الدرجة قوائم منسدلة، والأجر والمردودية يُحتسبان آلياً (قابلان للتعديل)
  const EMPTY_SALARY_RULE: PensionSalaryRule = { from: '', to: '', jobIdx: '', rank: '', catIdx: '', grade: '', years: '', wage: '', teacherType: 'عادي', yieldAmt: '' };
  const emptySalaryRules = (): PensionSalaryRule[] =>
    Array.from({ length: 5 }, () => ({ ...EMPTY_SALARY_RULE }));
  const [salaryRules, setSalaryRules] = useState<PensionSalaryRule[]>(emptySalaryRules);

  // 5 Yield (مردودية) programming rules — تدفع بعد مارس/جوان/سبتمبر/ديسمبر (نهاية كل ثلاثي)
  const [yieldRules, setYieldRules] = useState<PensionYieldRule[]>(
    Array.from({ length: 5 }, () => ({ from: '', to: '', amount: '' }))
  );

  const [toast, setToast] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // سجل الوثائق — كل وثيقة يعمل عليها المستخدم تُحفظ كنسخة كاملة لتعود إليها عند الحاجة
  const [docLog, setDocLog] = useState<PensionDocRecord[]>([]);
  const [showDocLog, setShowDocLog] = useState<boolean>(false);
  const restorePendingRef = useRef<PensionDocRecord | null>(null);
  useEffect(() => {
    setDocLog(listPensionDocs());
  }, []);

  const currentEmployee = useMemo(() => {
    return employees.find(e => e.id === empId) || employees[0];
  }, [employees, empId]);

  // مزامنة الموظف المختار: عند الفتح المباشر (رابط أو إعادة تشغيل) قبل تحميل السجل
  useEffect(() => {
    if (selectedEmpId && selectedEmpId !== empId) {
      setEmpId(selectedEmpId);
    } else if (!empId && employees.length > 0) {
      setEmpId(employees[0].id);
    }
  }, [selectedEmpId, employees]);

  const currentJob: Job | undefined = currentEmployee ? JOBS[currentEmployee.jobIdx] : undefined;

  // Generate N consecutive months going backwards from refMonth / refYear (N = monthsCount)
  // ignoreHistory: تجاهل الأجور المحفوظة سابقاً وإعادة الحساب آلياً من الراتب الحالي (زر إعادة الضبط)
  const generateInitialMonths = (emp: Employee, rMonth: number, rYear: number, count: number, ignoreHistory = false) => {
    const list: MonthItem[] = [];
    // قيمة نقطة وأجر استدلالي لكل شهر على حدة حسب سنته (الشبكة ونقطة السنة المعنية)
    const autoFor = (mm: number, yy: number) => {
      const ps = computePayslip(emp, mm, yy, settings);
      // الأجر الخاضع دون علاوة المردودية الشهرية — تُعرض المردودية في خانتها الخاصة (فصلية) وليست مدمجة مع الراتب
      const wageNoPerf = Math.max(0, Math.round(((ps.cnasBase || ps.gross || 0) - (ps.perfBonusTotal || 0)) * 100) / 100);
      return {
        wage: wageNoPerf > 0 ? wageNoPerf : 50000,
        yield: Math.round((ps.perfBonusTotal || 0) * 3 * 100) / 100
      };
    };

    // Check if employee has saved history records
    const histMap = new Map<string, number>();
    const histPerf = new Map<string, number>();
    (emp.pensionHistory || []).forEach(h => {
      if (h.key) {
        if (h.wage) histMap.set(h.key, Number(h.wage));
        if (h.perf !== undefined && h.perf !== null && h.perf !== '') histPerf.set(h.key, Number(h.perf));
      }
    });
    // مفاتيح السجلات مرتبة تصاعدياً — للشهر بلا سجل نعتمد أقرب سجل لاحق في نفس السنة
    // (الأجر مستمر من شهر لآخر حتى التغيير التالي، فلا يختلف ديسمبر عن نوفمبر مثلاً)
    const recKeys = Array.from(histMap.keys()).sort();
    const recPerfKeys = Array.from(histPerf.keys()).sort();
    const nearestLaterSameYear = (keys: string[], key: string): string | null => {
      const y = key.slice(0, 4);
      for (const k of keys) {
        if (k >= key && k.slice(0, 4) === y) return k;
      }
      return null;
    };

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(rYear, rMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = `${MONTHS_AR[m]} ${y}`;

      const auto = autoFor(m, y);
      const exactWage = ignoreHistory ? undefined : histMap.get(key);
      const nearWageKey = ignoreHistory ? null : nearestLaterSameYear(recKeys, key);
      const savedWage = exactWage !== undefined
        ? exactWage
        : (nearWageKey ? histMap.get(nearWageKey) : undefined);
      const finalSalary = savedWage !== undefined ? savedWage : auto.wage;

      // نهاية الفترة: الشهر الأخير (الأحدث) يستحق المردودية حتى لو كان الثلاثي ناقصاً (شهر واحد أو شهرين)
      const isEndMonth = i === 0 && !isYieldMonth(key);
      const exactPerf = ignoreHistory ? undefined : histPerf.get(key);
      const nearPerfKey = ignoreHistory ? null : nearestLaterSameYear(recPerfKeys, key);
      const savedPerf = exactPerf !== undefined
        ? exactPerf
        : (nearPerfKey !== null ? histPerf.get(nearPerfKey) : undefined);
      const yieldVal = isEndMonth
        ? (savedPerf && savedPerf > 0 ? savedPerf : auto.yield)
        : (savedPerf !== undefined
          ? savedPerf
          : (isYieldMonth(key) ? auto.yield : 0));

      list.push({
        key,
        label,
        salary: finalSalary,
        yieldVal
      });
    }

    return list;
  };

  // الموظف الذي حُمّلت برمجته — يمنع إعادة تعيين سطور البرمجة عند تغيير الفترة المرجعية
  const hydratedEmpRef = useRef<string>('');

  // Re-generate months when employee, reference date or months count changes
  useEffect(() => {
    if (!currentEmployee) return;

    // استرجاع وثيقة من السجل: نستهلك النسخة المعلّقة بدل إعادة التوليد
    const pendingRestore = restorePendingRef.current;
    if (pendingRestore) {
      restorePendingRef.current = null;
      if (pendingRestore.empId === currentEmployee.id) {
        hydratedEmpRef.current = currentEmployee.id;
        setMonthsData(pendingRestore.months.map(m => ({ ...m })));
        setSalaryRules((pendingRestore.salary || []).map(r => ({ ...EMPTY_SALARY_RULE, ...r })));
        setYieldRules((pendingRestore.yield || []).map(r => ({ from: '', to: '', amount: '', ...r })));
        return;
      }
    }

    const initial = generateInitialMonths(currentEmployee, refMonth, refYear, monthsCount);
    setMonthsData(initial);

    // سطور البرمجة تُحمّل مرة واحدة لكل موظف: من الحفظ المحلي أو من ملف الموظف
    if (hydratedEmpRef.current === currentEmployee.id) return;
    hydratedEmpRef.current = currentEmployee.id;

    const saved = loadPensionDraft(currentEmployee.id) || currentEmployee.pensionProgramming;
    if (
      saved &&
      Array.isArray(saved.salary) && saved.salary.length > 0 &&
      Array.isArray(saved.yield) && saved.yield.length > 0
    ) {
      const savedSalary = saved.salary.map(r => ({ ...EMPTY_SALARY_RULE, ...r }));
      while (savedSalary.length < 5) savedSalary.push({ ...EMPTY_SALARY_RULE });
      const savedYield = saved.yield.map(r => ({ from: '', to: '', amount: '', ...r }));
      while (savedYield.length < 5) savedYield.push({ from: '', to: '', amount: '' });
      setSalaryRules(savedSalary);
      setYieldRules(savedYield);
      return;
    }

    // Populate initial salary rule 1 from current employee state
    const firstMonth = initial[0]?.key || '';
    const lastMonth = initial[initial.length - 1]?.key || '';
    const basePayslip = computePayslip(currentEmployee, refMonth, refYear, settings);
    const initCatIdx = GRILLE.findIndex(g => g.cat === String(currentJob?.cat));
    const quarterlyYield = Math.round((basePayslip.perfBonusTotal || 0) * 3 * 100) / 100;
    const baseWageNoPerf = Math.max(0, Math.round(((basePayslip.cnasBase || 0) - (basePayslip.perfBonusTotal || 0)) * 100) / 100);
    setSalaryRules([
      {
        from: firstMonth,
        to: lastMonth,
        jobIdx: currentEmployee.jobIdx != null ? String(currentEmployee.jobIdx) : '',
        rank: currentJob?.name || '',
        catIdx: initCatIdx >= 0 ? String(initCatIdx) : '',
        grade: String(currentEmployee.echelon ?? ''),
        years: String(currentEmployee.yearsOverride ?? (currentEmployee.hireDate ? yearsOfService(currentEmployee.hireDate) : '')),
        wage: String(baseWageNoPerf),
        teacherType: currentEmployee.teacherType || 'عادي',
        yieldAmt: quarterlyYield > 0 ? String(quarterlyYield) : ''
      },
      { ...EMPTY_SALARY_RULE },
      { ...EMPTY_SALARY_RULE },
      { ...EMPTY_SALARY_RULE },
      { ...EMPTY_SALARY_RULE }
    ]);

    // Populate initial yield rule 1: مردودية 3 أشهر من كشف الراتب الحالي
    setYieldRules([
      {
        from: firstMonth,
        to: lastMonth,
        amount: quarterlyYield > 0 ? String(quarterlyYield) : ''
      },
      { from: '', to: '', amount: '' },
      { from: '', to: '', amount: '' },
      { from: '', to: '', amount: '' },
      { from: '', to: '', amount: '' }
    ]);
  }, [empId, refMonth, refYear, monthsCount, currentEmployee?.id]);

  // Build a temp employee from a salary rule + auto-compute wage (cnasBase) & quarterly rendement
  const autoForRule = (rule: PensionSalaryRule, emp: Employee): { wage: string; yld: string } | null => {
    const rawJob = String(rule.jobIdx ?? '').trim();
    if (rawJob === '') return null;
    const ji = Number(rawJob);
    const job = JOBS[ji];
    if (!job || !Number.isFinite(ji)) return null;
    const ci = Number(rule.catIdx);
    const tmp: Employee = {
      ...emp,
      jobIdx: ji,
      category: String(rule.catIdx).trim() !== '' && Number.isFinite(ci) && GRILLE[ci] ? ci : emp.category,
      echelon: Math.max(0, Math.min(12, Number(rule.grade) || 0)),
      // سنوات الخدمة المبرمجة: تحكم حساب العامل المهني غير المرسم (خبرة 1.4% سنوياً)
      yearsOverride: isProfessionalWorkerJob(job) && String(rule.years).trim() !== ''
        ? Number(rule.years)
        : emp.yearsOverride,
      teacherType: rule.teacherType
    };
    // مرجع الحساب = نهاية الفترة، وإلا بدايتها، وإلا الشهر المرجعي (قيمة النقطة تتغير حسب السنة)
    let m = refMonth;
    let y = refYear;
    const parseYm = (v?: string) => String(v || '').match(/^(\d{4})-(\d{2})$/);
    const mt = parseYm(rule.to) || parseYm(rule.from);
    if (mt) { y = Number(mt[1]); m = Number(mt[2]); }
    try {
      const p = computePayslip(tmp, m, y, settings);
      // الأجر الخاضع دون المردودية — تُبرمج المردودية الفصلية في حقلها الخاص (منفصلة عن الراتب)
      const w = Math.max(0, Math.round(((p.cnasBase || 0) - (p.perfBonusTotal || 0)) * 100) / 100);
      const q = Math.round((p.perfBonusTotal || 0) * 3 * 100) / 100;
      return { wage: String(w), yld: String(q) };
    } catch {
      return null;
    }
  };

  // حفظ فوري لسطور البرمجة حتى تبقى بعد إغلاق اللوحة أو تغيير التبويب
  const persistRules = (salary: PensionSalaryRule[], yld: PensionYieldRule[]) => {
    savePensionDraft(empId, { salary, yield: yld });
  };

  // Update a rule from dropdowns/period then auto-fill wage + quarterly rendement
  // (unless the value was edited manually — manual always wins)
  const updateRule = (idx: number, patch: Partial<PensionSalaryRule>, auto = false) => {
    setSalaryRules(prev => {
      const copy = [...prev];
      let next: PensionSalaryRule = { ...copy[idx], ...patch };

      if (patch.jobIdx !== undefined) {
        const raw = String(patch.jobIdx ?? '').trim();
        const job = raw === '' ? undefined : JOBS[Number(raw)];
        next.rank = job?.name || '';
        next.teacherType = 'عادي';
        if (job) {
          const ci = GRILLE.findIndex(g => g.cat === String(job.cat));
          if (ci >= 0) next.catIdx = String(ci);
        }
        // الدرجة: تُحفظ قيمة المستخدم، ويُملأ الافتراضي فقط إذا كانت فارغة
        if (String(next.grade).trim() === '' && currentEmployee) {
          next.grade = String(currentEmployee.echelon ?? 0);
        }
        // عند اختيار عامل مهني: تُملأ سنوات الخدمة آلياً إذا كانت فارغة
        if (job && isProfessionalWorkerJob(job) && currentEmployee && String(next.years).trim() === '') {
          next.years = String(currentEmployee.yearsOverride ?? (currentEmployee.hireDate ? yearsOfService(currentEmployee.hireDate) : ''));
        }
      }

      if (auto && currentEmployee) {
        const a = autoForRule(next, currentEmployee);
        if (a) {
          if (!next.wageManual) next.wage = a.wage;
          if (!next.yieldManual) next.yieldAmt = a.yld;
        }
      }

      copy[idx] = next;
      persistRules(copy, yieldRules);
      return copy;
    });
  };

  // Update a yield-only programming row
  const updateYieldRule = (idx: number, patch: Partial<PensionYieldRule>) => {
    setYieldRules(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      persistRules(salaryRules, copy);
      return copy;
    });
  };

  // إضافة سطر جديد لبرمجة الأجور
  const addSalaryRule = () => {
    setSalaryRules(prev => {
      const copy = [...prev, { ...EMPTY_SALARY_RULE }];
      persistRules(copy, yieldRules);
      return copy;
    });
  };

  // إضافة سطر جديد لبرمجة المردودية
  const addYieldRule = () => {
    setYieldRules(prev => {
      const copy = [...prev, { from: '', to: '', amount: '' }];
      persistRules(salaryRules, copy);
      return copy;
    });
  };

  // Apply salary + yield rules to the 60 months
  const applySalaryRules = () => {
    if (!monthsData.length) return;

    // تطبيع الفترات (من/إلى) — تُقبل الفترات المعكوسة بعد تصحيحها
    const range = (from: string, to: string): { from: string; to: string } | null => {
      const f = String(from || '').trim();
      const t = String(to || '').trim();
      if (!/^\d{4}-\d{2}$/.test(f) || !/^\d{4}-\d{2}$/.test(t)) {
        // إذا وُجد طرف واحد فقط نعتبر الشهر الآخر حداً مفتوحاً
        if (/^\d{4}-\d{2}$/.test(f)) return { from: f, to: '9999-12' };
        if (/^\d{4}-\d{2}$/.test(t)) return { from: '0000-01', to: t };
        return null;
      }
      return f <= t ? { from: f, to: t } : { from: t, to: f };
    };

    // نهاية الفترة: الشهر الأخير (الأحدث) يستحق المردودية حتى لو كان الثلاثي ناقصاً
    const lastMonthKey = monthsData[monthsData.length - 1]?.key || '';
    const isYieldDue = (key: string) => isYieldMonth(key) || key === lastMonthKey;

    const updated = monthsData.map(m => {
      let salary = m.salary;
      for (const rule of salaryRules) {
        const r = range(rule.from, rule.to);
        const w = Number(rule.wage);
        if (r && isFinite(w) && String(rule.wage).trim() !== '' && m.key >= r.from && m.key <= r.to) {
          salary = w;
        }
      }

      // المردودية من برمجة الراتب: تُطبق أولاً على أشهر مارس/جوان/سبتمبر/ديسمبر داخل الفترة (وعلى الشهر الأخير مهما كان)
      let yieldVal = m.yieldVal;
      for (const rule of salaryRules) {
        const r = range(rule.from, rule.to);
        const q = Number(rule.yieldAmt);
        if (r && isYieldDue(m.key) && String(rule.yieldAmt).trim() !== '' && isFinite(q) && m.key >= r.from && m.key <= r.to) {
          yieldVal = q;
        }
      }
      // سطور المردودية اليدوية تتجاوز القيم الآلية
      for (const rule of yieldRules) {
        const r = range(rule.from, rule.to);
        const a = Number(rule.amount);
        if (r && isYieldDue(m.key) && String(rule.amount).trim() !== '' && isFinite(a) && m.key >= r.from && m.key <= r.to) {
          yieldVal = a;
        }
      }

      return { ...m, salary, yieldVal };
    });

    setMonthsData(updated);

    // Save history records into employee profile + keep the programming itself
    if (currentEmployee) {
      const newHistory = updated.map(m => ({
        key: m.key,
        wage: m.salary,
        perf: m.yieldVal || 0,
        note: 'مبرمج من كشف التقاعد'
      }));
      onUpdateEmployee({
        ...currentEmployee,
        pensionHistory: newHistory,
        pensionProgramming: { salary: salaryRules, yield: yieldRules }
      });
      // تسجيل الوثيقة تلقائياً في السجل بعد كل «حفظ وتطبيق»
      upsertPensionDoc(buildDocRecord(updated));
      setDocLog(listPensionDocs());
    }

    persistRules(salaryRules, yieldRules);
    triggerToast(`تم تطبيق وحفظ الأجور والمردودية على الـ ${monthsCount} شهراً بنجاح ✓`);
    setShowConfigPanel(false);
  };

  // Edit a single month's quarterly rendement from the back-face trimester rows
  const handleYieldCellChange = (key: string, val: number) => {
    setMonthsData(prev => prev.map(m => (m.key === key ? { ...m, yieldVal: val } : m)));
  };

  // تعديل يدوي مباشر لأجر شهر من جدول الوجه الخلفي — المجاميع والمعدل تُعاد آلياً لحظياً
  const handleSalaryCellChange = (key: string, val: number) => {
    setMonthsData(prev => prev.map(m => (m.key === key ? { ...m, salary: val } : m)));
  };

  /* =====================================================================
     سجل الوثائق — بناء النسخة، التسجيل، الفتح (الاسترجاع) والحذف
     ===================================================================== */
  const buildDocRecord = (months: MonthItem[]): PensionDocRecord => {
    const first = months[0];
    const last = months[months.length - 1];
    const count = Math.min(60, Math.max(12, monthsCount || months.length));
    return {
      id: `${empId}__${count}__${first?.key || ''}__${last?.key || ''}`,
      empId,
      empName: currentEmployee?.name || '',
      refMonth,
      refYear,
      monthsCount: count,
      createdAt: new Date().toISOString(),
      months: months.map(m => ({ key: m.key, label: m.label, salary: m.salary, yieldVal: m.yieldVal })),
      salary: salaryRules,
      yield: yieldRules
    };
  };

  // تسجيل الوثيقة الحالية في السجل (يدوي)
  const saveDocToLog = () => {
    if (!currentEmployee || !monthsData.length) return;
    upsertPensionDoc(buildDocRecord(monthsData));
    setDocLog(listPensionDocs());
    triggerToast('تم تسجيل الوثيقة في السجل ✓ يمكنك العودة إليها لاحقاً');
  };

  // فتح وثيقة من السجل: إن كان السياق مطابقاً نطبّق مباشرة، وإلا نعلّق النسخة لتستهلكها دورة التوليد
  const openDocFromLog = (rec: PensionDocRecord) => {
    const count = Math.min(60, Math.max(12, rec.monthsCount || 60));
    const applyRec = () => {
      hydratedEmpRef.current = rec.empId;
      setMonthsData(rec.months.map(m => ({ ...m })));
      setSalaryRules((rec.salary || []).map(r => ({ ...EMPTY_SALARY_RULE, ...r })));
      setYieldRules((rec.yield || []).map(r => ({ from: '', to: '', amount: '', ...r })));
    };
    const sameContext = rec.empId === empId && rec.refMonth === refMonth && rec.refYear === refYear && count === monthsCount;
    if (sameContext) {
      applyRec();
    } else {
      restorePendingRef.current = rec;
      setEmpId(rec.empId);
      setRefMonth(rec.refMonth);
      setRefYear(rec.refYear);
      setMonthsCount(count);
    }
    triggerToast(`تم فتح وثيقة ${rec.empName || 'الموظف'} من السجل ✓`);
  };

  // حذف وثيقة من السجل
  const removeDocFromLog = (id: string) => {
    deletePensionDoc(id);
    setDocLog(listPensionDocs());
    triggerToast('تم حذف الوثيقة من السجل');
  };

  // عدد كتل الـ 12 شهراً في الوثيقة (قد تكون الكتلة الأخيرة الأقدم ناقصة)
  const pensionBlocksCount = Math.max(1, Math.ceil(monthsData.length / 12));

  // Block Totals (كتل من 12 شهراً) — تشمل المردودية، وتُحسب من التعديلات اليدوية لحظياً
  const blockTotals = useMemo(() => {
    const totals: number[] = Array.from({ length: pensionBlocksCount }, () => 0);
    monthsData.forEach((m, idx) => {
      const b = Math.floor(idx / 12);
      if (b >= 0 && b < pensionBlocksCount) {
        totals[b] += (Number(m.salary) || 0) + (Number(m.yieldVal) || 0);
      }
    });
    return totals;
  }, [monthsData, pensionBlocksCount]);

  const grandTotal = useMemo(() => {
    return blockTotals.reduce((acc, curr) => acc + curr, 0);
  }, [blockTotals]);

  const averageMonthlySalary = useMemo(() => {
    return monthsData.length > 0 ? Math.round((grandTotal / monthsData.length) * 100) / 100 : 0;
  }, [grandTotal, monthsData]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Download PDF file function — يلتقط الوجهين المعروضين بحجمهما الطبيعي دون تغيير تصميم الوثيقة
  const handleDownload = async () => {
    if (exportingPdf) return;
    const pick = (id: string): HTMLElement | null => {
      const el = document.getElementById(id);
      if (!el) return null;
      return (el.closest('.afs-inner') as HTMLElement) || el;
    };
    const els = [pick('cnr-front-wrapper'), pick('cnr-back-wrapper')]
      .filter((el): el is HTMLElement => !!el && el.offsetWidth > 0);
    if (els.length === 0) return;

    setExportingPdf(true);
    try {
      await exportElementsToPdf(els, `شهادة_الأجور_CNR_${currentEmployee?.name || 'موظف'}.pdf`);
      triggerToast('تم تحميل شهادة الأجور بصيغة PDF جاهزة للحفظ والطباعة');
    } catch (err) {
      console.error(err);
      triggerToast('تعذر توليد ملف PDF، يرجى المحاولة مرة أخرى');
    } finally {
      setExportingPdf(false);
    }
  };

  if (!currentEmployee) {
    return (
      <div className="py-12 text-center text-[#64748b]">
        يرجى اختيار أو تسجيل موظف أولاً لعرض وثائق التقاعد.
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-2 sm:px-6">
      {/* Dynamic @page size depending on the active face */}
      <style>{`@page { size: ${activeFace === 'back' ? '297mm 210mm' : '210mm 297mm'}; margin: 0; }`}</style>

      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#047857] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm animate-in fade-in">
          <FileCheck className="w-5 h-5 text-amber-300" />
          <span>{toast}</span>
        </div>
      )}

      {/* Control & Selection Bar (No-Print) */}
      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-1">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>الصندوق الوطني للتقاعد (C.N.R) — النموذج الرسمي مطابق طبق الأصل</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f172a]">
              شهادة الأجور للتقاعد (الوجه الأمامي والخلفي — {monthsCount} شهراً)
            </h2>
            <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
              وثيقة رسمية مبرمجة لحساب وتحديد أجور الـ {monthsCount} شهراً المعتمدة كأساس لتصفية منحة أو معاش التقاعد — عدّل عدد الأشهر أو الأجور مباشرة في الجدول وسيُحسب المجموع والمتوسط آلياً.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="bg-[#2c4e80] hover:bg-[#203a60] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Settings2 className="w-4 h-4" />
              <span>{showConfigPanel ? 'إخفاء لوحة البرمجة' : '⚙ ضبط وبرمجة الأجور والمردودية'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الوثيقة</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={exportingPdf}
              className="bg-[#fff] hover:bg-[#f6f2e8] text-[#047857] border border-[#047857] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? 'جاري التوليد...' : 'تحميل (PDF)'}</span>
            </button>
          </div>
        </div>

        {/* Filters and Face Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">الموظف المعني بالتقاعد</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#0f172a] focus:outline-none focus:border-[#047857]"
            >
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} — ({JOBS[e.jobIdx]?.name || 'موظف'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">
              عدد الأشهر (12 — 60): <span className="font-mono text-[#047857]">{monthsCount}</span>
            </label>
            <input
              type="number"
              min={12}
              max={60}
              value={monthsCount}
              onChange={e => {
                const n = Math.min(60, Math.max(12, Number(e.target.value) || 60));
                setMonthsCount(n);
              }}
              className="w-full bg-amber-50 border-2 border-amber-400 rounded-xl px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#b45309] focus:outline-none focus:border-[#b45309]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">الشهر المرجعي الأخير (نهاية فترة الـ {monthsCount} شهراً)</label>
            <select
              value={refMonth}
              onChange={e => setRefMonth(Number(e.target.value))}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
            >
              {Object.entries(MONTHS_AR).map(([m, name]) => (
                <option key={m} value={m}>
                  {name} ({m})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">السنة المرجعية</label>
            <input
              type="number"
              value={refYear}
              onChange={e => setRefYear(Number(e.target.value) || new Date().getFullYear())}
              className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e293b] mb-1">عرض الصفحات</label>
            <div className="flex rounded-xl bg-[#e2e8f0] p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveFace('both')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFace === 'both' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#475569]'
                }`}
              >
                الوجهان معاً
              </button>
              <button
                type="button"
                onClick={() => setActiveFace('front')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFace === 'front' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#475569]'
                }`}
              >
                الوجه الأول
              </button>
              <button
                type="button"
                onClick={() => setActiveFace('back')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  activeFace === 'back' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#475569]'
                }`}
              >
                الوجه الثاني ({monthsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Programming & Configuration Dropdown Panel */}
        {showConfigPanel && (
          <div className="mt-5 pt-5 border-t border-[#e2e8f0] bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-[#d8cfb9] animate-in fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-black text-[#047857] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>برمجة فترات الأجور وتطور الراتب عبر فترات متعددة (أضف سطوراً حسب الحاجة)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const regenerated = generateInitialMonths(currentEmployee, refMonth, refYear, monthsCount, true);
                  setMonthsData(regenerated);
                  // حفظ فوري في ملف الموظف حتى لا تُفقد القيم المعاد ضبطها عند تغيير التبويب
                  onUpdateEmployee({
                    ...currentEmployee,
                    pensionHistory: regenerated.map(m => ({
                      key: m.key,
                      wage: m.salary,
                      perf: m.yieldVal || 0,
                      note: 'مبرمج من كشف التقاعد'
                    }))
                  });
                  triggerToast('تمت إعادة الضبط الآلي لجميع الأشهر من الراتب الحالي وحفظها');
                }}
                className="text-xs bg-[#e9f2ec] hover:bg-[#d5ebd9] text-[#047857] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <span>⚙ إعادة الضبط الآلي من الراتب الحالي</span>
              </button>
            </div>

            <p className="text-xs text-[#64748b] mb-4">
              حدد فترات الترقية أو تغير الراتب (من شهر/سنة إلى شهر/سنة) ومبلغ الراتب الخاضع للاشتراك لكل فترة، وسيتم تطبيقها فوراً على جدول الـ {monthsCount} شهراً وحساب المجاميع. حقل <b>سنوات الخدمة</b> مخصص <b>للعمال المهنيين غير المرسمين</b>: يُملأَ آلياً عند اختيار الرتبة، وكل تغيير فيه يعيد حساب الأجر الخاضع والمردودية آلياً (خبرة 1.4% من الأجر عن كل سنة خدمة) بدل الدرجة.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#0f172a] border-b border-[#e2e8f0]">
                    <th className="p-2.5">الفترة من (شهر/سنة)</th>
                    <th className="p-2.5">إلى (شهر/سنة)</th>
                    <th className="p-2.5">الرتبة (قائمة) + الصنف</th>
                    <th className="p-2.5">الدرجة</th>
                    <th className="p-2.5">سنوات الخدمة</th>
                    <th className="p-2.5">الأجر الخاضع (دج) — آلي/يدوي</th>
                    <th className="p-2.5">مردودية فصلية (دج) — آلي/يدوي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {salaryRules.map((rule, idx) => {
                    const ruleJob = JOBS[Number(rule.jobIdx)];
                    const showType = !!ruleJob && ruleJob.domain === 'teach' && MAJAZ_CODES.includes(Number(ruleJob.code));
                    return (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.from}
                          onChange={e => updateRule(idx, { from: e.target.value }, true)}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.to}
                          onChange={e => updateRule(idx, { to: e.target.value }, true)}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2 min-w-[220px]">
                        <select
                          value={rule.jobIdx}
                          onChange={e => updateRule(idx, { jobIdx: e.target.value }, true)}
                          className="w-full bg-[#f8fafc] border border-[#047857] rounded-lg px-2 py-1 text-xs font-bold text-[#0f172a] focus:outline-none"
                        >
                          <option value="">— اختر الرتبة —</option>
                          {[
                            { id: 'teach', label: 'سلك التعليم — الأساتذة' },
                            { id: 'edu', label: 'سلك التربية والإدارة' },
                            { id: 'eco', label: 'المصالح الاقتصادية' },
                            { id: 'lab', label: 'المخابر' },
                            { id: 'other', label: 'الأسلاك المشتركة' },
                            { id: 'workers', label: 'العمال المهنيون' }
                          ].map(g => {
                            const items = JOBS.map((j, i) => ({ j, i })).filter(({ j }) => {
                              if (isProfessionalWorkerJob(j)) return g.id === 'workers';
                              return (j.domain || 'other') === g.id;
                            });
                            if (!items.length) return null;
                            return (
                              <optgroup key={g.id} label={g.label}>
                                {items.map(({ j, i }) => (
                                  <option key={i} value={i}>{j.name} — (صنف {j.cat})</option>
                                ))}
                              </optgroup>
                            );
                          })}
                        </select>
                        {showType && (
                          <select
                            value={rule.teacherType}
                            onChange={e => updateRule(idx, { teacherType: e.target.value as 'عادي' | 'مجاز' }, true)}
                            className="w-full mt-1 bg-amber-50 border border-amber-400 rounded-lg px-2 py-1 text-xs font-bold text-amber-900 focus:outline-none"
                          >
                            <option value="عادي">أستاذ عادي</option>
                            <option value="مجاز">أستاذ مجاز (--)</option>
                          </select>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <select
                            value={rule.catIdx}
                            onChange={e => updateRule(idx, { catIdx: e.target.value }, true)}
                            className="flex-1 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-1 py-1 text-center text-xs font-bold"
                            title="الصنف"
                          >
                            <option value="">صنف</option>
                            {GRILLE.map((gc, ci) => (
                              <option key={ci} value={ci}>{gc.cat}</option>
                            ))}
                          </select>
                          <select
                            value={rule.grade}
                            onChange={e => updateRule(idx, { grade: e.target.value }, true)}
                            className="flex-1 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-1 py-1 text-center text-xs font-bold"
                            title="الدرجة"
                          >
                            <option value="">درجة</option>
                            {Array.from({ length: 13 }, (_, d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          max={45}
                          placeholder="سنوات"
                          value={rule.years}
                          onChange={e => updateRule(idx, { years: e.target.value }, true)}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 text-center text-xs font-bold"
                          title="سنوات الخدمة — تعمل للعمال المهنيين غير المرسمين (خبرة 1.4% من الأجر سنوياً)"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="الأجر الخاضع"
                          value={rule.wage}
                          onChange={e => {
                            const v = e.target.value;
                            updateRule(idx, { wage: v, wageManual: v.trim() !== '' }, v.trim() === '');
                          }}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono font-bold text-center text-[#047857]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="مردودية فصلية"
                          value={rule.yieldAmt}
                          onChange={e => {
                            const v = e.target.value;
                            updateRule(idx, { yieldAmt: v, yieldManual: v.trim() !== '' }, v.trim() === '');
                          }}
                          className="w-full bg-amber-50/60 border border-amber-300 rounded-lg px-2 py-1 font-mono font-bold text-center text-[#b45309]"
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={addSalaryRule}
                className="text-xs bg-[#e9f2ec] hover:bg-[#d5ebd9] text-[#047857] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-[#a7f3d0] transition-colors"
              >
                <span>➕ إضافة سطر جديد (فترة أجر)</span>
              </button>
            </div>

            {/* ===== جدول برمجة علاوة المردودية ===== */}
            <div className="flex items-center justify-between mb-3 mt-6">
              <div className="text-sm font-black text-[#b45309] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>برمجة علاوة المردودية — تدفع بعد مارس، جوان، سبتمبر وديسمبر (نهاية كل ثلاثي)</span>
              </div>
            </div>

            <p className="text-xs text-[#64748b] mb-4">
              تُضاف المردودية تلقائياً لأشهر <b>مارس، جوان، سبتمبر وديسمبر</b> من كل سنة داخل الفترة المحددة (نهاية كل ثلاثي)، ويُعرض المبلغ في خانة الشهر مضافاً إلى الأجر الخاضع للاشتراك، مع احتسابه في المجاميع والمعدل العام. اترك المبلغ فارغاً ليعتمد القيمة الآلية من برمجة الراتب أعلاه.
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#fde68a] bg-white">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-[#fffbeb] text-[#92400e] border-b border-[#fde68a]">
                    <th className="p-2.5">الفترة من (شهر/سنة)</th>
                    <th className="p-2.5">إلى (شهر/سنة)</th>
                    <th className="p-2.5">مبلغ المردودية الفصلي (دج) — كل 3 أشهر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#fef3c7]">
                  {yieldRules.map((rule, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.from}
                          onChange={e => updateYieldRule(idx, { from: e.target.value })}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="month"
                          value={rule.to}
                          onChange={e => updateYieldRule(idx, { to: e.target.value })}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono text-center"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="مبلغ المردودية الفصلي"
                          value={rule.amount}
                          onChange={e => updateYieldRule(idx, { amount: e.target.value })}
                          className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 font-mono font-bold text-center text-[#b45309]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={addYieldRule}
                className="text-xs bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-[#fde68a] transition-colors"
              >
                <span>➕ إضافة سطر جديد (مردودية)</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={applySalaryRules}
                className="bg-[#047857] hover:bg-[#065f46] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق البرمجة (الأجور + المردودية) على الـ {monthsCount} شهراً</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* DOCUMENT PREVIEW & PRINT SECTION (نسخة مطابقة طبق الأصل)  */}
      {/* ======================================================== */}
      <div className="space-y-8">
        {(activeFace === 'both' || activeFace === 'front') && (
          <div className="flex justify-center pb-4 print:break-after-page">
            <AutoFitScale docWidth={794}>
              <div id="cnr-front-wrapper">
                <CNRFront employee={currentEmployee} settings={settings} monthsCount={monthsData.length} />
              </div>
            </AutoFitScale>
          </div>
        )}

        {(activeFace === 'both' || activeFace === 'back') && (
          <div className="flex justify-center pb-4">
            {/* قيد عرض الحاوية على نفس عرض الوجه الأمامي (794px) لتتساوى ورقتا الوثيقة المزدوجة وتتمركزان على نفس المحور */}
            <div className="w-full max-w-[794px]">
              <AutoFitScale docWidth={1123}>
                <div id="cnr-back-wrapper">
                  <CNRBack
                    employee={currentEmployee}
                    settings={settings}
                    monthsData={monthsData}
                    blockTotals={blockTotals}
                    grandTotal={grandTotal}
                    average={averageMonthlySalary}
                    monthsCount={monthsData.length}
                    blocksCount={pensionBlocksCount}
                    onYieldChange={handleYieldCellChange}
                    onSalaryChange={handleSalaryCellChange}
                  />
                </div>
              </AutoFitScale>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* سجل الوثائق المحفوظة — تحت الوثيقة (لا يُطبع)             */}
      {/* ======================================================== */}
      <div className="max-w-[1123px] mx-auto mt-2 print:hidden">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-700">
              <FileCheck size={16} className="text-emerald-700" />
              <span>سجل الوثائق المحفوظة ({docLog.length})</span>
              <span className="text-[11px] font-normal text-slate-500">— كل وثيقة تعمل عليها تُسجَّل هنا لتعود إليها عند الحاجة</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={saveDocToLog}
                disabled={!monthsData.length}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition-colors"
              >
                💾 تسجيل الوثيقة الحالية
              </button>
              <button
                onClick={() => setShowDocLog(v => !v)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
              >
                {showDocLog ? 'إخفاء القائمة ▲' : 'عرض القائمة ▼'}
              </button>
            </div>
          </div>
          {showDocLog && (
            <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
              {docLog.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  لا توجد وثائق مسجَّلة بعد — اضغط «تسجيل الوثيقة الحالية» أو استعمل «حفظ وتطبيق» في لوحة البرمجة
                </div>
              )}
              {docLog.map(rec => {
                const d = new Date(rec.createdAt);
                const dateStr = isNaN(d.getTime())
                  ? ''
                  : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                const firstLbl = rec.months[0]?.label || rec.months[0]?.key || '';
                const lastLbl = rec.months[rec.months.length - 1]?.label || rec.months[rec.months.length - 1]?.key || '';
                return (
                  <div key={rec.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold text-slate-700">{rec.empName}</span>
                      <span className="text-slate-500">{rec.monthsCount} شهراً — من {firstLbl} إلى {lastLbl}</span>
                      <span className="text-[11px] text-slate-400" dir="ltr">{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDocFromLog(rec)}
                        className="px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors"
                      >
                        ↩ فتح
                      </button>
                      <button
                        onClick={() => removeDocFromLog(rec.id)}
                        className="px-3 py-1 rounded-md bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors"
                      >
                        🗑 حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================================================================ */
/* CNR FRONT FACE — نسخة مطابقة تماماً للنموذج الرسمي               */
/* ================================================================ */

const DateBox3: React.FC<{ d: { day: string; month: string; year: string } }> = ({ d }) => (
  <span className="cnrf-db">
    <i className="day" contentEditable suppressContentEditableWarning>{d.day}</i>
    <i className="month" contentEditable suppressContentEditableWarning>{d.month}</i>
    <i className="year" contentEditable suppressContentEditableWarning>{d.year}</i>
  </span>
);

const CNRFront: React.FC<{ employee: Employee; settings: Settings; monthsCount?: number }> = ({ employee, settings, monthsCount = 60 }) => {
  const job = JOBS[employee.jobIdx];
  const { lastName, firstName } = splitName(employee.name);
  const dob = parseDate(employee.birthDate);
  const startDate = parseDate(employee.hireDate);
  const endDate = parseDate(employee.lastWorkDate);

  const quality = getClassificationCategory(String(GRILLE[employee.category]?.cat ?? ''));

  const Chk: React.FC<{ q: string }> = ({ q }) => (
    <span
      className="cnrf-chk"
      onClick={e => {
        const el = e.currentTarget;
        el.textContent = el.textContent ? '' : '✕';
      }}
    >
      {quality === q ? '✕' : ''}
    </span>
  );

  return (
    <div className="cnr-front-root">
      <style>{`
        .cnrf-page * { box-sizing: border-box; }
        .cnrf-page {
          width: 210mm;
          height: 297mm;
          background: #fff;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          margin: 0 auto;
          font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 10.5pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          .cnrf-page { box-shadow: none !important; height: 296mm; overflow: hidden; }
        }
        .cnrf-page .ar { font-family: 'Traditional Arabic', 'Arabic Typesetting', 'Noto Naskh Arabic', 'Segoe UI', serif; direction: rtl; unicode-bidi: isolate; }
        .cnrf-page .fr { direction: ltr; unicode-bidi: isolate; }
        .cnrf-page p { margin: 0; }
        .cnrf-page .red { color: #c0392b; }
        .cnrf-page .cnrf-fill {
          display: inline-block;
          min-width: 1.1in;
          border-bottom: 1px dotted #000;
          min-height: 1em;
          text-align: center;
          unicode-bidi: plaintext;
          padding: 0 2mm;
        }
        .cnrf-page .cnrf-fill[contenteditable]:focus,
        .cnrf-page .cnrf-mbox[contenteditable]:focus,
        .cnrf-page .cnrf-db i[contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .cnrf-page .cnrf-head { display: flex; align-items: flex-start; margin-bottom: 3mm; width: 100%; }
        .cnrf-page .cnrf-head-logo { flex: 0 0 28mm; }
        .cnrf-page .cnrf-logo-img { width: 26mm; height: 26mm; object-fit: contain; }
        .cnrf-page .cnrf-head-content { flex: 1; display: flex; flex-direction: column; }
        .cnrf-page .cnrf-head-title { font-size: 21pt; font-weight: 700; color: #1e3fae; text-align: center; letter-spacing: 1.5px; margin-bottom: 2mm; }
        .cnrf-page .cnrf-head-agency { text-align: right; color: #1e3fae; font-size: 12pt; font-weight: 700; padding-right: 4mm; }

        .cnrf-page .cnrf-title { text-align: center; margin: 1mm 0; display: block; }
        .cnrf-page .cnrf-title .a { font-size: 16pt; font-weight: 700; color: #000; letter-spacing: 1px; }
        .cnrf-page .cnrf-title .f { font-size: 14pt; font-weight: 700; letter-spacing: .5px; color: #000; }
        .cnrf-page .cnrf-subtitle { text-align: center; font-size: 8.5pt; margin-bottom: 3mm; line-height: 1.3; color: #000; display: block; }

        .cnrf-page .cnrf-box {
          border: 1.6px solid #1e3fae;
          padding: 3mm 4mm;
          margin-bottom: 3.5mm;
          line-height: 2.1;
          font-size: 10.5pt;
          display: block;
          clear: both;
          width: 100%;
        }
        .cnrf-page .cnrf-box .cnrf-hint { font-size: 8.5pt; color: #000; }

        .cnrf-page .cnrf-frow { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1mm; }
        .cnrf-page .cnrf-frow .cnrf-grow { flex: 1; display: flex; align-items: baseline; gap: 2mm; }
        .cnrf-page .cnrf-frow .cnrf-grow .cnrf-fill { flex: 1; }
        .cnrf-page .cnrf-side-box { display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 9pt; font-weight: 700; color: #000; line-height: 1.2; }

        .cnrf-page .cnrf-mbox {
          display: inline-block;
          min-width: 1.6in;
          min-height: 6.5mm;
          border: 1.5px solid #000;
          text-align: center;
          unicode-bidi: plaintext;
          padding: 1mm 2mm;
          vertical-align: middle;
          background: #fff;
        }

        .cnrf-page .cnrf-db { display: inline-flex; direction: rtl; gap: 0.8mm; vertical-align: middle; margin: 0 1.5mm; }
        .cnrf-page .cnrf-db i {
          height: 6mm;
          border: 1.2px solid #000;
          border-top: none;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-style: normal;
          font-size: 9.5pt;
          background: #fff;
          text-align: center;
        }
        .cnrf-page .cnrf-db i::before,
        .cnrf-page .cnrf-db i::after {
          content: '';
          position: absolute;
          top: 0;
          height: 52%;
          width: 2.5px;
          background: #fff;
        }
        .cnrf-page .cnrf-db i::before { left: -1.8px; }
        .cnrf-page .cnrf-db i::after { right: -1.8px; }
        .cnrf-page .cnrf-db i.day, .cnrf-page .cnrf-db i.month { width: 8mm; }
        .cnrf-page .cnrf-db i.year { width: 16mm; }

        .cnrf-page .cnrf-qrow { display: flex; justify-content: space-between; align-items: center; margin: 2mm 0 1mm; }
        .cnrf-page .cnrf-q { display: flex; align-items: center; gap: 1.5mm; font-size: 10pt; font-weight: 700; }
        .cnrf-page .cnrf-chk {
          width: 4.2mm;
          height: 4.2mm;
          border: 1.4px solid #000;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10pt;
          line-height: 1;
          cursor: pointer;
          background: #fff;
        }
        .cnrf-page .cnrf-para { font-size: 9.5pt; text-align: justify; margin-top: 2mm; font-weight: 700; line-height: 1.35; }

        .cnrf-page .cnrf-notes {
          border: 1.5px solid #000;
          padding: 2.5mm 4mm;
          margin-bottom: 3mm;
          display: block;
          clear: both;
          width: 100%;
        }
        .cnrf-page .cnrf-notes h4 { text-align: center; margin: 1.5mm 0 1mm; font-size: 11pt; font-weight: 700; color: #000; }
        .cnrf-page .cnrf-notes p { font-size: 8.8pt; text-align: justify; line-height: 1.4; font-weight: 700; margin-bottom: 1.5mm; }

        .cnrf-page .cnrf-foot { font-size: 7.5pt; color: #000; text-align: left; margin-top: 2mm; display: block; clear: both; }
      `}</style>

      <div className="cnrf-page" id="cnr-front-document">
        {/* Header Section */}
        <div className="cnrf-head">
          <div className="cnrf-head-logo">
            <img className="cnrf-logo-img" src={CNR_LOGO} alt="CNR" />
          </div>
          <div className="cnrf-head-content">
            <div className="cnrf-head-title ar">الــصــنــــدوق الــوطـنـــي لــلــتــقــــاعــــد</div>
            <div className="cnrf-head-agency ar">
              وكالة ولاية : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.8in' }}>{settings.cnasAgency || ''}</span>
            </div>
          </div>
        </div>

        {/* Document Titles */}
        <div className="cnrf-title">
          <p className="ar a">شـــــهـــــادة الأجـــــــور</p>
          <p className="fr f">ATTESTATION DE SALAIRE</p>
        </div>
        <div className="cnrf-subtitle">
          <p className="ar">(شهادة معدة من طرف المستخدم لتحديد الأجور المعتمدة كأساس لحساب التقاعد)</p>
          <p className="fr">(A établir par l'employeur pour certifier les salaires soumis à cotisation de sécurité sociale)</p>
        </div>

        {/* ===== French Box ===== */}
        <div className="cnrf-box fr">
          <div className="cnrf-frow">
            <div className="cnrf-grow">L'employeur : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '2.8in' }}>{settings.signatory || settings.director || ''}</span></div>
            <div className="cnrf-side-box">
              <span>N° S.S EMPLOYEUR</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{settings.cnasNum || ''}</span>
            </div>
          </div>
          <div className="cnrf-frow" style={{ marginTop: '1mm' }}>
            <div className="cnrf-grow">Atteste que : <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{lastName}</span> <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{firstName}</span></div>
            <div className="cnrf-side-box">
              <span>N° A.S ASSURÉ</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{employee.ssn || ''}</span>
            </div>
          </div>
          <p style={{ marginTop: '1.5mm' }}>Né(e) le : <DateBox3 d={dob} />
            &nbsp;&nbsp; Wilaya de : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.8in' }}>{settings.wilaya || ''}</span></p>
          <p style={{ marginTop: '1.5mm' }}>A fait partie de l'entreprise du : <DateBox3 d={startDate} />
            &nbsp;&nbsp; Au : <DateBox3 d={endDate} /></p>
          <div className="cnrf-frow" style={{ marginTop: '1.5mm' }}>
            <div className="cnrf-grow">En qualité de : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '2.2in' }}>{job?.name || ''}</span></div>
            <span className="cnrf-hint">(Mettre une croix dans la case correspondante)</span>
          </div>
          <div className="cnrf-qrow">
            <span className="cnrf-q">Agent d'Execution <Chk q="exec" /></span>
            <span className="cnrf-q">Cadre Moyen <Chk q="moyen" /></span>
            <span className="cnrf-q">Cadre Supérieur <Chk q="sup" /></span>
            <span className="cnrf-q">Cadre Dirigeant <Chk q="dir" /></span>
          </div>
          <p className="cnrf-para">A perçu à la date d'enregistrement de sa demande, les salaires mensuels soumis à retenue de la sécurité sociale durant les ({monthsCount}) derniers mois tels que mentionnés au verso de la présente attestation.</p>
        </div>

        {/* ===== Arabic Box ===== */}
        <div className="cnrf-box ar">
          <div className="cnrf-frow">
            <div className="cnrf-grow">أنا المستخدم الموقع أدناه : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '2.8in' }}>{settings.signatory || settings.director || ''}</span></div>
            <div className="cnrf-side-box">
              <span>رقم صاحب العمل المنتسب</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{settings.cnasNum || ''}</span>
            </div>
          </div>
          <div className="cnrf-frow" style={{ marginTop: '1mm' }}>
            <div className="cnrf-grow">أشهد بأن السيد(ة) : <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{lastName}</span> <span className="cnrf-fill" contentEditable suppressContentEditableWarning>{firstName}</span></div>
            <div className="cnrf-side-box">
              <span>رقم الضمان الاجتماعي للمؤمن</span>
              <span className="cnrf-mbox" contentEditable suppressContentEditableWarning>{employee.ssn || ''}</span>
            </div>
          </div>
          <p style={{ marginTop: '1.5mm' }}>المولود(ة) بتاريخ : <DateBox3 d={dob} />
            &nbsp; في : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.5in' }}>{employee.birthPlace || ''}</span>
            &nbsp; ولاية : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '1.2in' }}>{settings.wilaya || ''}</span></p>
          <p style={{ marginTop: '1.5mm' }}>(ت) يعد من مستخدمي المؤسسة إبتداء من : <DateBox3 d={startDate} />
            &nbsp; إلى : <DateBox3 d={endDate} /></p>
          <p style={{ marginTop: '1.5mm' }}>بصفته(ها) : <span className="cnrf-fill" contentEditable suppressContentEditableWarning style={{ minWidth: '3.5in' }}>{job?.name || ''}</span></p>
          <p className="cnrf-hint" style={{ textAlign: 'center', marginTop: '1mm' }}>(ضع علامة على الخانة المناسبة)</p>
          <div className="cnrf-qrow">
            <span className="cnrf-q">عون تنفيذ <Chk q="exec" /></span>
            <span className="cnrf-q">إطار <Chk q="moyen" /></span>
            <span className="cnrf-q">إطار سامي <Chk q="sup" /></span>
            <span className="cnrf-q">إطار مسير <Chk q="dir" /></span>
          </div>
          <p className="cnrf-para">قد استفاد(ت) عند تاريخ تسجيل طلبه (ها) من الأجور الشهرية الخاضعة لإشتراكات الضمان الإجتماعي العائدة الى ({monthsCount}) شهراً الأخيرة وذلك حسب ما هو مشار إليه على ظهر هذه الشهادة.</p>
        </div>

        {/* ===== Legal Notes ===== */}
        <div className="cnrf-notes">
          <h4 className="ar">——— نصائح مهمة ———</h4>
          <p className="ar red">تنص المادتان 82 و 83 من قانون المنازعات رقم 08-08 الصادر في 23 فبراير 2008 على أنه: "يعاقب بالحبس من ستة (6) أشهر إلى سنتين ( 2 ) و بغرامة مالية من ثلاثين ألف دينار ( 30.000 دج ) إلى مائة ألف دينار ( 100.000 دج ) ، كل من أدلى بتصريحات كاذبة ، عرض خدمات أو قبلها ، أو قدمها بغرض حصوله أو حصول الغير على أداءات غير مستحقة.</p>
          <h4 className="fr">——— RECOMMANDATIONS IMPORTANTES ———</h4>
          <p className="fr red">Est puni d'un emprisonnement de six (06) mois à deux (02) ans et d'une amende de trente mille dinars (30.000 DA) à cent mille dinars (100.000 DA), toute personne ayant fait de fausses declarations, offert, accepté ou prêté des services pour obtenir, pour lui-même ou faire obtenir indûment des prestations à des tiers ". (Art.82 et 83 Loi n°08-08 du 23 février 2008)</p>
        </div>

        {/* Footer */}
        <div className="cnrf-foot"><span>IMP.CNAS 06/10 RET.07</span></div>

      </div>
    </div>
  );
};

/* ================================================================ */
/* CNR BACK FACE — نسخة مطابقة تماماً للنموذج الرسمي (60 شهراً)     */
/* ================================================================ */

interface CNRBackProps {
  employee: Employee;
  settings: Settings;
  monthsData: MonthItem[];
  blockTotals: number[];
  grandTotal: number;
  average: number;
  monthsCount: number;
  blocksCount: number;
  onYieldChange: (key: string, val: number) => void;
  onSalaryChange: (key: string, val: number) => void;
}

/* خلية أجر قابلة للتعديل اليدوي الحي: عرض خام أثناء الكتابة وتنسيق عند الخروج،
   وكل ضغطة تعيد حساب مجاميع الكتل والمجموع العام والمعدل آلياً */
/**
 * تحليل مبلغ مكتوب يدوياً بأمانة — يدعم الصيغ: 45000 / 45 000 / 45.000 / 45.000,00 / 45,000.00 / 45.50
 * (لا يقرأ «45.000,00» كـ 45 كما كان يحدث سابقاً فتتشوه الأرقام)
 */
const parseAmount = (raw: string): number => {
  let s = String(raw || '').replace(/[\s\u00A0\u066C]/g, '');
  if (!s) return 0;
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    // الفاصل الأخير هو الفاصلة العشرية والآخر فاصل آلاف
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) s = s.replace(/,/g, '');
    else s = s.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    const parts = s.split(',');
    // "1,25" عشرية — "1,200" أو "1,200,000" فواصل آلاف
    if (parts.length === 2 && parts[1].length !== 3) s = parts[0] + '.' + parts[1];
    else s = s.replace(/,/g, '');
  } else if (hasDot) {
    const parts = s.split('.');
    if (parts.length > 2) s = parts.join('');            // 1.200.000 → فواصل آلاف
    else if (parts[1].length === 3 && parts[0].length <= 3) s = parts.join(''); // 45.000 → آلاف
    // غير ذلك: يبقى فاصلة عشرية (45.50)
  }
  const n = parseFloat(s.replace(/[^\d.-]/g, ''));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
};

/** الانتقال إلى الخانة القابلة للتعديل التالية داخل جدول الوثيقة (زر Enter/OK) */
const moveNextCell = (el: HTMLElement) => {
  const page = el.closest('.cnrb-page');
  if (!page) return;
  const cells = Array.from(
    page.querySelectorAll<HTMLElement>('td.cnrb-data-cell input, td.cnrb-data-cell[contenteditable]')
  );
  const i = cells.indexOf(el);
  const next = cells[i + 1] || cells[0];
  if (!next) return;
  next.focus();
  if (next instanceof HTMLInputElement) {
    try { next.select(); } catch { /* ignore */ }
  } else {
    // خلية نصية contentEditable: ضع المؤشر في النهاية
    try {
      const r = document.createRange();
      r.selectNodeContents(next);
      r.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    } catch { /* ignore */ }
  }
};

/** رقم النموذج الشائع لخانات الأجور: العرض يبقى كما كتبه المستخدم أثناء التعديل (بلا تشويه) */
const CNRAmountCell: React.FC<{ value: number; onChange: (v: number) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft !== null ? draft : (value ? fmt(value) : (placeholder || fmt(0)));
  const commit = (raw: string) => {
    const n = parseAmount(raw);
    onChange(n);
    setDraft(null);
  };
  return (
    <input
      type="text"
      inputMode="decimal"
      value={shown}
      className="font-mono"
      onChange={e => {
        const raw = e.target.value;
        setDraft(raw);
        // تحديث حيّ للمجاميع دون إعادة تنسيق النص أثناء الكتابة
        onChange(parseAmount(raw));
      }}
      onFocus={e => {
        setDraft(value ? String(value) : '');
        const el = e.currentTarget;
        setTimeout(() => { try { el.select(); } catch { /* ignore */ } }, 0);
      }}
      onBlur={() => { if (draft !== null) commit(draft); }}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const el = e.currentTarget;
          if (draft !== null) commit(draft);
          moveNextCell(el);
        }
      }}
    />
  );
};

const CNRSalaryCell: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <CNRAmountCell value={value} onChange={onChange} />
);

const CNRYieldCell: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <CNRAmountCell value={value} onChange={onChange} placeholder="00.00" />
);

const CNRBack: React.FC<CNRBackProps> = ({ monthsData, blockTotals, grandTotal, average, monthsCount, blocksCount, onYieldChange, onSalaryChange }) => {
  // Blocks left-to-right: الأقدم يساراً ... الأحدث (Total 1) يميناً — الكتلة الأولى قد تكون ناقصة
  const blockMonths = (b: number) => monthsData.slice(b * 12, b * 12 + 12);

  return (
    <div className="cnr-back-root">
      <style>{`
        .cnrb-page * { box-sizing: border-box; }
        .cnrb-page {
          width: 297mm;
          height: 210mm;
          background: #fff;
          position: relative;
          box-shadow: 0 0 10px rgba(0,0,0,.35);
          padding: 8mm 10mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin: 0 auto;
          font-family: 'Traditional Arabic', 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 10pt;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          .cnrb-page { box-shadow: none !important; }
        }
        .cnrb-page .ar { font-family: 'Traditional Arabic', 'Arabic Typesetting', 'Segoe UI', serif; direction: rtl; unicode-bidi: isolate; }
        .cnrb-page .fr { direction: ltr; unicode-bidi: isolate; }
        .cnrb-page [contenteditable]:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .cnrb-page .cnrb-header { text-align: center; margin-bottom: 2mm; }
        .cnrb-page .cnrb-header-ar { font-size: 17pt; font-weight: bold; color: #000; margin: 0 0 1mm 0; }
        .cnrb-page .cnrb-header-fr { font-size: 13.5pt; font-weight: bold; color: #000; letter-spacing: 0.5px; margin: 0; }

        .cnrb-page .cnrb-tables-container { display: flex; gap: 2.5mm; flex: 1; width: 100%; margin-bottom: 2mm; }
        .cnrb-page .cnrb-block-table { flex: 1; border-collapse: collapse; height: 100%; background: #fff; table-layout: fixed; }
        .cnrb-page .cnrb-block-table th, .cnrb-page .cnrb-block-table td { border: 1px solid #000; text-align: center; padding: 0; vertical-align: middle; }
        .cnrb-page .cnrb-block-table th { height: 14mm; font-weight: bold; background: #fff; }
        .cnrb-page .cnrb-th-col-ref { width: 42%; }
        .cnrb-page .cnrb-th-col-sal { width: 58%; }
        .cnrb-page .cnrb-th-ar { font-size: 9pt; font-weight: bold; line-height: 1.1; display: block; }
        .cnrb-page .cnrb-th-fr { font-size: 7.5pt; font-weight: bold; line-height: 1.1; display: block; margin-top: 1px; }
        .cnrb-page .cnrb-block-table td.cnrb-data-cell { height: 8.4mm; font-size: 9.5pt; unicode-bidi: plaintext; }
        .cnrb-page .cnrb-month-cell { font-weight: 700; font-size: 9pt; }
        .cnrb-page .cnrb-sal-val { display: block; line-height: 1.15; }
        .cnrb-page .cnrb-yield-note { display: block; font-size: 6.8pt; font-weight: 700; color: #1e3fae; line-height: 1.05; }
        .cnrb-page .cnrb-block-table td.cnrb-total-cell { height: 11mm; font-weight: bold; background: #fff; }
        .cnrb-page .cnrb-total-ar { font-size: 9.5pt; font-weight: bold; display: block; }
        .cnrb-page .cnrb-total-fr { font-size: 8.5pt; font-weight: bold; display: block; }
        .cnrb-page .cnrb-total-val { font-size: 10pt; }
        .cnrb-page td.cnrb-data-cell input { width: 100%; border: none; background: transparent; text-align: center; font-weight: bold; font-size: 9pt; padding: 0; }
        .cnrb-page td.cnrb-data-cell input:focus { outline: 1.5px solid #0070C0; background: #eef5ff; }

        .cnrb-page .cnrb-footer { display: flex; justify-content: space-between; align-items: flex-end; padding: 0 4mm 1mm 4mm; }
        .cnrb-page .cnrb-summary-section { display: flex; flex-direction: column; gap: 2.5mm; }
        .cnrb-page .cnrb-summary-row { display: flex; align-items: center; }
        .cnrb-page .cnrb-sum-fr { font-size: 9.5pt; font-weight: bold; width: 44mm; text-align: left; }
        .cnrb-page .cnrb-sum-box {
          width: 46mm;
          height: 8.5mm;
          border: 1px solid #000;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 10pt;
          margin: 0 4mm;
          unicode-bidi: plaintext;
        }
        .cnrb-page .cnrb-sum-ar { font-size: 10pt; font-weight: bold; width: 44mm; text-align: right; }
        .cnrb-page .cnrb-stamp-section { text-align: right; padding-right: 6mm; padding-bottom: 1mm; }
        .cnrb-page .cnrb-stamp-ar { font-size: 11pt; font-weight: bold; margin-bottom: 1mm; }
        .cnrb-page .cnrb-stamp-fr { font-size: 9.5pt; font-weight: bold; }

        /* رمز CNR على الجهة المقابلة (الوجه الخلفي) — أعلى الزاوية */
        .cnrb-page { position: relative; }
        .cnrb-page .cnrb-corner-logo {
          position: absolute;
          top: 5mm;
          left: 8mm;
          width: 20mm;
          height: 20mm;
          object-fit: contain;
        }
      `}</style>

      <div className="cnrb-page" id="cnr-back-document">

        {/* رمز CNR — الجهة المقابلة */}
        <img className="cnrb-corner-logo" src={CNR_LOGO} alt="CNR" />

        {/* Header Titles */}
        <div className="cnrb-header">
          <p className="cnrb-header-ar ar">الأجور الشهرية الخاضعة لإشتراكات الضمان الاجتماعي</p>
          <p className="cnrb-header-fr fr">SALAIRES MENSUELS SOUMIS A COTISATION</p>
        </div>

        {/* Blocks (Left to Right: الأقدم إلى الأحدث) — عدد الكتل حسب عدد الأشهر المطلوب */}
        <div className="cnrb-tables-container">
          {Array.from({ length: blocksCount }, (_, j) => {
            const months = blockMonths(j);
            // الكتلة الأقدم (الأولى يساراً) قد تحتوي أقل من 12 شهراً — نكمل الصفوف فارغة للحفاظ على تناسق الجدول
            const fillerCount = Math.max(0, 12 - months.length);
            return (
            <table key={j} className="cnrb-block-table">
              <thead>
                <tr>
                  <th className="cnrb-th-col-ref">
                    <span className="cnrb-th-ar ar">الفترات المرجعية</span>
                    <span className="cnrb-th-fr fr">Période Référence</span>
                  </th>
                  <th className="cnrb-th-col-sal">
                    <span className="cnrb-th-ar ar">الأجر الخاضع للإشتراكات</span>
                    <span className="cnrb-th-fr fr">Salaire soumis à cotisation</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((m, r) => {
                  const qNum = Number(m.key.slice(5, 7)) === 3 ? 'الأول' : Number(m.key.slice(5, 7)) === 6 ? 'الثاني' : Number(m.key.slice(5, 7)) === 9 ? 'الثالث' : 'الرابع';
                  return (
                  <React.Fragment key={r}>
                  <tr>
                    <td className="cnrb-data-cell cnrb-month-cell" contentEditable suppressContentEditableWarning
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); moveNextCell(e.currentTarget); } }}
                    >{m.label}</td>
                    <td className="cnrb-data-cell">
                      <CNRSalaryCell value={m.salary} onChange={v => onSalaryChange(m.key, v)} />
                    </td>
                  </tr>
                  {(() => {
                    const isLast = m.key === (monthsData[monthsData.length - 1]?.key || '');
                    return isYieldMonth(m.key) || isLast ? (
                    <tr>
                      <td className="cnrb-data-cell cnrb-month-cell" contentEditable suppressContentEditableWarning
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); moveNextCell(e.currentTarget); } }}
                      >مردودية الثلاثي {qNum}</td>
                      <td className="cnrb-data-cell">
                        <CNRYieldCell value={m.yieldVal} onChange={v => onYieldChange(m.key, v)} />
                      </td>
                    </tr>
                    ) : null;
                  })()}
                  </React.Fragment>
                  );
                })}
                {Array.from({ length: fillerCount }, (_, f) => (
                  <tr key={`filler-${f}`}>
                    <td className="cnrb-data-cell">&nbsp;</td>
                    <td className="cnrb-data-cell">&nbsp;</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="cnrb-total-cell">
                    <span className="cnrb-total-ar ar">المجموع({blocksCount - j})</span>
                    <span className="cnrb-total-fr fr">Total ({blocksCount - j})</span>
                    <span className="cnrb-total-val">{fmt(blockTotals[j] || 0)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            );
          })}
        </div>

        {/* Footer Section */}
        <div className="cnrb-footer">

          {/* Summary — المجموع والمعدل يُحسبان آلياً من الخانات (الجمع ثم القسمة على عدد الأشهر) */}
          <div className="cnrb-summary-section">
            <div className="cnrb-summary-row">
              <span className="cnrb-sum-fr fr">Total général ({monthsCount}) mois</span>
              <div className="cnrb-sum-box">{fmt(grandTotal)}</div>
              <span className="cnrb-sum-ar ar">المجموع العام ({monthsCount}) شهراً</span>
            </div>
            <div className="cnrb-summary-row">
              <span className="cnrb-sum-fr fr">Salaire mensuel moyen</span>
              <div className="cnrb-sum-box">{fmt(average)}</div>
              <span className="cnrb-sum-ar ar">الأجر الشهري المتوسط</span>
            </div>
          </div>

          {/* Stamp & Signature Area */}
          <div className="cnrb-stamp-section">
            <div className="cnrb-stamp-ar ar">ختم، تاريخ وتوقيع المستخدم</div>
            <div className="cnrb-stamp-fr fr">Cachet, date et visa de l'Employeur</div>
          </div>

        </div>

      </div>
    </div>
  );
};
