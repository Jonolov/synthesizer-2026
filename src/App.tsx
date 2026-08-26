import { useSynthEngine } from './audio/useSynthEngine';
import { EnvelopePanel } from './components/EnvelopePanel';
import { FilterPanel } from './components/FilterPanel';
import { OscillatorPanel } from './components/OscillatorPanel';
import { Sequencer } from './components/Sequencer';
import { Transport } from './components/Transport';

export default function App() {
  const engine = useSynthEngine();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div
        className="flex w-[960px] flex-col gap-[22px] border border-panel-border p-8"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(109,255,184,0.05) 0px, transparent 1px, transparent 28px), repeating-linear-gradient(90deg, rgba(109,255,184,0.05) 0px, transparent 1px, transparent 28px), var(--color-bg)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[15px] tracking-[3px] text-text">
            SYNTH<span style={{ color: 'var(--color-accent)' }}>::</span>01
          </div>
          <Transport
            playing={engine.playing}
            bpm={engine.bpm}
            onBpmChange={engine.setBpm}
            onPlay={engine.play}
            onStop={engine.stop}
          />
        </div>

        <div className="flex gap-[18px]">
          <OscillatorPanel label="OSC.1" settings={engine.osc1} onChange={engine.setOsc1} />
          <OscillatorPanel label="OSC.2" settings={engine.osc2} onChange={engine.setOsc2} />
          <EnvelopePanel
            amp={engine.ampEnvSettings}
            onAmpChange={engine.setAmpEnvSettings}
            filter={engine.filterEnvSettings}
            onFilterChange={engine.setFilterEnvSettings}
          />
        </div>

        <div className="flex flex-grow gap-[26px] border border-panel-border p-5">
          <FilterPanel settings={engine.filter} onChange={engine.setFilter} />
          <div className="w-px bg-panel-border" />
          <Sequencer
            steps={engine.steps}
            currentStep={engine.currentStep}
            onToggle={engine.toggleStep}
            onSetNote={engine.setStepNote}
          />
        </div>
      </div>
    </div>
  );
}
