import { toPng, getFontEmbedCSS } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * تحويل عناصر وثائق معروضة في الصفحة إلى ملف PDF بمقاس A4 وتنزيله مباشرة.
 * - اتجاه كل صفحة (عمودي/أفقي) يُحدد تلقائياً من أبعاد العنصر.
 * - تُدمج الخطوط العربية في الصورة لضمان وضوح النص في ملف PDF.
 * - الوثيقة الأطول من صفحة تُقتطع تلقائياً على عدة صفحات دون تقطيع غير مرغوب في المنتصف.
 *
 * كشوف الرواتب (.payslip-document): تُلتقط نسخة مستنسخة بمواصفات الطباعة
 * (عرض 190mm وارتفاع 290mm، بلا ظل ولا زوايا مستديرة، وأشرطة عناوين بيضاء)
 * عبر .pdf-capture-sheet، ثم تُوضع ملء صفحة A4 واحدة دون انشطار — فلا يخرج
 * الكشف مظللاً كصورة ولا ناقصاً عن الورقة.
 */
export async function exportElementsToPdf(elements: HTMLElement[], filename: string): Promise<void> {
  if (elements.length === 0) throw new Error('لا يوجد محتوى للتصدير');

  const firstLandscape = elements[0].offsetWidth > elements[0].offsetHeight;
  const pdf = new jsPDF({
    orientation: firstLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  let isFirst = true;
  let fontEmbedCSS: string | undefined;
  try {
    fontEmbedCSS = await getFontEmbedCSS(elements[0]);
  } catch {
    fontEmbedCSS = undefined;
  }

  for (const el of elements) {
    // كشف راتب: استنساخ الوثيقة نفسها (لا الغلاف العريض حولها) بمواصفات الطباعة
    const payslipDoc = (
      el.classList.contains('payslip-document')
        ? el
        : el.querySelector('.payslip-document')
    ) as HTMLElement | null;
    let captureEl: HTMLElement = el;
    let sheet: HTMLDivElement | null = null;
    if (payslipDoc) {
      sheet = document.createElement('div');
      sheet.className = 'pdf-capture-sheet';
      const clone = payslipDoc.cloneNode(true) as HTMLElement;
      sheet.appendChild(clone);
      document.body.appendChild(sheet);
      captureEl = clone;
    }

    // إلغاء التحجيم التلقائي (AutoFitScale) مؤقتاً لالتقاط الوثيقة بحجمها الطبيعي
    const restoreTransform = captureEl.style.transform;
    captureEl.style.transform = 'none';
    let imgData: string;
    let w = 0;
    let h = 0;
    try {
      imgData = await toPng(captureEl, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        fontEmbedCSS
      });
      w = captureEl.offsetWidth || captureEl.scrollWidth;
      h = captureEl.offsetHeight || captureEl.scrollHeight;
    } finally {
      captureEl.style.transform = restoreTransform;
      if (sheet) sheet.remove();
    }

    const landscape = w > h;
    const pageW = landscape ? 297 : 210;
    const pageH = landscape ? 210 : 297;
    const margin = 6;
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    if (payslipDoc) {
      // كشف الراتب: ملء صفحة A4 واحدة — تحجيم متناسب مع توسيط، دون تقطيع
      const scale = Math.min(contentW / w, contentH / h);
      const imgW = w * scale;
      const imgH = h * scale;
      const x = (pageW - imgW) / 2;
      const y = (pageH - imgH) / 2;
      if (!isFirst) pdf.addPage('a4', landscape ? 'landscape' : 'portrait');
      isFirst = false;
      pdf.addImage(imgData, 'PNG', x, y, imgW, imgH);
      continue;
    }

    const imgW = contentW;
    const imgH = (h * imgW) / w;
    const pageCount = Math.max(1, Math.ceil(imgH / contentH));

    for (let p = 0; p < pageCount; p++) {
      if (isFirst) {
        isFirst = false;
      } else {
        pdf.addPage('a4', landscape ? 'landscape' : 'portrait');
      }
      pdf.addImage(imgData, 'PNG', margin, margin - p * contentH, imgW, imgH);
    }
  }

  pdf.save(filename);
}
