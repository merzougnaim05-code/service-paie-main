/* توليد أيقونة التطبيق من electron/icon-src.html
   التشغيل: npx electron scripts/icon-render.cjs */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// مهلة قسرية: لا نعلق أبداً
setTimeout(() => { console.error('timeout'); app.exit(1); }, 45000);

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1024, height: 1024, show: true, frame: false,
    x: -2600, y: 0, resizable: false,
    backgroundColor: '#00000000'
  });
  await win.loadFile(path.join(__dirname, '..', 'electron', 'icon-src.html'));
  await new Promise(r => setTimeout(r, 900));
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });

  const outDir = path.join(__dirname, '..', 'electron');
  fs.writeFileSync(path.join(outDir, 'icon.png'), image.resize({ width: 1024 }).toPNG());
  fs.writeFileSync(path.join(outDir, 'icon-512.png'), image.resize({ width: 512 }).toPNG());
  fs.writeFileSync(path.join(outDir, 'icon-256.png'), image.resize({ width: 256 }).toPNG());
  console.log('OK icons written');
  app.exit(0);
});
