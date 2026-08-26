import { useSynthEngine } from './audio/useSynthEngine';
import { EnvelopePanel } from './components/EnvelopePanel';
import { FilterPanel } from './components/FilterPanel';
import { OscillatorPanel } from './components/OscillatorPanel';
import { SequencerLane } from './components/SequencerLane';
import { Transport } from './components/Transport';
import { ScaleToFit } from './useResponsiveScale';

function PortraitHint() {
  return (
    <div className="portrait-hint flex-col items-center justify-center gap-4 bg-bg p-8 text-center">
      <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
        <rect x={13} y={4} width={14} height={24} rx={2} stroke="var(--color-accent)" strokeWidth={1.5} />
        <line x1={20} y1={9} x2={20} y2={9} stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" />
        <path
          d="M31 20a11 11 0 1 1 -3.2 -7.7"
          stroke="var(--color-text-dim)"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
        <path d="M31 8v6h-6" stroke="var(--color-text-dim)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      </svg>
      <div className="text-[11px] tracking-widest text-text">ROTATE YOUR DEVICE</div>
      <div className="text-[10px] leading-relaxed text-text-dim">This synth is built for landscape.</div>
    </div>
  );
}

export default function App() {
  const engine = useSynthEngine();

  return (
    <>
      <PortraitHint />
      <div className="app-shell flex min-h-screen items-center justify-center bg-bg">
        <ScaleToFit>
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
        </ScaleToFit>
      </div>
    </>
  );
}
