/* ============================================================
   خدمة الأجور والتقاعد — العملية الرئيسية لتطبيق سطح المكتب
   تطبيق مستقل: يحمّل الواجهة من ملفات محلية ويعمل دون إنترنت،
   والبيانات في ملف JSON على القرص مع نسخ احتياطية تلقائية.
   ============================================================ */
const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// بيانات التطبيق: ملف JSON في مجلد بيانات المستخدم + نسخ احتياطية مؤرخة
const DATA_DIR = path.join(app.getPath('userData'), 'data');
const DATA_FILE = path.join(DATA_DIR, 'payroll-data.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

function ensureDirs() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
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

/* فتح مجلد البيانات/النسخ الاحتياطية من قائمة الملفات */
function openDataFolder() {
  ensureDirs();
  shell.openPath(DATA_DIR);
}

/* اختيار مكان حفظ تصدير PDF اليدوي ليس ضرورياً — التنزيلات تعمل عبر متصفح الملفات */

let mainWindow = null;

function createWindow() {
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

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

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

/* قائمة عربية مبسطة */
function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'ملف',
      submenu: [
        { label: 'فتح مجلد البيانات والنسخ الاحتياطية', click: openDataFolder },
        { type: 'separator' },
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
          label: 'حول التطبيق',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول التطبيق',
              message: 'نظام تسيير الرواتب والتقاعد',
              detail: `تطبيق سطح مكتب مستقل — يعمل دون إنترنت.\nالإصدار ${app.getVersion()}\n\nالبيانات محفوظة في:\n${DATA_DIR}`,
              buttons: ['حسناً']
            });
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  ensureDirs();
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
