import type { OscillatorSettings } from '../audio/types';
import { Knob } from './Knob';
import { WaveformSelector } from './WaveformSelector';

interface OscillatorPanelProps {
  label: string;
  settings: OscillatorSettings;
  onChange: (settings: OscillatorSettings) => void;
}

export function OscillatorPanel({ label, settings, onChange }: OscillatorPanelProps) {
  return (
    <div className="flex flex-1 flex-col gap-3.5 border border-panel-border p-4">
      <div className="text-[10px] tracking-widest text-text-dim">{label}</div>
      <WaveformSelector
        value={settings.waveform}
        onChange={(waveform) => onChange({ ...settings, waveform })}
      />
      <div className="mt-1.5 flex gap-5">
        <Knob
          label="DETUNE"
          value={settings.detune}
          min={-100}
          max={100}
          onChange={(detune) => onChange({ ...settings, detune })}
        />
        <Knob
          label="VOL"
          value={settings.volume}
          min={-60}
          max={0}
          onChange={(volume) => onChange({ ...settings, volume })}
        />
      </div>
    </div>
  );
}
