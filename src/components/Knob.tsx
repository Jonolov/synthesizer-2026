import { useCallback, useRef, useState } from 'react';
import { useScale } from '../useResponsiveScale';

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  size?: number;
  accent?: 'accent' | 'accent2';
  formatValue?: (value: number) => string;
  step?: number;
}

const START_ANGLE = -135;
const SWEEP = 270;
const DRAG_RANGE_PX = 180;

function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = pointOnCircle(cx, cy, r, startDeg);
  const end = pointOnCircle(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function Knob({
  label,
  value,
  min,
  max,
  onChange,
  size = 48,
  accent = 'accent',
  formatValue,
  step,
}: KnobProps) {
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<{ startY: number; startValue: number } | null>(null);
  const scale = useScale();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = { startY: e.clientY, startValue: value };
      setDragging(true);
    },
    [value],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragState.current) return;
      const delta = (dragState.current.startY - e.clientY) / scale;
      const range = max - min;
      let next = dragState.current.startValue + (delta / DRAG_RANGE_PX) * range;
      next = Math.min(max, Math.max(min, next));
      if (step) next = Math.round(next / step) * step;
      onChange(next);
    },
    [max, min, onChange, step, scale],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragState.current = null;
    setDragging(false);
  }, []);

  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const tickAngle = START_ANGLE + t * SWEEP;
  const tickInner = pointOnCircle(cx, cy, r * 0.35, tickAngle);
  const tickOuter = pointOnCircle(cx, cy, r * 0.9, tickAngle);
  const accentColor = accent === 'accent' ? 'var(--color-accent)' : 'var(--color-accent2)';

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-ns-resize touch-none"
      >
        <path
          d={describeArc(cx, cy, r, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={1.5}
        />
        {t > 0 && (
          <path
            d={describeArc(cx, cy, r, START_ANGLE, tickAngle)}
            fill="none"
            stroke={accentColor}
            strokeWidth={1.5}
          />
        )}
        <line
          x1={tickInner.x}
          y1={tickInner.y}
          x2={tickOuter.x}
          y2={tickOuter.y}
          stroke={dragging ? '#ffffff' : accentColor}
          strokeWidth={1}
        />
      </svg>
      <div className="text-[9px] tracking-wider text-text-dim">{label}</div>
      {formatValue && <div className="text-[9px] tabular-nums text-text-dimmer">{formatValue(value)}</div>}
    </div>
  );
}
