import { useState } from 'react';
import type { EnvelopeSettings } from '../audio/types';
import { Knob } from './Knob';

interface EnvelopePanelProps {
  amp: EnvelopeSettings;
  onAmpChange: (settings: EnvelopeSettings) => void;
  filter: EnvelopeSettings;
  onFilterChange: (settings: EnvelopeSettings) => void;
}

const MAX_ATTACK = 2;
const MAX_DECAY = 2;
const MAX_RELEASE = 3;
const ATTACK_W = 50;
const DECAY_W = 40;
const SUSTAIN_W = 40;
const RELEASE_W = 60;
const BASELINE_Y = 68;
const PEAK_Y = 6;

function envelopePath(env: EnvelopeSettings) {
  const attackX = Math.min(env.attack / MAX_ATTACK, 1) * ATTACK_W;
  const decayX = attackX + Math.min(env.decay / MAX_DECAY, 1) * DECAY_W;
  const sustainY = BASELINE_Y - env.sustain * (BASELINE_Y - PEAK_Y);
  const sustainEndX = decayX + SUSTAIN_W;
  const releaseX = sustainEndX + Math.min(env.release / MAX_RELEASE, 1) * RELEASE_W;

  const points: [number, number][] = [
    [0, BASELINE_Y],
    [attackX, PEAK_Y],
    [decayX, sustainY],
    [sustainEndX, sustainY],
    [releaseX, BASELINE_Y],
  ];
  return points;
}

export function EnvelopePanel({ amp, onAmpChange, filter, onFilterChange }: EnvelopePanelProps) {
  const [selected, setSelected] = useState<'amp' | 'filter'>('amp');
  const ampPoints = envelopePath(amp);
  const filterPoints = envelopePath(filter);
  const active = selected === 'amp' ? amp : filter;
  const onActiveChange = selected === 'amp' ? onAmpChange : onFilterChange;

  return (
    <div className="flex flex-1 flex-col gap-3.5 border border-panel-border p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-text-dim">ENV</div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setSelected('amp')}
            className="flex items-center gap-1"
            style={{ opacity: selected === 'amp' ? 1 : 0.5 }}
          >
            <div className="h-[1.5px] w-3" style={{ background: 'var(--color-accent)' }} />
            <span className="text-[8px] tracking-wider text-text-dim">AMP</span>
          </button>
          <button
            type="button"
            onClick={() => setSelected('filter')}
            className="flex items-center gap-1"
            style={{ opacity: selected === 'filter' ? 1 : 0.5 }}
          >
            <svg width={12} height={4}>
              <line x1={0} y1={2} x2={12} y2={2} stroke="var(--color-accent2)" strokeWidth={1.5} strokeDasharray="2.5 2" />
            </svg>
            <span className="text-[8px] tracking-wider text-text-dim">FLT</span>
          </button>
        </div>
      </div>

      <div className="flex flex-grow items-end pb-1">
        <svg width="100%" height={70} viewBox="0 0 200 70" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <polyline
            points={filterPoints.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="var(--color-accent2)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={selected === 'filter' ? 1 : 0.45}
          />
          <polyline
            points={ampPoints.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            opacity={selected === 'amp' ? 1 : 0.45}
          />
        </svg>
      </div>

      <div className="flex justify-between">
        <Knob label="A" value={active.attack} min={0.001} max={MAX_ATTACK} size={34} accent={selected === 'amp' ? 'accent' : 'accent2'} onChange={(v) => onActiveChange({ ...active, attack: v })} />
        <Knob label="D" value={active.decay} min={0.001} max={MAX_DECAY} size={34} accent={selected === 'amp' ? 'accent' : 'accent2'} onChange={(v) => onActiveChange({ ...active, decay: v })} />
        <Knob label="S" value={active.sustain} min={0} max={1} size={34} accent={selected === 'amp' ? 'accent' : 'accent2'} onChange={(v) => onActiveChange({ ...active, sustain: v })} />
        <Knob label="R" value={active.release} min={0.001} max={MAX_RELEASE} size={34} accent={selected === 'amp' ? 'accent' : 'accent2'} onChange={(v) => onActiveChange({ ...active, release: v })} />
      </div>
    </div>
  );
}
