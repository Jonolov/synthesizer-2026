import { Knob } from './Knob';

interface TransportProps {
  playing: boolean;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
  onPlay: () => void;
  onStop: () => void;
}

export function Transport({
  playing,
  bpm,
  onBpmChange,
  masterVolume,
  onMasterVolumeChange,
  onPlay,
  onStop,
}: TransportProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={playing ? onStop : onPlay}
        aria-label={playing ? 'Stop' : 'Play'}
        className="flex h-[30px] w-[30px] items-center justify-center border"
        style={{ borderColor: 'var(--color-accent)' }}
      >
        {playing ? (
          <svg width={10} height={10} viewBox="0 0 10 10">
            <rect width={10} height={10} fill="var(--color-accent)" />
          </svg>
        ) : (
          <svg width={11} height={12} viewBox="0 0 11 12">
            <path d="M0 0 L11 6 L0 12 Z" fill="var(--color-accent)" />
          </svg>
        )}
      </button>

      <label className="flex items-baseline gap-1 text-xs tracking-wide text-text">
        <input
          type="number"
          min={40}
          max={240}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-10 border-0 bg-transparent text-right tabular-nums text-text outline-none"
        />
        <span className="text-text-dim">BPM</span>
      </label>

      <div className="flex items-center gap-2">
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: playing ? 'var(--color-accent)' : 'var(--color-track)',
            boxShadow: playing ? '0 0 6px 1px rgba(109,255,184,0.7)' : undefined,
          }}
        />
        <div className="text-[10px] tracking-widest text-text-dim">
          {playing ? 'LOOPING' : 'STOPPED'}
        </div>
      </div>

      <Knob
        label="MASTER"
        value={masterVolume}
        min={-60}
        max={0}
        size={30}
        onChange={onMasterVolumeChange}
        formatValue={(v) => `${v.toFixed(0)}dB`}
      />
    </div>
  );
}
