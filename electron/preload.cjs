/* جسر آمن بين واجهة التطبيق وعملية الإدارة على القرص */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('payrollDesktop', {
  isDesktop: true,
  // قراءة متزامنة (ملف صغير — لا يذكر تأثيره على الأداء)
  readData: (key) => ipcRenderer.sendSync('store:get', key),
  // كتابة غير متزامنة (مع نسخة احتياطية تلقائية قبل كل كتابة)
  writeData: (key, value) => ipcRenderer.invoke('store:set', key, value),
  removeData: (key) => ipcRenderer.invoke('store:remove', key)
});

/* الترخيص: تستخدمه شاشة القفل ولوحة الإعدادات */
contextBridge.exposeInMainWorld('licenseBridge', {
  getState: () => ipcRenderer.sendSync('license:get-sync'),
  activate: (code) => ipcRenderer.invoke('license:activate', code),
  done: () => ipcRenderer.send('license:done')
});

/* التحديثات: فحص من الموقع، تثبيت ملف، إعادة تشغيل للتطبيق */
contextBridge.exposeInMainWorld('desktopUpdate', {
  info: () => ipcRenderer.invoke('update:info'),
  check: () => ipcRenderer.invoke('update:check'),
  installFile: () => ipcRenderer.invoke('update:installFile'),
  apply: () => ipcRenderer.invoke('update:apply'),
  onProgress: (cb) => ipcRenderer.on('update:progress', (_e, p) => cb(p))
});
