/* ============================================================
   خدمة الأجور والتقاعد — العملية الرئيسية لتطبيق سطح المكتب
   تطبيق مستقل: يحمّل الواجهة من ملفات محلية ويعمل دون إنترنت،
   البيانات في ملف JSON على القرص مع نسخ احتياطية تلقائية،
   ترخيص سنوي بأكواد تفعيل، ونظام تحديث (من الموقع أو بملف).
   ============================================================ */
const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execFile } = require('child_process');
const licenseManager = require('./license-manager.cjs');

// بيانات التطبيق: ملف JSON في مجلد بيانات المستخدم + نسخ احتياطية مؤرخة
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const DATA_FILE = path.join(DATA_DIR, 'payroll-data.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
// مجلد التحديثات: تُستخرج حزم التحديث هنا وتُحمَّل عند الإقلاع التالي
const UPDATES_DIR = path.join(app.getPath('userData'), 'updates');
const STAGED_DIR = path.join(UPDATES_DIR, 'staged');
const UPDATE_URL = 'https://service-paie.pages.dev/desktop-update.json';

function ensureDirs() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.mkdirSync(UPDATES_DIR, { recursive: true });
}

function readStoreFile() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeStoreFile(store) {
  ensureDirs();
  // نسخة احتياطية قبل كل كتابة (نُبقي آخر 30)
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(DATA_FILE, path.join(BACKUP_DIR, `backup-${stamp}.json`));
      const olds = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup-'))
        .sort()
        .reverse();
      olds.slice(30).forEach(f => { try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch { /* ignore */ } });
    }
  } catch { /* النسخ الاحتياطي لا يعطل الكتابة */ }
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

/* ===== قناة IPC للتخزين ===== */
ipcMain.on('store:get', (event, key) => {
  const store = readStoreFile();
  const v = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
  event.returnValue = v == null ? null : String(v);
});

ipcMain.handle('store:set', (_e, key, value) => {
  try {
    const store = readStoreFile();
    store[key] = String(value);
    writeStoreFile(store);
    return true;
  } catch (err) {
    console.error('store:set failed', err);
    return false;
  }
});

ipcMain.handle('store:remove', (_e, key) => {
  try {
    const store = readStoreFile();
    delete store[key];
    writeStoreFile(store);
    return true;
  } catch {
    return false;
  }
});

/* ===== قناة IPC للترخيص (شاشة القفل) ===== */
ipcMain.on('license:get-sync', (event) => { event.returnValue = licenseManager.evaluate(); });
ipcMain.handle('license:get', () => licenseManager.evaluate());
ipcMain.handle('license:activate', (_e, code) => {
  const res = licenseManager.activate(code);
  return res;
});
ipcMain.on('license:done', () => { loadMainApp(); });

/* ===== قناة IPC للتحديثات ===== */
ipcMain.handle('update:info', () => ({
  version: app.getVersion(),
  pending: getPendingUpdate(),
  staging: fs.existsSync(path.join(STAGED_DIR, 'app', 'index.html'))
}));
ipcMain.handle('update:check', async () => {
  try { return await checkForUpdate(true); } catch (e) { return { error: String(e && e.message || e) }; }
});
ipcMain.handle('update:installFile', async () => {
  try { return await installUpdateFromFile(); } catch (e) { return { error: String(e && e.message || e) }; }
});
ipcMain.handle('update:apply', () => {
  app.relaunch();
  app.exit(0);
});

/* فتح مجلد البيانات/النسخ الاحتياطية من قائمة الملفات */
function openDataFolder() {
  ensureDirs();
  shell.openPath(DATA_DIR);
}

let mainWindow = null;

/* مسار واجهة التطبيق: حزمة التحديث المُثبَّتة إن وُجدت وإلا النسخة الأصلية */
function rendererIndex() {
  const staged = path.join(STAGED_DIR, 'app', 'index.html');
  if (fs.existsSync(staged)) return staged;
  return path.join(__dirname, '..', 'dist', 'index.html');
}

function getPendingUpdate() {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(STAGED_DIR, 'app', 'manifest.json'), 'utf8'));
    return m.version || null;
  } catch { return null; }
}

function createWindow() {
  const licenseState = licenseManager.evaluate();
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f8fafc',
    title: 'نظام تسيير الرواتب والتقاعد',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  // القفل أولاً: عند انتهاء الترخيص أو الإيقاف عن بعد تُحمَّل شاشة التفعيل فقط
  if (licenseState.locked) {
    mainWindow.loadFile(path.join(__dirname, 'license-gate.html'));
  } else {
    mainWindow.loadFile(rendererIndex());
  }

  // الروابط الخارجية (البوابة، GitHub...) تفتح في متصفح النظام لا داخل التطبيق
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

/* فتح التطبيق بعد تفعيل ناجح من شاشة القفل */
function loadMainApp() {
  if (mainWindow) {
    const licenseState = licenseManager.evaluate();
    if (!licenseState.locked) mainWindow.loadFile(rendererIndex());
  }
}

/* ===== فحص دوري أثناء التشغيل: انتهاء الترخيص أو إيقاف عن بعد ===== */
let currentlyLocked = null;
setInterval(() => {
  const st = licenseManager.evaluate();
  if (currentlyLocked === null) { currentlyLocked = st.locked; return; }
  if (st.locked !== currentlyLocked && mainWindow) {
    currentlyLocked = st.locked;
    mainWindow.loadFile(st.locked
      ? path.join(__dirname, 'license-gate.html')
      : rendererIndex());
  }
}, 10 * 60 * 1000);

/* ===== نظام التحديث ===== */
function compareVersions(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

function sendToWindow(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function netFetch(url, ms = 8000) {
  const { net } = require('electron');
  return net.fetch(url, { timeout: ms });
}

async function checkForUpdate(interactive) {
  const res = await netFetch(UPDATE_URL);
  if (!res.ok) throw new Error('تعذّر الوصول لخادم التحديثات (' + res.status + ')');
  const manifest = await res.json();
  const available = compareVersions(manifest.version, app.getVersion()) > 0;
  if (interactive) {
    if (available) {
      const r = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'تحديث جديد',
        message: `يتوفر إصدار جديد: ${manifest.version} (الإصدار الحالي ${app.getVersion()})`,
        detail: (manifest.notes || '') + `\n\nهل تريد تنزيل التحديث الآن؟`,
        buttons: ['تنزيل وتثبيت', 'إلغاء'],
        defaultId: 0
      });
      if (r.response === 0) {
        sendToWindow('update:progress', { phase: 'download', pct: 0 });
        try {
          await downloadAndStageUpdate(manifest);
          askRestartToUpdate(manifest.version);
        } catch (e) {
          dialog.showErrorBox('فشل التحديث', String(e && e.message || e));
        } finally {
          sendToWindow('update:progress', { phase: 'done' });
        }
      }
    } else {
      dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'لا يوجد تحديث',
        message: 'أنت تستخدم أحدث إصدار (' + app.getVersion() + ').',
        buttons: ['حسناً']
      });
    }
  }
  return {
    available,
    current: app.getVersion(),
    latest: manifest.version,
    notes: manifest.notes || '',
    size: manifest.size || 0
  };
}

async function downloadAndStageUpdate(manifest, localFile) {
  const { net } = require('electron');
  ensureDirs();
  const zipPath = path.join(UPDATES_DIR, 'update-package.zip');
  if (localFile) {
    // تثبيت من ملف محلي اختاره المستخدم
    fs.copyFileSync(localFile, zipPath);
    sendToWindow('update:progress', { phase: 'download', pct: 100 });
  } else {
    await new Promise((resolve, reject) => {
      const req = net.request(manifest.url);
      const file = fs.createWriteStream(zipPath);
      let received = 0;
      const total = manifest.size || 0;
      req.on('response', r => {
        if (r.statusCode !== 200) { file.close(); reject(new Error('فشل التنزيل (' + r.statusCode + ')')); return; }
        r.on('data', c => {
          received += c.length;
          file.write(c);
          if (total) sendToWindow('update:progress', { phase: 'download', pct: Math.min(99, Math.round(received / total * 100)) });
        });
        r.on('end', () => { file.end(() => resolve()); });
      });
      req.on('error', e => { file.close(); reject(e); });
      req.end();
    });
  }

  // التحقق من السلامة (SHA-256 من بيان التحديث)
  if (manifest.sha256) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
    if (hash !== manifest.sha256) {
      fs.unlinkSync(zipPath);
      throw new Error('فشل التحقق من سلامة ملف التحديث — أعد المحاولة.');
    }
  }

  // فك الحزمة (bsdtar في ويندوز يدعم zip — بمسار كامل تفادياً لـ Git Bash tar)
  const TAR = process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar';
  const tmpDir = path.join(UPDATES_DIR, 'staged-tmp');
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  await new Promise((resolve, reject) => {
    execFile(TAR, ['-xf', zipPath.replace(/\\/g, '/'), '-C', tmpDir.replace(/\\/g, '/')], { timeout: 120000 }, err => err ? reject(new Error('فشل فك حزمة التحديث: ' + err.message)) : resolve());
  });

  if (!fs.existsSync(path.join(tmpDir, 'app', 'index.html'))) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error('حزمة التحديث غير صالحة (لا تحتوي app/index.html).');
  }
  fs.rmSync(STAGED_DIR, { recursive: true, force: true });
  fs.renameSync(tmpDir, STAGED_DIR);
  try { fs.unlinkSync(zipPath); } catch { /* ignore */ }
  sendToWindow('update:progress', { phase: 'staged', version: manifest.version });
}

function askRestartToUpdate(version) {
  const r = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: 'التحديث جاهز',
    message: `تم تثبيت تحديث الإصدار ${version} بنجاح.`,
    detail: 'سيُطبَّق التحديث عند إعادة تشغيل التطبيق. هل تريد إعادة التشغيل الآن؟',
    buttons: ['إعادة التشغيل الآن', 'لاحقاً'],
    defaultId: 0
  });
  if (r === 0) { app.relaunch(); app.exit(0); }
}

async function installUpdateFromFile() {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر ملف التحديث',
    filters: [{ name: 'حزمة تحديث', extensions: ['zip'] }],
    properties: ['openFile']
  });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  try {
    await downloadAndStageUpdate({ size: fs.statSync(r.filePaths[0]).size }, r.filePaths[0]);
    sendToWindow('update:progress', { phase: 'done' });
    askRestartToUpdate(getPendingUpdate() || '');
    return { ok: true };
  } catch (e) {
    sendToWindow('update:progress', { phase: 'done' });
    dialog.showErrorBox('فشل تثبيت التحديث', String(e && e.message || e));
    return { error: String(e && e.message || e) };
  }
}

/* ===== بروتوكول servicepaie:// — زر التحديث من الموقع يفتح التطبيق مباشرة ===== */
function handleProtocolUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname === 'update' || u.pathname.replace(/^\/+/, '') === 'update' || u.host === 'update') {
      if (mainWindow) checkForUpdate(true).catch(() => {});
    }
  } catch { /* ignore */ }
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('servicepaie', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('servicepaie');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
    const urlArg = argv.find(a => a.startsWith('servicepaie://'));
    if (urlArg) handleProtocolUrl(urlArg);
  });

  app.whenReady().then(() => {
    ensureDirs();
    licenseManager.init(app.getPath('userData'));
    buildMenu();
    createWindow();
    currentlyLocked = licenseManager.evaluate().locked;

    // مفتاح الإيقاف عن بعد + حالة السحابة (أفضل جهد — لا شيء يتعطل دون شبكة)
    licenseManager.checkCloudStatus().then(() => {
      const st = licenseManager.evaluate();
      if (st.locked !== currentlyLocked && mainWindow) {
        currentlyLocked = st.locked;
        mainWindow.loadFile(st.locked ? path.join(__dirname, 'license-gate.html') : rendererIndex());
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('open-url', (e, url) => { e.preventDefault(); handleProtocolUrl(url); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* قائمة عربية مبسطة */
function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'ملف',
      submenu: [
        { label: 'فتح مجلد البيانات والنسخ الاحتياطية', click: openDataFolder },
        { type: 'separator' },
        { label: 'تثبيت تحديث من ملف…', click: () => { installUpdateFromFile(); } },
        {
          label: 'طباعة',
          accelerator: 'CmdOrCtrl+P',
          click: () => { if (mainWindow) mainWindow.webContents.print({ silent: false, printBackground: true }); }
        },
        { type: 'separator' },
        { label: 'خروج', role: 'quit' }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        { label: 'إعادة تحميل', role: 'reload' },
        { label: 'تكبير', role: 'zoomIn' },
        { label: 'تصغير', role: 'zoomOut' },
        { label: 'الحجم الأصلي', role: 'resetZoom' },
        { label: 'ملء الشاشة', role: 'togglefullscreen' },
        { label: 'أدوات المطور', role: 'toggleDevTools' }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'التحقق من التحديثات…',
          click: () => { checkForUpdate(true).catch(e => dialog.showErrorBox('تعذّر التحقق', String(e && e.message || e))); }
        },
        {
          label: 'حول التطبيق',
          click: () => {
            const lic = licenseManager.evaluate();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول التطبيق',
              message: 'نظام تسيير الرواتب والتقاعد',
              detail: `تطبيق سطح مكتب مستقل — يعمل دون إنترنت.\nالإصدار ${app.getVersion()}${lic.locked ? '' : (getPendingUpdate() ? ` — تحديث ${getPendingUpdate()} جاهز للتطبيق عند إعادة التشغيل` : '')}\n\n${lic.locked ? 'الترخيص: مقفل — ' + (lic.title || '') : 'الترخيص: سارٍ حتى ' + lic.expiry + ' (بقي ' + lic.daysLeft + ' يوماً)'}\nرقم الجهاز: ${lic.machineId}\n\nالبيانات محفوظة في:\n${DATA_DIR}`,
              buttons: ['حسناً']
            });
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}
