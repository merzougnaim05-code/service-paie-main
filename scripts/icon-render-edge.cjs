/* توليد أيقونة التطبيق من electron/icon-src.html عبر Edge (headless)
   التشغيل: node scripts/icon-render-edge.cjs */
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-first-run', '--disable-gpu', '--hide-scrollbars']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });
  await page.goto('file:///' + path.join(__dirname, '..', 'electron', 'icon-src.html').replace(/\\/g, '/'));
  await new Promise(r => setTimeout(r, 600));
  const outDir = path.join(__dirname, '..', 'electron');
  const el = await page.$('svg');
  await el.screenshot({ path: path.join(outDir, 'icon.png'), omitBackground: true });

  // تصغير لعدة أحجام عبر canvas داخل الصفحة
  const sizes = [512, 256, 128, 64, 48, 32, 16];
  const dataUrl = 'data:image/png;base64,' + fs.readFileSync(path.join(outDir, 'icon.png')).toString('base64');
  const resized = await page.evaluate(async (dataUrl, sizes) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
    const out = [];
    for (const s of sizes) {
      const c = document.createElement('canvas');
      c.width = s; c.height = s;
      c.getContext('2d').drawImage(img, 0, 0, s, s);
      out.push({ s, b64: c.toDataURL('image/png').split(',')[1] });
    }
    return out;
  }, dataUrl, sizes);
  for (const r of resized) {
    fs.writeFileSync(path.join(outDir, `icon-${r.s}.png`), Buffer.from(r.b64, 'base64'));
  }
  await browser.close();
  console.log('OK icon.png + ' + sizes.map(s => s).join('/') + ' written');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
