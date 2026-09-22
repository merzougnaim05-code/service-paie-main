import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Allowance, Settings, MaritalStatus, EmploymentStatus } from '../types';
import { JOBS, GRILLE } from '../data/salaryGrids';
import {
  isProfessionalWorkerJob,
  computePayslip,
  autoAllowancesForJob,
  performanceBonusForJob,
  auresAllowance,
  seniorityFor,
  fmt
} from '../utils/salaryCalculator';
import {
  User,
  Users,
  Briefcase,
  DollarSign,
  Heart,
  Save,
  X,
  Plus,
  Trash2,
  Edit,
  Eye,
  Award,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface EmployeeRegistryProps {
  employees: Employee[];
  settings: Settings;
  onSaveEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onOpenPayslip: (id: string) => void;
  onOpenPension: (id: string) => void;
}

export const EmployeeRegistry: React.FC<EmployeeRegistryProps> = ({
  employees,
  settings,
  onSaveEmployee,
  onDeleteEmployee,
  onOpenPayslip,
  onOpenPension
}) => {
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [ssn, setSsn] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');
  const [postalAccount, setPostalAccount] = useState('');

  const [marital, setMarital] = useState<MaritalStatus>('أعزب');
  const [children, setChildren] = useState(0);
  const [children10, setChildren10] = useState(0);
  const [singleWage, setSingleWage] = useState(false);

  const [jobIdx, setJobIdx] = useState(1);
  const [category, setCategory] = useState(11); // index in GRILLE
  const [echelon, setEchelon] = useState(0);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>('مرسم');
  const [hireDate, setHireDate] = useState('');
  const [yearsOverride, setYearsOverride] = useState<string>('');
  const [lastWorkDate, setLastWorkDate] = useState('');
  const [resumeDate, setResumeDate] = useState('');

  const [mutuelle, setMutuelle] = useState(true);
  const [mutuelleNum, setMutuelleNum] = useState('');
  const [performancePct, setPerformancePct] = useState(40);
  const [incomeDifference, setIncomeDifference] = useState(0);
  const [experienceDifference, setExperienceDifference] = useState(0);

  const [allowances, setAllowances] = useState<Allowance[]>([]);

  // Search & Filter in Table
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync category and status when job changes
  const handleJobChange = (newIdx: number) => {
    setJobIdx(newIdx);
    const selectedJob = JOBS[newIdx];
    if (selectedJob) {
      const gIdx = GRILLE.findIndex(g => g.cat === String(selectedJob.cat));
      if (gIdx >= 0) {
        setCategory(gIdx);
      }
      if (isProfessionalWorkerJob(selectedJob)) {
        setEmploymentStatus('متعاقد');
      } else {
        setEmploymentStatus('مرسم');
      }
    }
  };

  // Auto-generate proposals for allowances
  const currentJob = JOBS[jobIdx];
  const isPW = isProfessionalWorkerJob(currentJob);

  // Recalculate auto allowances whenever job, category, echelon, or performance % changes
  useEffect(() => {
    const rawG = GRILLE[category] || GRILLE[0];
    const pointVal = settings.pointValue || 45;
    const basic = Math.round(rawG.base * pointVal * 100) / 100;
    const yearsNum = yearsOverride !== '' ? Number(yearsOverride) || 0 : 0;
    const seniority = seniorityFor(currentJob, rawG, echelon, pointVal, basic, yearsNum, employmentStatus);

    const autoList = autoAllowancesForJob(currentJob, basic, seniority, rawG.cat, echelon);
    const pb = performanceBonusForJob(currentJob, basic, seniority, performancePct);
    if (pb) autoList.push(pb);

    const aures = settings.auresEnabled ? auresAllowance(currentJob, echelon, yearsNum) : 0;
    if (aures > 0) {
      autoList.push({ name: 'منحة الأوراس', amount: aures, cnas: true, irg: false, auto: true });
    }

    // Keep user's custom manual allowances
    const manualList = allowances.filter(a => !a.auto);
    setAllowances([...autoList, ...manualList]);
  }, [jobIdx, category, echelon, employmentStatus, performancePct, yearsOverride, settings.auresEnabled]);

  // Form preview calculations
  const previewCalculation = useMemo(() => {
    const tempEmp: Employee = {
      id: editingId || 'temp',
      name: name || 'الموظف المعاين',
      jobIdx,
      ssn,
      category,
      echelon,
      employmentStatus,
      hireDate,
      yearsOverride: yearsOverride === '' ? null : Number(yearsOverride),
      marital,
      children,
      children10,
      singleWage,
      mutuelle,
      mutuelleNum,
      performancePct,
      incomeDifference,
      experienceDifference,
      birthPlace,
      birthDate,
      address,
      postalAccount,
      lastWorkDate,
      resumeDate,
      allowances,
      pensionHistory: []
    };
    try {
      const now = new Date();
      return computePayslip(tempEmp, now.getMonth() + 1, now.getFullYear(), settings);
    } catch {
      return null;
    }
  }, [
    name, jobIdx, ssn, category, echelon, employmentStatus, hireDate, yearsOverride,
    marital, children, children10, singleWage, mutuelle, mutuelleNum, performancePct,
    incomeDifference, experienceDifference, birthPlace, birthDate, address, postalAccount,
    lastWorkDate, resumeDate, allowances, settings, editingId
  ]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSsn('');
    setBirthPlace('');
    setBirthDate('');
    setAddress('');
    setPostalAccount('');
    setMarital('أعزب');
    setChildren(0);
    setChildren10(0);
    setSingleWage(false);
    setJobIdx(1);
    setCategory(11);
    setEchelon(0);
    setEmploymentStatus('مرسم');
    setHireDate('');
    setYearsOverride('');
    setLastWorkDate('');
    setResumeDate('');
    setMutuelle(true);
    setMutuelleNum('');
    setPerformancePct(40);
    setIncomeDifference(0);
    setExperienceDifference(0);
    setAllowances([]);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setSsn(emp.ssn || '');
    setBirthPlace(emp.birthPlace || '');
    setBirthDate(emp.birthDate || '');
    setAddress(emp.address || '');
    setPostalAccount(emp.postalAccount || '');
    setMarital(emp.marital);
    setChildren(emp.children);
    setChildren10(emp.children10);
    setSingleWage(emp.singleWage);
    setJobIdx(emp.jobIdx);
    setCategory(emp.category);
    setEchelon(emp.echelon);
    setEmploymentStatus(emp.employmentStatus);
    setHireDate(emp.hireDate);
    setYearsOverride(emp.yearsOverride != null ? String(emp.yearsOverride) : '');
    setLastWorkDate(emp.lastWorkDate || '');
    setResumeDate(emp.resumeDate || '');
    setMutuelle(emp.mutuelle);
    setMutuelleNum(emp.mutuelleNum || '');
    setPerformancePct(emp.performancePct);
    setIncomeDifference(emp.incomeDifference);
    setExperienceDifference(emp.experienceDifference);
    setAllowances(emp.allowances || []);

    window.scrollTo({ top: 120, behavior: 'smooth' });
    showToast(`تم تحميل بيانات: ${emp.name} للتعديل`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى إدخال اسم ولقب الموظف');
      return;
    }

    const newEmp: Employee = {
      id: editingId || `emp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      jobIdx,
      ssn: ssn.trim(),
      category,
      echelon: isPW && employmentStatus !== 'مرسم' ? 0 : echelon,
      employmentStatus,
      hireDate,
      yearsOverride: yearsOverride === '' ? null : Number(yearsOverride),
      marital,
      children: Number(children) || 0,
      children10: Number(children10) || 0,
      singleWage,
      mutuelle,
      mutuelleNum: mutuelleNum.trim(),
      performancePct: Number(performancePct) || 0,
      incomeDifference: Number(incomeDifference) || 0,
      experienceDifference: Number(experienceDifference) || 0,
      birthPlace: birthPlace.trim(),
      birthDate,
      address: address.trim(),
      postalAccount: postalAccount.trim(),
      lastWorkDate,
      resumeDate,
      allowances: allowances.map(a => ({ ...a })),
      pensionHistory: editingId
        ? (employees.find(x => x.id === editingId)?.pensionHistory || [])
        : []
    };

    onSaveEmployee(newEmp);
    showToast(editingId ? 'تم تحديث بيانات الموظف بنجاح ✓' : 'تم تسجيل الموظف الجديد بنجاح ✓');
    resetForm();
  };

  const handleAddManualAllowance = () => {
    setAllowances([
      ...allowances,
      { name: 'منحة خاصة', amount: 1000, cnas: true, irg: true, auto: false }
    ]);
  };

  const handleRemoveAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const handleAllowanceChange = (index: number, field: keyof Allowance, value: any) => {
    const updated = [...allowances];
    updated[index] = { ...updated[index], [field]: value };
    setAllowances(updated);
  };

  // Filtered employees list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.ssn && emp.ssn.includes(searchQuery));

    if (!matchesSearch) return false;
    if (filterDomain === 'all') return true;

    const j = JOBS[emp.jobIdx];
    if (!j) return false;
    if (filterDomain === 'workers') return isProfessionalWorkerJob(j);
    if (filterDomain === 'teach') return j.domain === 'teach' && !isProfessionalWorkerJob(j);
    if (filterDomain === 'admin') return j.domain !== 'teach' && !isProfessionalWorkerJob(j);
    return true;
  });

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#176b4a] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Registration Form Card */}
      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-6 sm:p-8 shadow-sm mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-[#e5ddcb] gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a3d2b] font-['Cairo'] flex items-center gap-2">
              <User className="w-6 h-6 text-[#176b4a]" />
              <span>{editingId ? `تعديل بيانات: ${name || 'الموظف'}` : 'تسجيل موظف جديد في النظام'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#706856] mt-1">
              أدخل كافة البيانات الشخصية والمهنية. يحتسب النظام تلقائياً الأجر القاعدي، والخبرة، والمنح، وسلم IRG.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-[#d8463d] hover:bg-[#b8352d] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <X className="w-4 h-4" />
              <span>إلغاء وضع التعديل</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Personal Information */}
          <div className="bg-[#fcfbf7] border border-[#ded5be] rounded-2xl p-5">
            <h3 className="text-base font-bold text-[#176b4a] mb-4 flex items-center gap-2 border-b border-[#eadeca] pb-2">
              <User className="w-4 h-4" />
              <span>1. المعلومات الشخصية</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  الاسم واللقب <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد بلقاسمي"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a] focus:ring-2 focus:ring-[#176b4a]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">تاريخ الميلاد</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">مكان الازدياد</label>
                <input
                  type="text"
                  placeholder="مثال: باتنة"
                  value={birthPlace}
                  onChange={e => setBirthPlace(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">رقم الضمان الاجتماعي (N° SSN)</label>
                <input
                  type="text"
                  placeholder="مثال: 1980051203445501"
                  value={ssn}
                  onChange={e => setSsn(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">رقم الحساب البريدي (CCP)</label>
                <input
                  type="text"
                  placeholder="مثال: 0012345678 مفتاح 44"
                  value={postalAccount}
                  onChange={e => setPostalAccount(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">العنوان الشخصي</label>
                <input
                  type="text"
                  placeholder="مثال: حي النصر، باتنة"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Family Status */}
          <div className="bg-[#fcfbf7] border border-[#ded5be] rounded-2xl p-5">
            <h3 className="text-base font-bold text-[#176b4a] mb-4 flex items-center gap-2 border-b border-[#eadeca] pb-2">
              <Heart className="w-4 h-4" />
              <span>2. الحالة العائلية</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">الوضعية العائلية</label>
                <select
                  value={marital}
                  onChange={e => setMarital(e.target.value as MaritalStatus)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                >
                  <option value="أعزب">أعزب</option>
                  <option value="متزوج">متزوج</option>
                  <option value="مطلق">مطلق</option>
                  <option value="أرمل">أرمل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">عدد الأطفال الإجمالي</label>
                <input
                  type="number"
                  min="0"
                  value={children}
                  onChange={e => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              {children > 0 && (
                <div>
                  <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                    الأطفال أكبر من 10 سنوات (تكملة 11.25 دج حتى 3)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={children}
                    value={children10}
                    onChange={e => setChildren10(Math.min(children, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                  />
                </div>
              )}

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={singleWage}
                    onChange={e => setSingleWage(e.target.checked)}
                    className="w-4 h-4 rounded text-[#176b4a] accent-[#176b4a]"
                  />
                  <span className="text-xs font-bold text-[#353026]">
                    يستفيد من منحة الأجر الوحيد (800 دج)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Professional Information */}
          <div className="bg-[#fcfbf7] border border-[#ded5be] rounded-2xl p-5">
            <h3 className="text-base font-bold text-[#176b4a] mb-4 flex items-center gap-2 border-b border-[#eadeca] pb-2">
              <Briefcase className="w-4 h-4" />
              <span>3. المعلومات المهنية والرتبة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  الوظيفة / الرتبة المعتمدة
                </label>
                <select
                  value={jobIdx}
                  onChange={e => handleJobChange(parseInt(e.target.value))}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                >
                  {JOBS.map((j, i) => (
                    <option key={i} value={i}>
                      {j.name} — (صنف {j.cat})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  الصنف (الرقم الاستدلالي الأدنى)
                </label>
                <select
                  value={category}
                  disabled
                  className="w-full bg-[#f0eae0] border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-bold text-[#234c38]"
                >
                  {GRILLE.map((g, idx) => (
                    <option key={idx} value={idx}>
                      الصنف {g.cat} (قاعدي: {g.base} نقطة)
                    </option>
                  ))}
                </select>
              </div>

              {!isPW ? (
                <div>
                  <label className="block text-xs font-bold text-[#443e33] mb-1.5">الدرجة (0 إلى 12)</label>
                  <select
                    value={echelon}
                    onChange={e => setEchelon(parseInt(e.target.value))}
                    className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                  >
                    <option value={0}>بدون درجة (0)</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        الدرجة {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#443e33] mb-1.5">صفة التوظيف</label>
                  <select
                    value={employmentStatus}
                    onChange={e => setEmploymentStatus(e.target.value as EmploymentStatus)}
                    className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                  >
                    <option value="متعاقد">متعاقد (خبرة 1.40% عن كل سنة)</option>
                    <option value="مرسم">مرسم (بالدرجة)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">تاريخ التوظيف</label>
                <input
                  type="date"
                  value={hireDate}
                  onChange={e => setHireDate(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  سنوات الخدمة (يدوي / اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="يُحسب آلياً من تاريخ التوظيف إن ترك فارغاً"
                  value={yearsOverride}
                  onChange={e => setYearsOverride(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  تاريخ آخر يوم عمل (في حالة توقف)
                </label>
                <input
                  type="date"
                  value={lastWorkDate}
                  onChange={e => setLastWorkDate(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  تاريخ استئناف العمل
                </label>
                <input
                  type="date"
                  value={resumeDate}
                  onChange={e => setResumeDate(e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Salary, Deductions & Allowances */}
          <div className="bg-[#fcfbf7] border border-[#ded5be] rounded-2xl p-5">
            <h3 className="text-base font-bold text-[#176b4a] mb-4 flex items-center gap-2 border-b border-[#eadeca] pb-2">
              <DollarSign className="w-4 h-4" />
              <span>4. معلومات الراتب والمنح الخاصة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={mutuelle}
                    onChange={e => setMutuelle(e.target.checked)}
                    className="w-4 h-4 rounded text-[#176b4a] accent-[#176b4a]"
                  />
                  <span className="text-xs font-bold text-[#353026]">
                    يستفيد من التعاضدية (1% من الخام)
                  </span>
                </label>
                {mutuelle && (
                  <input
                    type="text"
                    placeholder="رقم بطاقة التعاضدية"
                    value={mutuelleNum}
                    onChange={e => setMutuelleNum(e.target.value)}
                    className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1">
                  نسبة علاوة الأداء / المردودية (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={performancePct}
                  onChange={e => setPerformancePct(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1">
                  فارق الدخل (يدوي)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={incomeDifference}
                  onChange={e => setIncomeDifference(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Allowances Table */}
            <div className="border border-[#e0d6c1] rounded-xl p-3 bg-white mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-[#2d523f]">
                  المنح والعلاوات المعتمدة للمنصب ({allowances.length})
                </div>
                <button
                  type="button"
                  onClick={handleAddManualAllowance}
                  className="text-xs bg-[#e9f2ec] hover:bg-[#d8e9dc] text-[#176b4a] font-bold px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة منحة خاصة</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {allowances.map((al, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-2 bg-[#faf8f2] p-2 rounded-lg border border-[#e5dece] text-xs"
                  >
                    <input
                      type="text"
                      value={al.name}
                      onChange={e => handleAllowanceChange(idx, 'name', e.target.value)}
                      className="flex-1 min-w-[140px] bg-white border border-[#d8d0bc] rounded-lg px-2 py-1 font-semibold text-[#1a3828]"
                      placeholder="اسم المنحة"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={al.amount}
                      onChange={e => handleAllowanceChange(idx, 'amount', Number(e.target.value) || 0)}
                      className="w-24 bg-white border border-[#d8d0bc] rounded-lg px-2 py-1 font-mono text-center"
                      placeholder="المبلغ"
                    />

                    <label className="flex items-center gap-1 text-[11px] text-[#4f483b] bg-white px-2 py-1 rounded border border-[#d8d0bc] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={al.cnas}
                        onChange={e => handleAllowanceChange(idx, 'cnas', e.target.checked)}
                        className="accent-[#176b4a]"
                      />
                      <span>ضمان (CNAS)</span>
                    </label>

                    <label className="flex items-center gap-1 text-[11px] text-[#4f483b] bg-white px-2 py-1 rounded border border-[#d8d0bc] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={al.irg}
                        onChange={e => handleAllowanceChange(idx, 'irg', e.target.checked)}
                        className="accent-[#176b4a]"
                      />
                      <span>ضريبة (IRG)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleRemoveAllowance(idx)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="حذف المنحة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Salary Breakdown Box */}
          {previewCalculation && (
            <div className="bg-gradient-to-br from-[#f1faee]/90 to-[#e8f5e9]/90 border border-[#a8dadc] rounded-2xl p-5 shadow-inner">
              <div className="text-xs font-bold text-[#1d3557] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>المعاينة الفورية لحساب الراتب الشهري الصافي</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center text-xs">
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <div className="text-[#6c757d]">الأجر القاعدي</div>
                  <div className="font-bold text-[#1b4332] font-mono mt-0.5">{fmt(previewCalculation.basic)} دج</div>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <div className="text-[#6c757d]">الخبرة المهنية</div>
                  <div className="font-bold text-[#1b4332] font-mono mt-0.5">{fmt(previewCalculation.seniority)} دج</div>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <div className="text-[#6c757d]">مجموع المنح</div>
                  <div className="font-bold text-[#1b4332] font-mono mt-0.5">{fmt(previewCalculation.allowTotal)} دج</div>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <div className="text-[#6c757d]">الأجر الخام</div>
                  <div className="font-bold text-[#1b4332] font-mono mt-0.5">{fmt(previewCalculation.gross)} دج</div>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <div className="text-[#6c757d]">اقتطاع CNAS (9%)</div>
                  <div className="font-bold text-red-700 font-mono mt-0.5">{fmt(previewCalculation.cnasDeduction)} دج</div>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-emerald-100">
                  <div className="text-[#6c757d]">ضريبة IRG 2022</div>
                  <div className="font-bold text-red-700 font-mono mt-0.5">{fmt(previewCalculation.irgTax)} دج</div>
                </div>
                <div className="bg-[#176b4a] text-white p-2 rounded-xl col-span-2 sm:col-span-1 shadow-sm">
                  <div className="text-emerald-100 font-bold">الصافي للدفع</div>
                  <div className="font-black text-sm font-mono mt-0.5">{fmt(previewCalculation.net)} دج</div>
                </div>
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#e2d9c5]">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-[#eee] hover:bg-[#ddd] text-[#333] px-5 py-3 rounded-xl font-bold text-sm transition-all"
              >
                إلغاء التعديل
              </button>
            )}

            <button
              type="submit"
              className="bg-[#176b4a] hover:bg-[#12553b] text-white px-8 py-3.5 rounded-xl font-black text-sm sm:text-base shadow-md flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg"
            >
              <Save className="w-5 h-5" />
              <span>{editingId ? '💾 حفظ التعديلات على الموظف' : '💾 حفظ وتسجيل الموظف في السجل'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Employees Table Card */}
      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-[#e5ddcb] gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-[#1a3d2b] font-['Cairo'] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#176b4a]" />
              <span>قائمة الموظفين المسجلين ({employees.length} موظف)</span>
            </h3>
            <p className="text-xs text-[#706856] mt-0.5">
              يمكنك استخراج كشف الراتب أو شهادة التقاعد أو التعديل والحذف لأي موظف مباشرة.
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8b816d]" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الضمان..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 bg-white border border-[#d4cbba] rounded-xl pr-9 pl-3 py-1.5 text-xs focus:outline-none focus:border-[#176b4a]"
              />
            </div>

            <select
              value={filterDomain}
              onChange={e => setFilterDomain(e.target.value)}
              className="bg-white border border-[#d4cbba] rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="all">جميع الأسلاك</option>
              <option value="teach">التعليم</option>
              <option value="admin">الإداريون</option>
              <option value="workers">العمال المهنيون</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-[#827866] text-sm">
            لا يوجد موظفون مطابقون لشروط البحث.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#ded5be]">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-[#f4efe4] text-[#1a3d2b] border-b border-[#ded5be]">
                  <th className="p-3 font-bold">#</th>
                  <th className="p-3 font-bold">الاسم واللقب</th>
                  <th className="p-3 font-bold">الوظيفة / الرتبة</th>
                  <th className="p-3 font-bold">الصنف / الدرجة</th>
                  <th className="p-3 font-bold">رقم الضمان الاجتماعي</th>
                  <th className="p-3 font-bold">الأطفال</th>
                  <th className="p-3 font-bold text-center">الإجراءات والوثائق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece3cf]">
                {filteredEmployees.map((emp, i) => {
                  const job = JOBS[emp.jobIdx];
                  const g = GRILLE[emp.category] || GRILLE[0];
                  return (
                    <tr key={emp.id} className="hover:bg-[#faf7ee] transition-colors">
                      <td className="p-3 text-[#7a7261]">{i + 1}</td>
                      <td className="p-3 font-bold text-[#1b3e2b]">{emp.name}</td>
                      <td className="p-3">{job ? job.name : '—'}</td>
                      <td className="p-3 font-mono">
                        الصنف {g.cat} / {isProfessionalWorkerJob(job) ? `${emp.yearsOverride || 0} سنة` : `د ${emp.echelon}`}
                      </td>
                      <td className="p-3 font-mono text-[#524b3c]">{emp.ssn || '—'}</td>
                      <td className="p-3">{emp.children}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenPayslip(emp.id)}
                            className="bg-[#176b4a] hover:bg-[#115037] text-white p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="كشف الراتب"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">كشف</span>
                          </button>

                          <button
                            onClick={() => onOpenPension(emp.id)}
                            className="bg-amber-700 hover:bg-amber-800 text-white p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="وثائق التقاعد الرسمية (CNR)"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">تقاعد</span>
                          </button>

                          <button
                            onClick={() => handleEditClick(emp)}
                            className="bg-[#2c4e80] hover:bg-[#1f375a] text-white p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="تعديل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الموظف "${emp.name}"؟`)) {
                                onDeleteEmployee(emp.id);
                                showToast('تم حذف الموظف');
                              }
                            }}
                            className="bg-[#d8463d] hover:bg-[#ad322a] text-white p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
