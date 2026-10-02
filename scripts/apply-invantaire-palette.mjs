// تطبيق خريطة ألوان invantaire على مكونات واجهة التطبيق (لا يلمس الوثائق الرسمية)
import fs from 'node:fs';

const FILES = [
  'C:/Users/naim/Desktop/service-paie-main/src/App.tsx',
  'C:/Users/naim/Desktop/service-paie-main/src/components/EmployeeRegistry.tsx',
  'C:/Users/naim/Desktop/service-paie-main/src/components/PayslipView.tsx',
  'C:/Users/naim/Desktop/service-paie-main/src/components/PayrollSheets.tsx',
  'C:/Users/naim/Desktop/service-paie-main/src/components/AdminDocs.tsx',
  'C:/Users/naim/Desktop/service-paie-main/src/components/SettingsView.tsx',
  'C:/Users/naim/Desktop/service-paie-main/src/components/PensionDocument.tsx'
];

// beige palette → invantaire palette (emerald / amber / slate)
const MAP = {
  // dark text
  '#2c271e': '#0f172a',
  '#1a3d2b': '#0f172a',
  '#1b3e2b': '#0f172a',
  '#443e33': '#1e293b',
  '#4a4437': '#1e293b',
  '#4a4335': '#1e293b',
  '#5c5647': '#1e293b',
  '#3e382c': '#1e293b',
  '#353026': '#1e293b',
  '#4e4738': '#475569',
  '#1b4332': '#065f46',
  // primary greens
  '#176b4a': '#047857',
  '#12553b': '#065f46',
  '#12583c': '#065f46',
  '#25543b': '#047857',
  // backgrounds
  '#f7f4ec': '#f1f5f9',
  '#fffdfa': '#ffffff',
  '#fcfbf7': '#f8fafc',
  '#faf8f2': '#f8fafc',
  '#faf7ee': '#f8fafc',
  '#f5f2e8': '#f1f5f9',
  '#f1ebe0': '#e2e8f0',
  '#f4efe4': '#f1f5f9',
  '#f7f4ea': '#f8fafc',
  '#fbf9f3': '#f8fafc',
  '#f0eae0': '#f1f5f9',
  '#eee7d8': '#e2e8f0',
  '#ede7d8': '#e2e8f0',
  '#eadeca': '#e2e8f0',
  '#e5ddcb': '#e2e8f0',
  '#e2d9c5': '#e2e8f0',
  '#ded5be': '#e2e8f0',
  '#ded6c2': '#e2e8f0',
  '#e6decb': '#e2e8f0',
  '#e0d7c2': '#e2e8f0',
  '#d9ceb4': '#e2e8f0',
  '#ece3cf': '#e2e8f0',
  '#e8e2d2': '#e2e8f0',
  '#d8d0bc': '#a7f3d0',
  '#cfc4ac': '#cbd5e1',
  // muted text
  '#706856': '#64748b',
  '#736c5b': '#64748b',
  '#736a58': '#64748b',
  '#807662': '#64748b',
  '#807661': '#64748b',
  '#8e8574': '#64748b',
  '#7e735e': '#64748b',
  '#706958': '#64748b',
  '#6c757d': '#64748b',
  // amber accents
  '#8a5a00': '#b45309',
  '#5c4300': '#92400e',
  '#f5eedb': '#fffbeb',
  '#e5d9b8': '#fde68a',
  '#f0e6cb': '#fef3c7'
};

const CLASS_MAP = [
  // amber solid buttons → invantaire amber style
  [/bg-amber-700\s+hover:bg-amber-800\s+text-white/g, 'bg-amber-500 hover:bg-amber-400 text-slate-950'],
  [/bg-amber-700\s+text-white/g, 'bg-amber-500 text-slate-950']
];

for (const file of FILES) {
  let src = fs.readFileSync(file, 'utf8');
  let count = 0;
  for (const [from, to] of Object.entries(MAP)) {
    const re = new RegExp(from.replace('#', '#'), 'gi');
    const hits = src.match(re);
    if (hits) {
      count += hits.length;
      src = src.replace(re, to);
    }
  }
  for (const [re, to] of CLASS_MAP) {
    const hits = src.match(re);
    if (hits) {
      count += hits.length;
      src = src.replace(re, to);
    }
  }
  fs.writeFileSync(file, src);
  console.log(file.split('/').pop(), '→', count, 'replacements');
}
console.log('DONE');
