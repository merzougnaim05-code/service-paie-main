/* ============================================================
   بناء حزمة تحديث سطح المكتب ونشر ملف التحديث على الموقع
   الاستخدام:  npm run updatepack [-- --notes "ملاحظات الإصدار"]
   الخطوات:
     1) بناء الواجهة (vite build)
     2) ضغط dist في حزمة desktop/…zip (بنية app/)
     3) حساب SHA-256 وكتابة public/desktop-update.json
   ثم: commit + push → يُنشر على service-paie.pages.dev ويصبح
   التحديث متاحاً لكل المستخدمين (زر التحقق داخل التطبيق).
   ============================================================ */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PUBLIC_DESKTOP = path.join(ROOT, 'public', 'desktop');
const STAGE = path.join(ROOT, '.update-stage');
const pkg = require(path.join(ROOT, 'package.json'));
const VERSION = pkg.version;

function rm(p) { fs.rmSync(p, { recursive: true, force: true }); }

console.log('1/4 بناء الواجهة…');
execFileSync(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], { stdio: 'inherit', cwd: ROOT });

console.log('2/4 تجهيز الحزمة…');
rm(STAGE);
fs.mkdirSync(path.join(STAGE, 'app'), { recursive: true });
for (const f of fs.readdirSync(DIST)) {
  fs.cpSync(path.join(DIST, f), path.join(STAGE, 'app', f), { recursive: true });
}
// بيان داخل الحزمة: يقرؤه التطبيق عند التثبيت من ملف
fs.writeFileSync(path.join(STAGE, 'app', 'manifest.json'), JSON.stringify({ version: VERSION, date: new Date().toISOString() }, null, 2));

console.log('3/4 الضغط…');
fs.mkdirSync(PUBLIC_DESKTOP, { recursive: true });
const zipName = `service-paie-app-v${VERSION}.zip`;
const zipPath = path.join(PUBLIC_DESKTOP, zipName);
rm(zipPath);
// tar.exe في ويندوز (System32/bsdtar) يدعم إنشاء zip — نستعمل المسار الكامل
// لأن tar الخاص بـ Git Bash يعامل "C:\" كمضيف بعيد
const TAR = process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar';
execFileSync(TAR, ['-caf', zipPath.replace(/\\/g, '/'), 'app'], { cwd: STAGE, stdio: 'inherit' });
rm(STAGE);

console.log('4/4 حساب البصمة وكتابة desktop-update.json…');
const sha256 = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
const size = fs.statSync(zipPath).size;
const notesIdx = process.argv.indexOf('--notes');
const notes = notesIdx !== -1 && process.argv[notesIdx + 1] ? process.argv[notesIdx + 1] : `تحديث الإصدار ${VERSION}`;

const manifest = {
  version: VERSION,
  date: new Date().toISOString().slice(0, 10),
  notes,
  url: `https://service-paie.pages.dev/desktop/${zipName}`,
  sha256,
  size
};
fs.writeFileSync(path.join(ROOT, 'public', 'desktop-update.json'), JSON.stringify(manifest, null, 2));

console.log('');
console.log('✓ حزمة التحديث جاهزة:');
console.log('  ' + zipPath + `  (${(size / 1024 / 1024).toFixed(1)} MB)`);
console.log('✓ public/desktop-update.json:');
console.log(JSON.stringify(manifest, null, 2));
console.log('');
console.log('الخطوة التالية: commit + push لينشر الموقع الحزمة، ثم يستطيع المستخدمون التحديث من داخل التطبيق.');
