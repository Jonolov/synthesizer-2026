import type { FilterSettings, FilterType, NoiseSettings, NoiseType } from '../audio/types';
import { Knob } from './Knob';

const FILTER_TYPES: { type: FilterType; path: string }[] = [
  { type: 'lowpass', path: 'M0 2 L11 2 L20 9' },
  { type: 'highpass', path: 'M0 9 L9 2 L20 2' },
  { type: 'bandpass', path: 'M0 9 L7 9 L11 2 L15 9 L20 9' },
];

const NOISE_TYPES: NoiseType[] = ['white', 'pink', 'brown'];

interface FilterPanelProps {
  settings: FilterSettings;
  onChange: (settings: FilterSettings) => void;
  noise: NoiseSettings;
  onNoiseChange: (settings: NoiseSettings) => void;
}

export function FilterPanel({ settings, onChange, noise, onNoiseChange }: FilterPanelProps) {
  return (
    <div className="flex w-[176px] shrink-0 flex-col gap-4">
      <div className="text-[10px] tracking-widest text-text-dim">FILTER</div>
      <div className="flex gap-1.5">
        {FILTER_TYPES.map(({ type, path }) => {
          const active = type === settings.type;
          return (
            <button
              key={type}
              type="button"
              aria-label={type}
              onClick={() => onChange({ ...settings, type })}
              className="flex h-[26px] w-[46px] items-center justify-center border"
              style={{ borderColor: active ? 'var(--color-accent)' : 'var(--color-panel-border)' }}
            >
              <svg width={20} height={10} viewBox="0 0 20 10">
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
      <div className="mt-1 flex gap-5">
        <Knob
          label="CUTOFF"
          value={settings.cutoff}
          min={80}
          max={8000}
          size={56}
          onChange={(cutoff) => onChange({ ...settings, cutoff })}
          formatValue={(v) => `${Math.round(v)}Hz`}
        />
        <Knob
          label="RESO"
          value={settings.resonance}
          min={0.1}
          max={20}
          size={56}
          onChange={(resonance) => onChange({ ...settings, resonance })}
          formatValue={(v) => v.toFixed(1)}
        />
      </div>

      <div className="mt-1 flex items-center gap-4 border-t border-panel-border pt-3.5">
        <div className="text-[9px] tracking-widest text-text-dim">NOISE</div>
        <div className="flex gap-1">
          {NOISE_TYPES.map((type) => {
            const active = type === noise.type;
            return (
              <button
                key={type}
                type="button"
                aria-label={type}
                onClick={() => onNoiseChange({ ...noise, type })}
                className="flex h-[22px] w-[22px] items-center justify-center border text-[8px] uppercase"
                style={{
                  borderColor: active ? 'var(--color-accent2)' : 'var(--color-panel-border)',
                  color: active ? 'var(--color-accent2)' : 'var(--color-text-dim)',
                }}
              >
                {type[0]}
              </button>
            );
          })}
        </div>
        <Knob
          label="LVL"
          value={noise.volume}
          min={-60}
          max={0}
          size={38}
          accent="accent2"
          onChange={(volume) => onNoiseChange({ ...noise, volume })}
        />
      </div>
    </div>
  );
}
