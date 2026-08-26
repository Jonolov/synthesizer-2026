import type { Waveform } from '../audio/types';

const WAVEFORMS: { type: Waveform; path: string }[] = [
  { type: 'sine', path: 'M0 6 Q5 0 10 6 T20 6' },
  { type: 'square', path: 'M0 10 L0 2 L10 2 L10 10 L20 10 L20 2' },
  { type: 'triangle', path: 'M0 10 L5 2 L10 10 L15 2 L20 10' },
  { type: 'sawtooth', path: 'M0 10 L18 2 L18 10 L0 10' },
];

interface WaveformSelectorProps {
  value: Waveform;
  onChange: (waveform: Waveform) => void;
}

export function WaveformSelector({ value, onChange }: WaveformSelectorProps) {
  return (
    <div className="flex gap-2">
      {WAVEFORMS.map(({ type, path }) => {
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            aria-label={type}
            onClick={() => onChange(type)}
            className="flex h-[30px] w-10 items-center justify-center border"
            style={{ borderColor: active ? 'var(--color-accent)' : 'var(--color-panel-border)' }}
          >
            <svg width={18} height={10} viewBox="0 0 20 12">
              <path
                d={path}
                stroke={active ? 'var(--color-accent)' : 'var(--color-text-dim)'}
                strokeWidth={1.3}
                fill="none"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
