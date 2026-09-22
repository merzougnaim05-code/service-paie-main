import React, { useState } from 'react';
import { Settings } from '../types';
import { ALGERIAN_WILAYAS } from '../data/salaryGrids';
import { Settings as SettingsIcon, Save, RotateCcw, Building, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetAllData
}) => {
  const [formData, setFormData] = useState<Settings>({ ...settings });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (field: keyof Settings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    showToast('تم حفظ كافة إعدادات النظام بنجاح ✓');
  };

  return (
    <div className="py-6 max-w-4xl mx-auto px-4">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#176b4a] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-[#fffdfa] border border-[#d8d0bc] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-[#e5ddcb]">
          <div className="w-10 h-10 rounded-2xl bg-[#e9f2ec] flex items-center justify-center text-[#176b4a]">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a3d2b] font-['Cairo']">
              إعدادات النظام والمؤسسة والرواتب
            </h2>
            <p className="text-xs text-[#706856] mt-0.5">
              تُطبق هذه الإعدادات على كافة كشوفات الرواتب وطلائح السلك ووثائق التقاعد والضمان الاجتماعي.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institutional Settings */}
          <div className="bg-[#fcfbf7] border border-[#ded5be] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#176b4a] mb-4 flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>1. هوية المؤسسة والولاية</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  اسم المؤسسة التربوية أو الإدارية
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={e => handleChange('institution', e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  الولاية (من 58 ولاية جزائرية)
                </label>
                <input
                  type="text"
                  list="wilayas-list"
                  value={formData.wilaya}
                  onChange={e => handleChange('wilaya', e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
                <datalist id="wilayas-list">
                  {ALGERIAN_WILAYAS.map((w, idx) => (
                    <option key={idx} value={w} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  وكالة الضمان الاجتماعي (CNAS)
                </label>
                <input
                  type="text"
                  value={formData.cnasAgency}
                  onChange={e => handleChange('cnasAgency', e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  رقم صاحب العمل المنتسب بالضمان (N° Employeur)
                </label>
                <input
                  type="text"
                  value={formData.cnasNum}
                  onChange={e => handleChange('cnasNum', e.target.value)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>
            </div>
          </div>

          {/* Legal Constants */}
          <div className="bg-[#fcfbf7] border border-[#ded5be] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#176b4a] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>2. الثوابت القانونية والنسب المئوية لحساب الرواتب</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  قيمة النقطة الاستدلالية (دج)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pointValue}
                  onChange={e => handleChange('pointValue', Number(e.target.value) || 45)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  نسبة اقتطاع الضمان الاجتماعي (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cnasRate}
                  onChange={e => handleChange('cnasRate', Number(e.target.value) || 9)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  نسبة اقتطاع التعاضدية (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.mutuelleRate}
                  onChange={e => handleChange('mutuelleRate', Number(e.target.value) || 1)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  منحة الطفل الواحد (دج)
                </label>
                <input
                  type="number"
                  value={formData.childRate}
                  onChange={e => handleChange('childRate', Number(e.target.value) || 300)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#443e33] mb-1.5">
                  منحة الأجر الوحيد (دج)
                </label>
                <input
                  type="number"
                  value={formData.singleWageRate}
                  onChange={e => handleChange('singleWageRate', Number(e.target.value) || 800)}
                  className="w-full bg-white border border-[#cfc4ac] rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:border-[#176b4a]"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.auresEnabled}
                    onChange={e => handleChange('auresEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-[#176b4a] accent-[#176b4a]"
                  />
                  <span className="text-xs font-bold text-[#353026]">
                    تفعيل منحة الأوراس للمناطق الجبلية
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e2d9c5]">
            <button
              type="button"
              onClick={() => {
                if (confirm('هل أنت متأكد من استعادة بيانات الموظفين الافتراضية؟ سيتم تحديث السجل.')) {
                  onResetAllData();
                  showToast('تمت استعادة البيانات الافتراضية بنجاح ✓');
                }
              }}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة بيانات الموظفين الافتراضية</span>
            </button>

            <button
              type="submit"
              className="bg-[#176b4a] hover:bg-[#12553b] text-white px-8 py-3 rounded-xl font-black text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات المحدثة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
