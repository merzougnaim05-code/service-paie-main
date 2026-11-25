import React, { useMemo, useState } from 'react';
import { Employee, Settings, DrtRecord } from '../types';
import { listDrtDocs, upsertDrtDoc, deleteDrtDoc } from '../utils/storage';
import { ATSFront } from './ATSFront';
import { ATSBack } from './ATSBack';
import { DrtExcelDoc } from './DrtExcelDoc';
import { AutoFitScale } from './DeviceScaler';
import {
  Archive,
  Search,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  FileText
} from 'lucide-react';

interface DrtRegistryProps {
  employees: Employee[];
  settings: Settings;
}

const DOC_LABELS: Record<DrtRecord['docType'], string> = {
  'ats-front': 'ATS — الوجه الأول',
  'ats-back': 'ATS — الوجه الثاني',
  'drt': 'استئناف العمل DRT'
};

const fmtDate = (iso: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('ar-DZ');
};

/* ارشيف وثائق CNAS (ATS وجه أول/وجه ثانٍ أو DRT).
   نفس مبدأ سجل الموظفين: جدول + بحث + معاينة/تعديل/حذف.
   يُحفظ لكل موظف آخر 10 وثائق فقط ويُحذف الأقدم تلقائياً (عند الحفظ).
   كل سجل يحمل لقطة بيانات الموظف وقت الإنجاز، فتبقى المعاينة مطابقة للوثيقة الأصلية. */
export const DrtRegistry: React.FC<DrtRegistryProps> = ({ employees, settings }) => {
  const [records, setRecords] = useState<DrtRecord[]>(() => listDrtDocs());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmp, setFilterEmp] = useState<string>('all');
  const [previewRec, setPreviewRec] = useState<DrtRecord | null>(null);
  const [editingRec, setEditingRec] = useState<DrtRecord | null>(null);
  const [editLast, setEditLast] = useState('');
  const [editResume, setEditResume] = useState('');
  const [editNotResumed, setEditNotResumed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refresh = () => setRecords(listDrtDocs());

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (filterEmp !== 'all' && r.empId !== filterEmp) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.empName.toLowerCase().includes(q) ||
        DOC_LABELS[r.docType].toLowerCase().includes(q)
      );
    });
  }, [records, searchQuery, filterEmp]);

  const employeesWithRecords = useMemo(() => {
    const ids = Array.from(new Set(records.map(r => r.empId)));
    return employees.filter(e => ids.includes(e.id));
  }, [records, employees]);

  const startEdit = (rec: DrtRecord) => {
    setEditingRec(rec);
    setEditLast(rec.lastWorkDate || '');
    setEditResume(rec.resumeDate || '');
    setEditNotResumed(!!rec.notResumed);
    setPreviewRec(null);
  };

  const saveEdit = () => {
    if (!editingRec) return;
    const updated: DrtRecord = {
      ...editingRec,
      lastWorkDate: editLast,
      resumeDate: editNotResumed ? '' : editResume,
      notResumed: editNotResumed,
      employee: {
        ...editingRec.employee,
        lastWorkDate: editLast,
        resumeDate: editNotResumed ? '' : editResume,
        notResumed: editNotResumed
      }
    };
    upsertDrtDoc(updated);
    refresh();
    setEditingRec(null);
    showToast('تم تحديث الوثيقة في ارشيف وثائق CNAS ✓');
  };

  const handleDelete = (rec: DrtRecord) => {
    if (!confirm(`هل أنت متأكد من حذف هذه الوثيقة من ارشيف وثائق CNAS؟\n${DOC_LABELS[rec.docType]} — ${rec.empName}`)) return;
    deleteDrtDoc(rec.id);
    refresh();
    if (previewRec?.id === rec.id) setPreviewRec(null);
    if (editingRec?.id === rec.id) setEditingRec(null);
    showToast('تم حذف الوثيقة من السجل');
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#047857] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-bottom-3 print:hidden">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-6 sm:p-8 shadow-sm mb-6 print:hidden">
        <h2 className="text-xl sm:text-2xl font-black text-emerald-900 flex items-center gap-2 border-b-[3px] border-amber-500 pb-2">
          <Archive className="w-6 h-6 text-emerald-900" />
          <span>ارشيف وثائق CNAS ({records.length} وثيقة)</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#64748b] mt-2">
          تُحفظ هنا الوثائق المنجزة من مركز الوثائق (زر «حفظ في ارشيف وثائق CNAS» تحت وثائق ATS و DRT) لتعود إليها متى احتجت —
          معاينة كل وثيقة وحدها، وتعديل تواريخها، أو حذفها. يحتفظ السجل بآخر 10 وثائق لكل موظف ويحذف الأقدم تلقائياً.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#8b816d]" />
            <input
              type="text"
              placeholder="بحث باسم الموظف أو نوع الوثيقة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 bg-white border border-[#d4cbba] rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-[#047857]"
            />
          </div>
          <select
            value={filterEmp}
            onChange={e => setFilterEmp(e.target.value)}
            className="bg-white border border-[#d4cbba] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="all">جميع الموظفين</option>
            {employeesWithRecords.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Edit panel */}
      {editingRec && (
        <div className="bg-[#fffbeb] border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-sm mb-6 print:hidden">
          <h3 className="text-base font-black text-[#92400e] flex items-center gap-2 mb-3">
            <Edit className="w-4 h-4" />
            <span>تعديل تواريخ الوثيقة: {DOC_LABELS[editingRec.docType]} — {editingRec.empName}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold text-[#1e293b] mb-1">تاريخ آخر يوم عمل</label>
              <input
                type="date"
                value={editLast}
                onChange={e => setEditLast(e.target.value)}
                className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#047857]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1e293b] mb-1">تاريخ استئناف العمل</label>
              <input
                type="date"
                value={editResume}
                disabled={editNotResumed}
                onChange={e => setEditResume(e.target.value)}
                className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#047857] disabled:bg-[#f1f5f9] disabled:text-[#94a3b8]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none bg-white border border-amber-200 rounded-xl px-3 py-2">
              <input
                type="checkbox"
                checked={editNotResumed}
                onChange={e => setEditNotResumed(e.target.checked)}
                className="w-4 h-4 accent-[#047857]"
              />
              <span className="text-xs font-bold text-[#1e293b]">لم يستأنف عمله إلى يومنا هذا</span>
            </label>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={saveEdit}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-5 py-2 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
            >
              💾 حفظ التعديل
            </button>
            <button
              type="button"
              onClick={() => setEditingRec(null)}
              className="bg-[#eee] hover:bg-[#ddd] text-[#333] px-5 py-2 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Records table */}
      <div className={`bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-6 sm:p-8 shadow-sm ${previewRec ? 'print:hidden' : ''}`}>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[#827866] text-sm">
            {records.length === 0
              ? 'السجل فارغ بعد — أنجز وثيقة ATS أو DRT من مركز الوثائق ثم اضغط «حفظ في ارشيف وثائق CNAS» لتظهر هنا.'
              : 'لا توجد وثائق مطابقة لشروط البحث.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-[#d1fae5] text-[#065f46] border-b border-[#a7f3d0]">
                  <th className="p-3 font-bold">#</th>
                  <th className="p-3 font-bold">الموظف</th>
                  <th className="p-3 font-bold">الوثيقة</th>
                  <th className="p-3 font-bold">تاريخ آخر يوم عمل</th>
                  <th className="p-3 font-bold">تاريخ الاستئناف</th>
                  <th className="p-3 font-bold">تاريخ الحفظ</th>
                  <th className="p-3 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filtered.map((rec, i) => (
                  <tr key={rec.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="p-3 text-[#7a7261]">{i + 1}</td>
                    <td className="p-3 font-bold text-[#0f172a]">{rec.empName}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 bg-[#eef5ff] text-[#004e9a] px-2 py-1 rounded-lg font-bold">
                        <FileText className="w-3.5 h-3.5" />
                        {DOC_LABELS[rec.docType]}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{rec.lastWorkDate ? rec.lastWorkDate.replace(/-/g, '/') : '—'}</td>
                    <td className="p-3 font-mono">
                      {rec.notResumed ? (
                        <span className="text-amber-700 font-bold">لم يستأنف إلى يومنا هذا</span>
                      ) : (
                        rec.resumeDate ? rec.resumeDate.replace(/-/g, '/') : '—'
                      )}
                    </td>
                    <td className="p-3 font-mono text-[#524b3c]">{fmtDate(rec.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setPreviewRec(rec); setEditingRec(null); }}
                          className="bg-[#047857] hover:bg-[#115037] text-white p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="معاينة الوثيقة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">معاينة</span>
                        </button>
                        <button
                          onClick={() => startEdit(rec)}
                          className="bg-[#2c4e80] hover:bg-[#1f375a] text-white p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="تعديل تواريخ الوثيقة"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="bg-[#d8463d] hover:bg-[#ad322a] text-white p-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="حذف من السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden lg:inline">حذف</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual preview — one document at a time */}
      {previewRec && (
        <div className="bg-[#ffffff] border-2 border-[#047857] rounded-3xl p-5 sm:p-6 shadow-sm mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e2e8f0] print:hidden">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0f172a] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#047857]" />
                <span>معاينة: {DOC_LABELS[previewRec.docType]} — {previewRec.empName}</span>
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                محفوظة بتاريخ {fmtDate(previewRec.createdAt)} — هذه نسخة الأرشيف كما أُنجزت، وتُعرض وحدها.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold cursor-pointer"
              >
                🖨 طباعة
              </button>
              <button
                type="button"
                onClick={() => setPreviewRec(null)}
                className="bg-[#eee] hover:bg-[#ddd] text-[#333] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>إغلاق المعاينة</span>
              </button>
            </div>
          </div>
          <div className="flex justify-center pb-6">
            {previewRec.docType === 'ats-front' && (
              <AutoFitScale docWidth={794}>
                <ATSFront key={previewRec.id} employee={previewRec.employee} settings={settings} />
              </AutoFitScale>
            )}
            {previewRec.docType === 'ats-back' && (
              <AutoFitScale docWidth={1123}>
                <ATSBack key={previewRec.id} employee={previewRec.employee} settings={settings} />
              </AutoFitScale>
            )}
            {previewRec.docType === 'drt' && (
              <AutoFitScale docWidth={529}>
                <DrtExcelDoc key={previewRec.id} employee={previewRec.employee} settings={settings} />
              </AutoFitScale>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
