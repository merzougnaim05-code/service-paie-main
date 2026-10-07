import React, { useEffect, useRef, useState } from 'react';

interface AutoFitScaleProps {
  /** Natural document width in px — 794 = A4 portrait (210mm), 1123 = A4 landscape (297mm) */
  docWidth: number;
  children: React.ReactNode;
}

/**
 * Auto-scales fixed-size (A4) documents to fit the available container width.
 * On wide screens (mode desktop) the document is shown at natural size (scale 1,
 * no inline styles → clean HTML export). On narrow screens (mode phone or real
 * phones) the document is scaled down with CSS transform and the wrapper height
 * is adjusted accordingly. Print output is never scaled.
 *
 * إصلاح التداخل: تُقاس الأبعاد بعد اكتمال الخطوط والصور مع إعادة قياس مؤجلة،
 * ولا تُعرض الوثيقة إلا بعد أول قياس حتى لا تومض بحجمها الكامل وتتداخل مع ما حولها.
 */
export const AutoFitScale: React.FC<AutoFitScaleProps> = ({ docWidth, children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const w = outer.clientWidth;
      const s = w > 0 && w < docWidth ? w / docWidth : 1;
      setScale(s);
      setContentHeight(inner.scrollHeight);
      setReady(true);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);

    // إعادة القياس بعد تحميل الخطوط والصور (شعار CNR) لتفادي ارتفاع قديم أقل من الحقيقي
    let cancelled = false;
    const remeasure = () => { if (!cancelled) update(); };
    if (document.fonts?.ready) document.fonts.ready.then(remeasure).catch(() => {});
    window.addEventListener('load', remeasure);
    const timers = [120, 350, 800, 1500].map(ms => window.setTimeout(remeasure, ms));

    return () => {
      cancelled = true;
      ro.disconnect();
      window.removeEventListener('load', remeasure);
      timers.forEach(t => window.clearTimeout(t));
    };
  }, [docWidth]);

  return (
    <div
      ref={outerRef}
      className="afs-outer w-full flex justify-center"
      style={{ overflowX: 'clip', ...(scale < 1 && contentHeight ? { height: contentHeight * scale } : {}) }}
    >
      <style>{`
        @media print {
          .afs-outer { height: auto !important; overflow: visible !important; display: block !important; }
          .afs-inner { transform: none !important; width: auto !important; }
        }
      `}</style>
      <div
        ref={innerRef}
        className="afs-inner shrink-0"
        style={{
          width: docWidth,
          // توسيع مرن متمركز (محايد للاتجاه): في الجذر RTL يُحل margin:auto للعنصر
          // الأعرض من حاويته بهامش سالب يساريًا فينزاح المحتوى — flex يمنع ذلك تمامًا
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center',
          opacity: ready ? 1 : 0
        }}
      >
        {children}
      </div>
    </div>
  );
};
