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
 */
export const AutoFitScale: React.FC<AutoFitScaleProps> = ({ docWidth, children }) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const w = outer.clientWidth;
      const s = w > 0 && w < docWidth ? w / docWidth : 1;
      setScale(s);
      setContentHeight(inner.scrollHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [docWidth]);

  return (
    <div
      ref={outerRef}
      className="afs-outer w-full"
      style={scale < 1 && contentHeight ? { height: contentHeight * scale } : undefined}
    >
      <style>{`
        @media print {
          .afs-outer { height: auto !important; }
          .afs-inner { transform: none !important; width: auto !important; }
        }
      `}</style>
      <div
        ref={innerRef}
        className="afs-inner"
        style={{
          width: docWidth,
          margin: '0 auto',
          transform: scale < 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top center'
        }}
      >
        {children}
      </div>
    </div>
  );
};
