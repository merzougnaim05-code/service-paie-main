/* جسر آمن بين واجهة التطبيق وعملية التخزين على القرص */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('payrollDesktop', {
  isDesktop: true,
  // قراءة متزامنة (ملف صغير — لا يذكر تأثيره على الأداء)
  readData: (key) => ipcRenderer.sendSync('store:get', key),
  // كتابة غير متزامنة (مع نسخة احتياطية تلقائية قبل كل كتابة)
  writeData: (key, value) => ipcRenderer.invoke('store:set', key, value),
  removeData: (key) => ipcRenderer.invoke('store:remove', key)
});
