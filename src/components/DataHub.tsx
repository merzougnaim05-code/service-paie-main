import React, { useState } from 'react';
import { Settings, PointTable, PointChangeRow, CustomAllowance } from '../types';
import { BUILTIN_ALLOWANCE_KEYS } from '../data/salaryGrids';
import { resolvePointValue, fmt } from '../utils/salaryCalculator';
import {
  Database,
  Plus,
  Trash2,
  Save,
  Info,
  Table2,
  HandCoins,
  Power,
  CheckCircle2
} from 'lucide-react';

interface DataHubProps {
  settings: Settings;
  onSaveSettings: (s: Settings) => void;
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* مفتاح تفعيل/تعطيل على شكل زر حبة */
const Toggle: React.FC<{ on: boolean; onChange: () => void; onLabel?: string; offLabel?: string }> = ({
  on,
  onChange,
  onLabel = 'مفعلة',
  offLabel = 'معطلة'
}) => (
  <button
    type="button"
    onClick={onChange}
    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer whitespace-nowrap ${
      on
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
        : 'bg-slate-200 hover:bg-slate-300 text-slate-600 border-slate-300'
    }`}
    title={on ? 'اضغط للتعطيل — تُستبعد من كل الوثائق' : 'اضغط للتفعيل — تدخل في الحساب'}
  >
    <Power className="w-3 h-3" />
    <span>{on ? onLabel : offLabel}</span>
  </button>
);

const inputCls =
  'w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#047857]';

export const DataHub: React.FC<DataHubProps> = ({ settings, onSaveSettings }) => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const patch = (p: Partial<Settings>, msg = 'تم الحفظ — طُبّق على كل الوثائق ✓') => {
    onSaveSettings({ ...settings, ...p });
    showToast(msg);
  };

  const currentYear = new Date().getFullYear();
  const effectiveVal = resolvePointValue(settings, currentYear);

  /* ===== عمليات جداول النقاط ===== */
  const tables = settings.pointTables || [];

  const addTable = () => {
    const t: PointTable = {
      id: uid(),
      name: 'جدول نقاط جديد',
      decree: '',
      basePoints: settings.pointValue || 45,
      fromYear: currentYear,
      toYear: undefined,
      note: '',
      active: true,
      rows: [
        { id: uid(), label: 'تغيير جديد', effectiveYear: currentYear, bonusPoints: 0, note: '', active: true }
      ]
    };
    patch({ pointTables: [...tables, t] }, 'أُضيف جدول جديد — عدّل بياناته ثم يُطبق تلقائياً ✓');
  };

  const updateTable = (id: string, p: Partial<PointTable>) => {
    patch({ pointTables: tables.map(t => (t.id === id ? { ...t, ...p } : t)) });
  };

  const deleteTable = (id: string) => {
    if (!window.confirm('حذف هذا الجدول بالكامل مع سطور تغييراته؟')) return;
    patch({ pointTables: tables.filter(t => t.id !== id) }, 'حُذف الجدول — أُعيد حساب الكشوف ✓');
  };

  const addRow = (tableId: string) => {
    const r: PointChangeRow = {
      id: uid(),
      label: 'تغيير جديد',
      effectiveYear: currentYear,
      bonusPoints: 0,
      note: '',
      active: true
    };
    patch({
      pointTables: tables.map(t =>
        t.id === tableId ? { ...t, rows: [...t.rows, r] } : t
      )
    }, 'أُضيف سطر تغيير جديد ✓');
  };

  const updateRow = (tableId: string, rowId: string, p: Partial<PointChangeRow>) => {
    patch({
      pointTables: tables.map(t =>
        t.id === tableId ? { ...t, rows: t.rows.map(r => (r.id === rowId ? { ...r, ...p } : r)) } : t
      )
    });
  };

  const deleteRow = (tableId: string, rowId: string) => {
    patch({
      pointTables: tables.map(t =>
        t.id === tableId ? { ...t, rows: t.rows.filter(r => r.id !== rowId) } : t
      )
    }, 'حُذف سطر التغيير — أُعيد الحساب ✓');
  };

  /* ===== عمليات المنح المخصصة ===== */
  const allowances = settings.customAllowances || [];

  const addAllowance = () => {
    const a: CustomAllowance = {
      id: uid(),
      name: 'منحة جديدة',
      type: 'fixed',
      value: 0,
      cnas: true,
      active: true,
      note: ''
    };
    patch({ customAllowances: [...allowances, a] }, 'أُضيفت منحة جديدة — عدّل نوعها وقيمتها ✓');
  };

  const updateAllowance = (id: string, p: Partial<CustomAllowance>) => {
    patch({ customAllowances: allowances.map(a => (a.id === id ? { ...a, ...p } : a)) });
  };

  const deleteAllowance = (id: string) => {
    if (!window.confirm('حذف هذه المنحة من كل الوثائق؟')) return;
    patch({ customAllowances: allowances.filter(a => a.id !== id) }, 'حُذفت المنحة — أُعيد الحساب ✓');
  };

  /* ===== تعطيل/تفعيل المنح النظامية ===== */
  const disabled = settings.disabledBuiltins || [];

  const toggleBuiltin = (key: string) => {
    const next = disabled.includes(key)
      ? disabled.filter(k => k !== key)
      : [...disabled, key];
    patch(
      { disabledBuiltins: next },
      next.includes(key)
        ? `عُطّلت المنحة "${key}" — استُبعدت من كل الكشوف ✓`
        : `فُعّلت المنحة "${key}" — عادت إلى الحساب ✓`
    );
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#047857] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span>{toast}</span>
        </div>
      )}

      {/* Control bar */}
      <div className="bg-[#ffffff] border border-[#a7f3d0] rounded-3xl p-5 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e2e8f0]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full mb-1">
              <Database className="w-3.5 h-3.5 text-amber-700" />
              <span>قاعدة البيانات المركزية — تسري تغييراتها على كل الكشوف والوثائق</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0f172a]">
              مركز الجداول والمعطيات
            </h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              جداول النقطة الاستدلالية بتغييراتها + المنح الجديدة والقديمة — كل تعديل أو تفعيل/تعطيل يُعاد به حساب كشوف الرواتب ووثائق CNR والوثائق الإدارية تلقائياً.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[#0f172a] text-white rounded-xl px-4 py-2 text-center shadow-md border border-amber-500/60">
              <div className="text-[10px] text-emerald-300 font-bold">النقطة السارية لسنة {currentYear}</div>
              <div className="text-lg font-black text-amber-400 font-mono">{fmt(effectiveVal)} دج</div>
            </div>
            <button
              onClick={addTable}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>جدول نقاط جديد</span>
            </button>
            <button
              onClick={addAllowance}
              className="bg-[#b45309] hover:bg-[#92400e] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>منحة جديدة</span>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-[#eef5ff] border border-[#b8d4fe] rounded-xl p-3 text-xs text-[#004e9a] flex items-start gap-2">
          <Info className="w-4 h-4 flex-shrink-0 text-[#0070C0] mt-0.5" />
          <span>
            <strong>كيف تعمل المركزية؟</strong> لكل جدول نقاط سطر يحدد سنة السريان والنقاط الإضافية — القيمة الفعلية = النقطة الأساس + آخر سطر ساري للسنة المطلوبة. المنح المخصصة تُضاف لكل الموظفين (نسبة تُحسب من الأجر التصاعدي: القاعدي + الخبرة، أو مبلغ ثابت). أي جدول أو منحة <b>معطلة</b> تُستبعد نهائياً من الحساب حتى إعادة تفعيلها.
          </span>
        </div>
      </div>

      {/* ================================================== */}
      {/* القسم 1: جداول النقطة الاستدلالية                   */}
      {/* ================================================== */}
      <div className="mb-8">
        <div className="relative rounded-2xl p-1 bg-gradient-to-r from-amber-500 via-emerald-600 to-amber-500 shadow-xl mb-4">
          <div className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 rounded-[14px] p-4 md:p-5 text-white flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center md:text-right">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0">
                <Table2 className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="text-base md:text-lg font-black">جداول النقطة الاستدلالية</div>
                <div className="text-[11px] text-emerald-200/80">كل جدول = قرار رسمي — وكل تغيير فيه = سطر بسنة السريان</div>
              </div>
            </div>
            <button
              onClick={addTable}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة جدول جديد
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {[...tables].sort((a, b) => (a.fromYear || 0) - (b.fromYear || 0)).map(t => {
            const appliesNow =
              t.active !== false &&
              (!t.fromYear || currentYear >= t.fromYear) &&
              (t.toYear == null || t.toYear <= 0 || currentYear <= t.toYear);
            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${t.active === false ? 'border-slate-300 opacity-70' : 'border-[#a7f3d0]'}`}
              >
                {/* Table header */}
                <div className="bg-[#f8fafc] border-b border-[#e2e8f0] p-3 flex flex-col lg:flex-row lg:items-end gap-3">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="block col-span-2">
                      <span className="block text-[10px] font-bold text-[#475569] mb-0.5">اسم الجدول / الشبكة</span>
                      <input className={inputCls} value={t.name} onChange={e => updateTable(t.id, { name: e.target.value })} />
                    </label>
                    <label className="block col-span-2">
                      <span className="block text-[10px] font-bold text-[#475569] mb-0.5">المرسوم المرجعي</span>
                      <input className={inputCls} value={t.decree} onChange={e => updateTable(t.id, { decree: e.target.value })} placeholder="مثال: المرسوم الرئاسي 27-100" />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] font-bold text-[#475569] mb-0.5">النقطة الأساس (دج)</span>
                      <input type="number" className={inputCls + ' font-mono text-center'} value={t.basePoints} onChange={e => updateTable(t.id, { basePoints: Number(e.target.value) || 0 })} />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] font-bold text-[#475569] mb-0.5">من سنة</span>
                      <input type="number" className={inputCls + ' font-mono text-center'} value={t.fromYear} onChange={e => updateTable(t.id, { fromYear: Number(e.target.value) || 0 })} />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] font-bold text-[#475569] mb-0.5">إلى سنة (اختياري)</span>
                      <input type="number" className={inputCls + ' font-mono text-center'} value={t.toYear ?? ''} onChange={e => updateTable(t.id, { toYear: e.target.value ? Number(e.target.value) : undefined })} placeholder="—" />
                    </label>
                    <label className="block">
                      <span className="block text-[10px] font-bold text-[#475569] mb-0.5">ملاحظة</span>
                      <input className={inputCls} value={t.note || ''} onChange={e => updateTable(t.id, { note: e.target.value })} />
                    </label>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {appliesNow && (
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-full whitespace-nowrap">
                        تطبق الآن على {currentYear}
                      </span>
                    )}
                    <Toggle on={t.active !== false} onChange={() => updateTable(t.id, { active: t.active === false })} onLabel="الجدول مفعّل" offLabel="الجدول معطّل" />
                    <button
                      onClick={() => deleteTable(t.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                      title="حذف الجدول بالكامل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rows (تغييرات الجدول) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-[#1e293b] border-b border-[#e2e8f0]">
                        <th className="p-2 font-bold">بيان التغيير</th>
                        <th className="p-2 font-bold w-[110px] text-center">سنة السريان</th>
                        <th className="p-2 font-bold w-[120px] text-center">نقاط إضافية (+)</th>
                        <th className="p-2 font-bold w-[130px] text-center">القيمة الناتجة (دج)</th>
                        <th className="p-2 font-bold">ملاحظة</th>
                        <th className="p-2 font-bold w-[90px] text-center">الحالة</th>
                        <th className="p-2 w-[40px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0]">
                      {t.rows.map(r => (
                        <tr key={r.id} className={r.active === false ? 'opacity-50' : ''}>
                          <td className="p-1.5">
                            <input className={inputCls} value={r.label} onChange={e => updateRow(t.id, r.id, { label: e.target.value })} />
                          </td>
                          <td className="p-1.5">
                            <input type="number" className={inputCls + ' font-mono text-center'} value={r.effectiveYear} onChange={e => updateRow(t.id, r.id, { effectiveYear: Number(e.target.value) || 0 })} />
                          </td>
                          <td className="p-1.5">
                            <input type="number" className={inputCls + ' font-mono text-center font-bold text-[#047857]'} value={r.bonusPoints} onChange={e => updateRow(t.id, r.id, { bonusPoints: Number(e.target.value) || 0 })} />
                          </td>
                          <td className="p-1.5 text-center font-mono font-black text-[#0f172a]">
                            {fmt((Number(t.basePoints) || 0) + (Number(r.bonusPoints) || 0))}
                          </td>
                          <td className="p-1.5">
                            <input className={inputCls} value={r.note || ''} onChange={e => updateRow(t.id, r.id, { note: e.target.value })} />
                          </td>
                          <td className="p-1.5 text-center">
                            <Toggle on={r.active !== false} onChange={() => updateRow(t.id, r.id, { active: r.active === false })} onLabel="سارٍ" offLabel="موقوف" />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              onClick={() => deleteRow(t.id, r.id)}
                              className="p-1 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors cursor-pointer"
                              title="حذف السطر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-2.5 bg-[#fbfdff] border-t border-[#e2e8f0] flex justify-end">
                  <button
                    onClick={() => addRow(t.id)}
                    className="bg-white hover:bg-[#f1f5f9] text-[#047857] border border-[#047857] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة سطر جديد (تغيير)
                  </button>
                </div>
              </div>
            );
          })}

          {tables.length === 0 && (
            <div className="text-center py-8 text-sm text-[#64748b] bg-white border-2 border-dashed border-[#cbd5e1] rounded-2xl">
              لا توجد جداول — أضف جدول نقاط جديد أو أعد تحميل الصفحة لبذر الجداول الرسمية تلقائياً.
            </div>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* القسم 2: جدول المنح                                  */}
      {/* ================================================== */}
      <div>
        <div className="relative rounded-2xl p-1 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 shadow-lg mb-4">
          <div className="bg-gradient-to-b from-slate-900 via-stone-900 to-slate-900 rounded-[14px] p-4 md:p-5 text-white flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center md:text-right">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0">
                <HandCoins className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="text-base md:text-lg font-black">جدول المنح — الجديدة والقديمة</div>
                <div className="text-[11px] text-stone-300/80">منح مخصصة قابلة للتعديل (نسبة أو مبلغ ثابت) + المنح النظامية مع إمكانية التعطيل</div>
              </div>
            </div>
            <button
              onClick={addAllowance}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة منحة جديدة
            </button>
          </div>
        </div>

        {/* 2-أ: المنح المخصصة */}
        <div className="bg-white rounded-2xl border-2 border-[#a7f3d0] shadow-sm overflow-hidden mb-6">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 text-sm font-black text-[#0f172a] flex items-center justify-between">
            <span>المنح المخصصة (تُضاف لكل الموظفين في كل الكشوف)</span>
            <span className="text-[10px] font-bold text-[#64748b]">{allowances.filter(a => a.active !== false).length} مفعلة / {allowances.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-[#f1f5f9] text-[#1e293b] border-b border-[#e2e8f0]">
                  <th className="p-2 font-bold">اسم المنحة</th>
                  <th className="p-2 font-bold w-[130px] text-center">النوع</th>
                  <th className="p-2 font-bold w-[120px] text-center">القيمة</th>
                  <th className="p-2 font-bold w-[110px] text-center">القيمة الشهرية (دج)</th>
                  <th className="p-2 font-bold w-[90px] text-center">في الضمان</th>
                  <th className="p-2 font-bold w-[90px] text-center">الحالة</th>
                  <th className="p-2 w-[40px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {allowances.map(a => (
                  <tr key={a.id} className={a.active === false ? 'opacity-50' : ''}>
                    <td className="p-1.5">
                      <input className={inputCls + ' font-bold'} value={a.name} onChange={e => updateAllowance(a.id, { name: e.target.value })} />
                    </td>
                    <td className="p-1.5">
                      <select
                        className={inputCls + ' text-center'}
                        value={a.type}
                        onChange={e => updateAllowance(a.id, { type: e.target.value as 'percent' | 'fixed' })}
                      >
                        <option value="percent">نسبة %</option>
                        <option value="fixed">مبلغ ثابت</option>
                      </select>
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        className={inputCls + ' font-mono text-center font-bold text-[#b45309]'}
                        value={a.value}
                        onChange={e => updateAllowance(a.id, { value: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="p-1.5 text-center font-mono font-bold text-[#0f172a]">
                      {a.value ? fmt(a.type === 'fixed' ? a.value : 0) : '—'}
                      {a.type === 'percent' && <span className="block text-[9px] text-[#64748b] font-sans">% من الأجر التصاعدي لكل موظف</span>}
                    </td>
                    <td className="p-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={!!a.cnas}
                        onChange={e => updateAllowance(a.id, { cnas: e.target.checked })}
                        className="w-4 h-4 accent-[#047857] cursor-pointer"
                        title="هل تدخل في الأجر الخاضع للضمان الاجتماعي؟"
                      />
                    </td>
                    <td className="p-1.5 text-center">
                      <Toggle on={a.active !== false} onChange={() => updateAllowance(a.id, { active: a.active === false })} />
                    </td>
                    <td className="p-1.5 text-center">
                      <button
                        onClick={() => deleteAllowance(a.id)}
                        className="p-1 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors cursor-pointer"
                        title="حذف المنحة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {allowances.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-[#64748b]">
                      لا توجد منح مخصصة بعد — اضغط "إضافة منحة جديدة" لإضافة منحة بنسبة أو بمبلغ ثابت.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2-ب: المنح النظامية القديمة */}
        <div className="bg-white rounded-2xl border-2 border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 text-sm font-black text-[#0f172a] flex items-center justify-between">
            <span>المنح النظامية المدمجة (القديمة) — كل واحدة بزر تفعيل/تعطيل مستقل</span>
            <span className="text-[10px] font-bold text-[#64748b]">{BUILTIN_ALLOWANCE_KEYS.length - disabled.length} مفعلة / {BUILTIN_ALLOWANCE_KEYS.length}</span>
          </div>
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {BUILTIN_ALLOWANCE_KEYS.map(b => {
              const off = disabled.includes(b.key);
              return (
                <div
                  key={b.key}
                  className={`flex items-start justify-between gap-2 rounded-xl border p-2.5 transition-all ${off ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-[#f0fdf4] border-[#a7f3d0]'}`}
                >
                  <div className="min-w-0">
                    <div className={`text-xs font-black ${off ? 'text-slate-500 line-through' : 'text-[#0f172a]'}`}>{b.key}</div>
                    <div className="text-[10px] text-[#64748b] leading-tight mt-0.5">{b.note}</div>
                  </div>
                  <Toggle on={!off} onChange={() => toggleBuiltin(b.key)} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Save hint */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#64748b]">
          <Save className="w-3.5 h-3.5" />
          <span>كل تعديل يُحفظ تلقائياً ويُعاد به حساب كشوف الرواتب والوثائق فوراً — لا حاجة لأي زر حفظ.</span>
        </div>
      </div>
    </div>
  );
};
