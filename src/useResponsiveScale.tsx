import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';

const ScaleContext = createContext(1);

export function useScale() {
  return useContext(ScaleContext);
}

const OUTER_PADDING = 32;

export function ScaleToFit({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const update = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width === 0 || height === 0) return;
      setNaturalSize({ width, height });
      const available = window.innerWidth - OUTER_PADDING;
      setScale(Math.min(1, available / width));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      style={{
        width: naturalSize.width ? naturalSize.width * scale : undefined,
        height: naturalSize.height ? naturalSize.height * scale : undefined,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        ref={contentRef}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 'max-content' }}
      >
        <ScaleContext.Provider value={scale}>{children}</ScaleContext.Provider>
      </div>
    </div>
  );
}
