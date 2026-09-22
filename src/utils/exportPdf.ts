import { toPng, getFontEmbedCSS } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * تحويل عناصر وثائق معروضة في الصفحة إلى ملف PDF بمقاس A4 وتنزيله مباشرة.
 * - اتجاه كل صفحة (عمودي/أفقي) يُحدد تلقائياً من أبعاد العنصر.
 * - تُدمج الخطوط العربية في الصورة لضمان وضوح النص في ملف PDF.
 * - الوثيقة الأطول من صفحة تُقتطع تلقائياً على عدة صفحات دون تقطيع غير مرغوب في المنتصف.
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
    // إلغاء التحجيم التلقائي (AutoFitScale) مؤقتاً لالتقاط الوثيقة بحجمها الطبيعي
    const restoreTransform = el.style.transform;
    el.style.transform = 'none';
    let imgData: string;
    try {
      imgData = await toPng(el, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
        fontEmbedCSS
      });
    } finally {
      el.style.transform = restoreTransform;
    }

    const w = el.offsetWidth || el.scrollWidth;
    const h = el.offsetHeight || el.scrollHeight;
    const landscape = w > h;
    const pageW = landscape ? 297 : 210;
    const pageH = landscape ? 210 : 297;
    const margin = 6;
    const imgW = pageW - margin * 2;
    const imgH = (h * imgW) / w;
    const contentH = pageH - margin * 2;
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
