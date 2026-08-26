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
          label="OCT"
          value={settings.octave}
          min={-2}
          max={2}
          step={1}
          onChange={(octave) => onChange({ ...settings, octave })}
          formatValue={(v) => (v > 0 ? `+${v}` : `${v}`)}
        />
        <Knob
          label="SEMI"
          value={settings.semitones}
          min={-24}
          max={24}
          step={1}
          onChange={(semitones) => onChange({ ...settings, semitones })}
          formatValue={(v) => (v > 0 ? `+${v}` : `${v}`)}
        />
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
      <div className="mt-1 flex items-center gap-5 border-t border-panel-border pt-3.5">
        <div className="text-[9px] tracking-widest text-text-dim">SUB</div>
        <Knob
          label="DIV"
          value={settings.subDivide}
          min={1}
          max={8}
          step={1}
          size={38}
          accent="accent2"
          onChange={(subDivide) => onChange({ ...settings, subDivide })}
          formatValue={(v) => `÷${v}`}
        />
        <Knob
          label="LVL"
          value={settings.subVolume}
          min={-60}
          max={0}
          size={38}
          accent="accent2"
          onChange={(subVolume) => onChange({ ...settings, subVolume })}
        />
      </div>
    </div>
  );
}
