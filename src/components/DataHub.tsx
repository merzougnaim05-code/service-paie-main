import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Settings, PointTable, PointChangeRow, PointCell, CustomAllowance, GrilleCategory, ZoneEntry } from '../types';
import { BUILTIN_ALLOWANCE_KEYS, buildOfficialCells, getGrilleForYear, ZONE_GROUP_POINTS, ALGERIAN_WILAYAS } from '../data/salaryGrids';
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
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Grid3X3,
  MapPin
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

/* ================================================================
   محرّر شبكة النقاط الاستدلالية: كل صنف × كل درجة (قابل للتعديل)
   الخلايا الصفراء = خلايا الجدول القابلة للتعديل
   الخلايا الرمادية = قيم الجريدة الرسمية المدمجة (تتحول لخلايا قابلة للتعديل عند أول تعديل)
   ================================================================ */
const GridEditor = React.memo<{
  tableId: string;
  cells: PointCell[];
  builtin: GrilleCategory[];
  pointValue: number;
  onEdit: (tableId: string, cat: string, grade: number, cellId: string | null, value: number) => void;
}>(({ tableId, cells, builtin, pointValue, onEdit }) => {
  const cellMap = useMemo(() => {
    const m = new Map<string, PointCell>();
    for (const c of cells) m.set(`${c.cat}|${c.grade}`, c);
    return m;
  }, [cells]);

  const gradeCount = builtin[0]?.ech.length || 12;
  const grades = Array.from({ length: gradeCount }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-[#cbd5e1] bg-white max-h-[520px] overflow-y-auto">
      <table className="text-[11px] border-collapse w-full">
        <thead>
          <tr className="bg-[#0f172a] text-white">
            <th className="sticky right-0 bg-[#0f172a] p-1.5 text-right font-black min-w-[110px] z-10">الصنف</th>
            {grades.map(g => (
              <th key={g} className="p-1 font-bold text-center border-r border-white/10 min-w-[60px] whitespace-nowrap">
                درجة {g}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {builtin.map(g => (
            <tr key={g.cat} className="odd:bg-[#f8fafc] even:bg-white border-b border-[#e2e8f0]">
              <td className="sticky right-0 bg-inherit p-1.5 font-black text-[#0f172a] whitespace-nowrap z-10 border-l border-[#e2e8f0]">
                {g.cat} <span className="text-[9px] text-[#64748b] font-bold">({g.group})</span>
              </td>
              {grades.map(grade => {
                const cell = cellMap.get(`${g.cat}|${grade}`);
                const fallbackVal = (Number(g.base) || 0) + (Number(g.ech[grade - 1]) || 0);
                const val = cell ? cell.points : fallbackVal;
                return (
                  <td key={grade} className="p-0.5 border-r border-[#e2e8f0]">
                    <input
                      type="number"
                      dir="ltr"
                      className={`w-full px-0.5 py-1 text-center font-mono text-[11px] rounded border focus:outline-none focus:border-[#047857] ${
                        cell ? 'bg-[#fffbeb] border-[#fcd34d] font-bold text-[#0f172a]' : 'bg-transparent border-transparent text-[#94a3b8]'
                      }`}
                      value={val}
                      title={`القيمة الشهرية لهذه الدرجة: ${fmt(val * pointValue)} دج`}
                      onChange={e => onEdit(tableId, g.cat, grade, cell?.id ?? null, Number(e.target.value) || 0)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export const DataHub: React.FC<DataHubProps> = ({ settings, onSaveSettings }) => {
  const [toast, setToast] = useState<string | null>(null);
  const [view, setView] = useState<Settings>(settings);
  const [openGrids, setOpenGrids] = useState<Record<string, boolean>>({});

  /* مرايا refs لتفادي الإغلاق القديم — كل تعديل يُركّب على أحدث حالة حتى مع النقر المتتالي السريع */
  const viewRef = useRef<Settings>(settings);
  const onSaveRef = useRef(onSaveSettings);
  useEffect(() => {
    viewRef.current = settings;
    setView(settings);
  }, [settings]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const patch = useCallback((p: Partial<Settings>, msg?: string) => {
    const next = { ...viewRef.current, ...p };
    viewRef.current = next;
    setView(next);
    onSaveRef.current(next);
    if (msg) showToast(msg);
  }, [showToast]);

  const scrollToId = (id: string) => {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 90);
  };

  const currentYear = new Date().getFullYear();
  const effectiveVal = resolvePointValue(view, currentYear);

  /* الجدول الذي تسري شبكته (خلاياه) على السنة الحالية */
  const activeGridTable = useMemo(
    () =>
      [...(view.pointTables || [])]
        .filter(
          t =>
            t.active !== false &&
            (t.cells?.length || 0) > 0 &&
            (!t.fromYear || currentYear >= Number(t.fromYear)) &&
            (t.toYear == null || Number(t.toYear) <= 0 || currentYear <= Number(t.toYear))
        )
        .sort((a, b) => (Number(b.fromYear) || 0) - (Number(a.fromYear) || 0))[0],
    [view.pointTables, currentYear]
  );

  /* ===== عمليات جداول النقاط ===== */
  const tables = view.pointTables || [];

  const addTable = () => {
    const t: PointTable = {
      id: uid(),
      name: 'جدول نقاط جديد',
      decree: '',
      basePoints: resolvePointValue(view, currentYear),
      fromYear: currentYear,
      toYear: undefined,
      note: '',
      active: true,
      rows: [
        { id: uid(), label: 'تغيير جديد', effectiveYear: currentYear, bonusPoints: 0, note: '', active: true }
      ],
      cells: buildOfficialCells(currentYear)
    };
    patch({ pointTables: [...tables, t] }, 'أُضيف جدول جديد بشبكته الرسمية — عدّل بياناته ثم يُطبق تلقائياً ✓');
    scrollToId(`tbl-${t.id}`);
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
    scrollToId(`prow-${r.id}`);
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

  /* تعديل خلية واحدة في شبكة صنف/درجة — أو إنشاؤها إن لم توجد بعد */
  const handleCellEdit = useCallback(
    (tableId: string, cat: string, grade: number, cellId: string | null, value: number) => {
      patch({
        pointTables: (viewRef.current.pointTables || []).map(t => {
          if (t.id !== tableId) return t;
          if (cellId) {
            return { ...t, cells: (t.cells || []).map(c => (c.id === cellId ? { ...c, points: value } : c)) };
          }
          const cell: PointCell = { id: uid(), cat, grade, points: value, active: true };
          return { ...t, cells: [...(t.cells || []), cell] };
        })
      });
    },
    [patch]
  );

  /* توليد/استرجاع الشبكة الرسمية لجدول من الشبكات المرفوعة من الجرائد الرسمية */
  const generateCells = (tableId: string, restore: boolean) => {
    const t = tables.find(x => x.id === tableId);
    if (!t) return;
    if (restore && !window.confirm(`استرجاع القيم الرسمية من الجريدة الرسمية لسنة ${t.fromYear}؟ ستفقد تعديلاتك على خلايا الشبكة.`)) return;
    patch(
      {
        pointTables: tables.map(x =>
          x.id === tableId ? { ...x, cells: buildOfficialCells(Number(x.fromYear) || currentYear) } : x
        )
      },
      restore ? 'استُرجعت القيم الرسمية من الجريدة الرسمية ✓' : 'وُلّدت شبكة النقاط الرسمية لكل صنف ودرجة ✓'
    );
    if (!restore) setOpenGrids(prev => ({ ...prev, [tableId]: true }));
  };

  /* ===== عمليات المنح المخصصة ===== */
  const allowances = view.customAllowances || [];

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
    scrollToId(`alw-${a.id}`);
  };

  const updateAllowance = (id: string, p: Partial<CustomAllowance>) => {
    patch({ customAllowances: allowances.map(a => (a.id === id ? { ...a, ...p } : a)) });
  };

  const deleteAllowance = (id: string) => {
    if (!window.confirm('حذف هذه المنحة من كل الوثائق؟')) return;
    patch({ customAllowances: allowances.filter(a => a.id !== id) }, 'حُذفت المنحة — أُعيد الحساب ✓');
  };

  /* ===== تعطيل/تفعيل المنح النظامية ===== */
  const disabled = view.disabledBuiltins || [];

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

  /* ===== تعويض المنطقة — المرسوم 82-183 ===== */
  const zoneEntries = view.zoneEntries || [];

  const addZone = () => {
    const zn: ZoneEntry = {
      id: uid(),
      wilaya: 'ورقلة',
      commune: 'بلدية جديدة',
      group: 'أ',
      subgroup: 'أ-1',
      points: 500,
      note: '',
      active: true
    };
    patch({ zoneEntries: [...zoneEntries, zn] }, 'أُضيفت بلدية لتعويض المنطقة ✓');
    scrollToId(`zone-${zn.id}`);
  };

  const updateZone = (id: string, p: Partial<ZoneEntry>) => {
    patch({ zoneEntries: zoneEntries.map(zn => (zn.id === id ? { ...zn, ...p } : zn)) });
  };

  const setZoneGroup = (id: string, group: 'أ' | 'ب' | 'ج') => {
    const first = ZONE_GROUP_POINTS[group][0];
    patch({
      zoneEntries: zoneEntries.map(zn =>
        zn.id === id ? { ...zn, group, subgroup: first.subgroup, points: first.points } : zn
      )
    });
  };

  const setZoneSubgroup = (id: string, group: 'أ' | 'ب' | 'ج', subgroup: string) => {
    const sub = ZONE_GROUP_POINTS[group].find(s => s.subgroup === subgroup);
    patch({
      zoneEntries: zoneEntries.map(zn =>
        zn.id === id && sub ? { ...zn, subgroup, points: sub.points } : zn
      )
    });
  };

  const deleteZone = (id: string) => {
    if (!window.confirm('حذف هذه البلدية من قائمة تعويض المنطقة؟')) return;
    patch({ zoneEntries: zoneEntries.filter(zn => zn.id !== id) }, 'حُذفت البلدية ✓');
  };

  return (
    <div className="py-6 max-w-6xl mx-auto px-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#047857] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm">
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
              جداول النقطة الاستدلالية بشبكاتها لكل صنف وكل درجة + المنح الجديدة والقديمة — كل تعديل أو تفعيل/تعطيل يُعاد به حساب كشوف الرواتب ووثائق CNR والوثائق الإدارية تلقائياً.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[#0f172a] text-white rounded-xl px-4 py-2 text-center shadow-md border border-amber-500/60">
              <div className="text-[10px] text-emerald-300 font-bold">النقطة السارية لسنة {currentYear}</div>
              <div className="text-lg font-black text-amber-400 font-mono">{fmt(effectiveVal)} دج</div>
              {activeGridTable && (
                <div className="text-[9px] text-emerald-200/80 font-bold mt-0.5">
                  شبكة «{activeGridTable.name}» تسري الآن
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={addTable}
              className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>جدول نقاط جديد</span>
            </button>
            <button
              type="button"
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
            <strong>كيف تعمل المركزية؟</strong> كل جدول يحمل قيمة النقطة (سطور التغيير) وشبكة النقاط الاستدلالية <b>لكل صنف وكل درجة</b> مرفوعة من الجرائد الرسمية وقابلة للتعديل — افتح «شبكة النقاط» في أي جدول لتعديل أي خلية. المنح المخصصة تُضاف لكل الموظفين (نسبة تُحسب من <b>الأجر الرئيسي</b>، أو مبلغ ثابت). أي جدول أو سطر أو منحة <b>معطل</b> يُستبعد نهائياً من الحساب حتى إعادة تفعيله.
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
                <div className="text-[11px] text-emerald-200/80">كل جدول = قرار رسمي — بشبكته الكاملة لكل صنف وكل درجة وسطور تغييراته</div>
              </div>
            </div>
            <button
              type="button"
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
            const gridOpen = !!openGrids[t.id];
            const builtinGrid = getGrilleForYear(Number(t.fromYear) || currentYear);
            const hasCells = (t.cells?.length || 0) > 0;
            return (
              <div
                key={t.id}
                id={`tbl-${t.id}`}
                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden scroll-mt-24 ${t.active === false ? 'border-slate-300 opacity-70' : 'border-[#a7f3d0]'}`}
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
                      <span className="block text-[10px] font-bold text-[#475569] mb-0.5">قيمة النقطة (دج)</span>
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
                      type="button"
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
                        <tr key={r.id} id={`prow-${r.id}`} className={`scroll-mt-24 ${r.active === false ? 'opacity-50' : ''}`}>
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
                              type="button"
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

                {/* شبكة النقاط لكل صنف وكل درجة */}
                <div className="border-t-2 border-[#e2e8f0] bg-[#fbfdff]">
                  <button
                    type="button"
                    onClick={() => setOpenGrids(prev => ({ ...prev, [t.id]: !prev[t.id] }))}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-black text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 flex-wrap">
                      <Grid3X3 className="w-4 h-4 text-[#047857]" />
                      <span>شبكة النقاط الاستدلالية — كل صنف × كل درجة</span>
                      <span className="text-[10px] font-bold text-[#64748b]">
                        {hasCells ? `${t.cells!.length} خلية قابلة للتعديل — الرقم الاستدلالي الكامل لكل درجة` : 'لا توجد خلايا بعد — ولّدها من الجريدة الرسمية'}
                      </span>
                    </span>
                    {gridOpen ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
                  </button>

                  {gridOpen && (
                    <div className="p-3 space-y-2">
                      {hasCells ? (
                        <>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[10px] text-[#64748b] font-bold">
                              عدّل أي خلية (الرقم الاستدلالي الكامل للدرجة) — يُحفظ ويُطبق فوراً على كل كشوف هذه الشبكة. القيمة الشهرية = الرقم × قيمة النقطة (تظهر عند التمرير فوق الخلية).
                            </span>
                            <button
                              type="button"
                              onClick={() => generateCells(t.id, true)}
                              className="bg-white hover:bg-[#f1f5f9] text-[#b45309] border border-[#b45309] px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              استرجاع قيم الجريدة الرسمية
                            </button>
                          </div>
                          <GridEditor
                            tableId={t.id}
                            cells={t.cells!}
                            builtin={builtinGrid}
                            pointValue={effectiveVal}
                            onEdit={handleCellEdit}
                          />
                        </>
                      ) : (
                        <div className="text-center py-4 space-y-2">
                          <div className="text-xs text-[#64748b] font-bold">
                            هذا الجدول لا يحمل شبكة نقاط بعد — ولّد الشبكة الرسمية (كل صنف × 12 درجة) من الجرائد الرسمية لسنة {Number(t.fromYear) || currentYear} ثم عدّل أي خلية.
                          </div>
                          <button
                            type="button"
                            onClick={() => generateCells(t.id, false)}
                            className="bg-[#047857] hover:bg-[#065f46] text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Grid3X3 className="w-4 h-4" />
                            توليد الشبكة الرسمية
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-white border-t border-[#e2e8f0] flex justify-end">
                  <button
                    type="button"
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
                <div className="text-[11px] text-stone-300/80">منح مخصصة قابلة للتعديل (نسبة من الأجر الرئيسي أو مبلغ ثابت) + المنح النظامية مع إمكانية التعطيل</div>
              </div>
            </div>
            <button
              type="button"
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
                  <tr key={a.id} id={`alw-${a.id}`} className={`scroll-mt-24 ${a.active === false ? 'opacity-50' : ''}`}>
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
                      {a.type === 'percent' && <span className="block text-[9px] text-[#64748b] font-sans">% من الأجر الرئيسي لكل موظف</span>}
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
                        type="button"
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
                      لا توجد منح مخصصة بعد — اضغط "إضافة منحة جديدة" لإضافة منحة بنسبة من الأجر الرئيسي أو بمبلغ ثابت.
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

        {/* ==================================================
            القسم 3: تعويض المنطقة — المرسوم 82-183
            ================================================== */}
        <div className="mt-8">
          <div className="relative rounded-2xl p-1 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 shadow-lg mb-4">
            <div className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 rounded-[14px] p-4 md:p-5 text-white flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center md:text-right">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <div className="text-base md:text-lg font-black">تعويض المنطقة — المرسوم 82-183</div>
                  <div className="text-[11px] text-emerald-200/80">
                    ثلاث مجموعات (أ، ب، ج) وكل مجموعة فروع وكل فرع بلدياتها — القوائم بمراسيم 93-130 و95-90 و96-62 و97-246
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => patch({ zoneAllowanceEnabled: view.zoneAllowanceEnabled === false }, view.zoneAllowanceEnabled === false ? 'فُعّل تعويض المنطقة في كل الوثائق ✓' : 'عُطّل تعويض المنطقة من كل الوثائق ✓')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border-2 transition-colors cursor-pointer ${view.zoneAllowanceEnabled === false ? 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700' : 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400'}`}
                >
                  <Power className="w-4 h-4" />
                  {view.zoneAllowanceEnabled === false ? 'المنحة معطّلة' : 'المنحة مفعّلة'}
                </button>
                <button
                  type="button"
                  onClick={addZone}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إضافة بلدية
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#eef5ff] border border-[#b8d4fe] rounded-xl p-3 text-xs text-[#004e9a] flex items-start gap-2 mb-4">
            <Info className="w-4 h-4 flex-shrink-0 text-[#0070C0] mt-0.5" />
            <span>
              <strong>كيفية الحساب (82-183):</strong> المنحة تتبع <b>الولاية والبلدية المدخلة في معطيات الموظف</b> — التعويض الشهري = النقاط × الأجر الأساسي الشهري ÷ 1000 (مثال: فرع أ-1 بـ500 نقطة = نصف الأجر الأساسي). أضف بلديات قوائم ولاياتك حسب مراسيم التحديث، فالقائمة أدناه تضم ما ورد في النماذج المرفقة وقابلة للتعديل والزيادة.
            </span>
          </div>

          <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden ${view.zoneAllowanceEnabled === false ? 'border-slate-300 opacity-70' : 'border-[#a7f3d0]'}`}>
            <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 text-sm font-black text-[#0f172a] flex items-center justify-between flex-wrap gap-2">
              <span>قائمة البلديات المؤهلة ({zoneEntries.filter(zn => zn.active !== false).length} مفعلة / {zoneEntries.length})</span>
              <span className="text-[10px] font-bold text-[#64748b]">تُعرض البلديات في نموذج الموظف حسب الولاية المختارة</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#1e293b] border-b border-[#e2e8f0]">
                    <th className="p-2 font-bold w-[150px]">الولاية</th>
                    <th className="p-2 font-bold">البلدية</th>
                    <th className="p-2 font-bold w-[100px] text-center">المجموعة</th>
                    <th className="p-2 font-bold w-[110px] text-center">الفرع</th>
                    <th className="p-2 font-bold w-[100px] text-center">النقاط</th>
                    <th className="p-2 font-bold">المرجع</th>
                    <th className="p-2 font-bold w-[90px] text-center">الحالة</th>
                    <th className="p-2 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {zoneEntries.map(zn => (
                    <tr key={zn.id} id={`zone-${zn.id}`} className={`scroll-mt-24 ${zn.active === false ? 'opacity-50' : ''}`}>
                      <td className="p-1.5">
                        <select className={inputCls} value={zn.wilaya} onChange={e => updateZone(zn.id, { wilaya: e.target.value })}>
                          {ALGERIAN_WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input className={inputCls + ' font-bold'} value={zn.commune} onChange={e => updateZone(zn.id, { commune: e.target.value })} />
                      </td>
                      <td className="p-1.5 text-center">
                        <select className={inputCls + ' text-center'} value={zn.group} onChange={e => setZoneGroup(zn.id, e.target.value as 'أ' | 'ب' | 'ج')}>
                          <option value="أ">أ</option>
                          <option value="ب">ب</option>
                          <option value="ج">ج</option>
                        </select>
                      </td>
                      <td className="p-1.5 text-center">
                        <select className={inputCls + ' text-center'} value={zn.subgroup} onChange={e => setZoneSubgroup(zn.id, zn.group, e.target.value)}>
                          {ZONE_GROUP_POINTS[zn.group].map(s => <option key={s.subgroup} value={s.subgroup}>{s.subgroup}</option>)}
                        </select>
                      </td>
                      <td className="p-1.5">
                        <input type="number" className={inputCls + ' font-mono text-center font-bold text-[#047857]'} value={zn.points} onChange={e => updateZone(zn.id, { points: Number(e.target.value) || 0 })} />
                      </td>
                      <td className="p-1.5">
                        <input className={inputCls} value={zn.note || ''} onChange={e => updateZone(zn.id, { note: e.target.value })} placeholder="93-130 / 95-90 ..." />
                      </td>
                      <td className="p-1.5 text-center">
                        <Toggle on={zn.active !== false} onChange={() => updateZone(zn.id, { active: zn.active === false })} />
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => deleteZone(zn.id)}
                          className="p-1 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors cursor-pointer"
                          title="حذف البلدية"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {zoneEntries.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-[#64748b]">
                        لا توجد بلديات — اضغط "إضافة بلدية" لبناء قائمة ولاياتك.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
