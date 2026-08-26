import { useSynthEngine } from './audio/useSynthEngine';
import { EnvelopePanel } from './components/EnvelopePanel';
import { FilterPanel } from './components/FilterPanel';
import { OscillatorPanel } from './components/OscillatorPanel';
import { SequencerLane } from './components/SequencerLane';
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
            SUBHARMONIC SYNTH<span style={{ color: 'var(--color-accent)' }}>::</span>01
          </div>
          <Transport
            playing={engine.playing}
            bpm={engine.bpm}
            onBpmChange={engine.setBpm}
            masterVolume={engine.masterVolume}
            onMasterVolumeChange={engine.setMasterVolume}
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
          <FilterPanel
            settings={engine.filter}
            onChange={engine.setFilter}
            noise={engine.noise}
            onNoiseChange={engine.setNoise}
          />
          <div className="w-px bg-panel-border" />
          <div className="flex flex-grow flex-col justify-between gap-4">
            <SequencerLane
              label="OSC.1 LANE"
              lane={engine.laneA}
              currentStep={engine.currentStepA}
              onToggle={(index) => engine.toggleStep('A', index)}
              onSetNote={(index, note) => engine.setStepNote('A', index, note)}
              onRateChange={(rate) => engine.setLaneRate('A', rate)}
              onLengthChange={(length) => engine.setLaneLength('A', length)}
            />
            <div className="h-px bg-panel-border" />
            <SequencerLane
              label="OSC.2 LANE"
              lane={engine.laneB}
              currentStep={engine.currentStepB}
              onToggle={(index) => engine.toggleStep('B', index)}
              onSetNote={(index, note) => engine.setStepNote('B', index, note)}
              onRateChange={(rate) => engine.setLaneRate('B', rate)}
              onLengthChange={(length) => engine.setLaneLength('B', length)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
