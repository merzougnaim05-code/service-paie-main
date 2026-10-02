// رفع ملفات dist إلى Netlify عبر التدفق الرسمي: إنشاء نشر مع بصمات SHA1 ثم رفع الملفات المطلوبة
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cfg = require('C:/Users/naim/AppData/Roaming/netlify/Config/config.json');
const TOKEN = Object.values(cfg.users)[0].auth.token;
const SITE_ID = process.argv[2];
const ROOT = 'C:/Users/naim/Desktop/service-paie-main/dist';
const PROD = process.argv[3] === 'prod';

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(ROOT);

const api = (p, opts = {}) => fetch(`https://api.netlify.com/api/v1${p}`, {
  ...opts,
  headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) }
});

// 1) بصمات الملفات
const manifest = {};
for (const f of files) {
  const rel = '/' + path.relative(ROOT, f).split(path.sep).join('/');
  manifest[rel] = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
}

// 2) إنشاء النشر مع القائمة
const createRes = await api(`/sites/${SITE_ID}/deploys`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ files: manifest, draft: !PROD, async: false })
});
const deploy = await createRes.json();
if (!createRes.ok) {
  console.log('CREATE_FAILED:', createRes.status, JSON.stringify(deploy).slice(0, 400));
  process.exit(1);
}
console.log('DEPLOY_ID:', deploy.id, 'STATE:', deploy.state, 'REQUIRED:', (deploy.required || []).length, '/', files.length);

// 3) رفع الملفات المطلوبة فقط
const required = new Set(deploy.required || []);
for (const f of files) {
  const rel = '/' + path.relative(ROOT, f).split(path.sep).join('/');
  const sha = manifest[rel];
  if (!required.has(sha)) { console.log('SKIP (cached):', rel); continue; }
  const enc = rel.split('/').map(s => encodeURIComponent(s)).join('/');
  const res = await api(`/deploys/${deploy.id}/files${enc}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: fs.readFileSync(f)
  });
  console.log(res.status, rel);
  if (!res.ok) { console.log('ERR:', (await res.text()).slice(0, 300)); process.exit(1); }
}

// 4) انتظار الجهوزية
let state = deploy.state;
for (let i = 0; i < 30 && !['ready', 'error'].includes(state); i++) {
  await new Promise(r => setTimeout(r, 2000));
  const r = await api(`/deploys/${deploy.id}`);
  const d = await r.json();
  state = d.state;
}
console.log('FINAL_STATE:', state);
console.log('DRAFT_URL: https://' + deploy.id + '--service-paie-main.netlify.app');
console.log('PROD_URL: https://service-paie-main.netlify.app');
