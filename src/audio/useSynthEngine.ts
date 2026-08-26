import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { STEP_COUNT } from './types';
import type { EnvelopeSettings, FilterSettings, OscillatorSettings, Step, Waveform } from './types';

const defaultOsc = (waveform: Waveform, volume: number): OscillatorSettings => ({
  waveform,
  detune: 0,
  volume,
  octave: 0,
  semitones: 0,
});

const defaultAmpEnv = (): EnvelopeSettings => ({
  attack: 0.01,
  decay: 0.2,
  sustain: 0.6,
  release: 0.3,
});

const defaultFilterEnv = (): EnvelopeSettings => ({
  attack: 0.01,
  decay: 0.3,
  sustain: 0.2,
  release: 0.4,
});

const defaultSteps = (): Step[] => {
  const pattern: Array<[boolean, string]> = [
    [true, 'C4'], [false, 'C4'], [true, 'D4'], [true, 'C4'],
    [false, 'C4'], [true, 'E4'], [false, 'C4'], [true, 'D4'],
    [true, 'C4'], [false, 'C4'], [true, 'D4'], [false, 'C4'],
    [true, 'C4'], [true, 'E4'], [false, 'C4'], [true, 'G3'],
  ];
  return pattern.map(([active, note]) => ({ active, note }));
};

interface EngineNodes {
  osc1: Tone.Oscillator;
  osc2: Tone.Oscillator;
  osc1Vol: Tone.Volume;
  osc2Vol: Tone.Volume;
  filter: Tone.Filter;
  ampEnv: Tone.AmplitudeEnvelope;
  filterEnv: Tone.FrequencyEnvelope;
  sequence: Tone.Sequence<number>;
}

const FILTER_ENV_OCTAVES = 4;
const GATE_RATIO = 0.85;

export function useSynthEngine() {
  const [osc1, setOsc1] = useState<OscillatorSettings>(() => defaultOsc('sawtooth', -16));
  const [osc2, setOsc2] = useState<OscillatorSettings>(() => defaultOsc('square', -20));
  const [filter, setFilter] = useState<FilterSettings>({
    type: 'lowpass',
    cutoff: 1200,
    resonance: 1,
  });
  const [ampEnvSettings, setAmpEnvSettings] = useState<EnvelopeSettings>(defaultAmpEnv);
  const [filterEnvSettings, setFilterEnvSettings] = useState<EnvelopeSettings>(defaultFilterEnv);
  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  const nodesRef = useRef<EngineNodes | null>(null);
  const stepsRef = useRef<Step[]>(steps);
  const pitchRef = useRef({
    osc1: { octave: osc1.octave, semitones: osc1.semitones },
    osc2: { octave: osc2.octave, semitones: osc2.semitones },
  });

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  // Build the audio graph once.
  useEffect(() => {
    const osc1 = new Tone.Oscillator({ type: 'sawtooth', frequency: 'C4' }).start();
    const osc2 = new Tone.Oscillator({ type: 'square', frequency: 'C4' }).start();
    const osc1Vol = new Tone.Volume(-16);
    const osc2Vol = new Tone.Volume(-20);
    const filterNode = new Tone.Filter({ type: 'lowpass', Q: 1 });
    const ampEnv = new Tone.AmplitudeEnvelope(defaultAmpEnv());
    const filterEnv = new Tone.FrequencyEnvelope({
      ...defaultFilterEnv(),
      baseFrequency: 1200,
      octaves: FILTER_ENV_OCTAVES,
    });

    osc1.chain(osc1Vol, filterNode);
    osc2.chain(osc2Vol, filterNode);
    filterNode.connect(ampEnv);
    ampEnv.toDestination();
    filterEnv.connect(filterNode.frequency);

    const sequence = new Tone.Sequence<number>(
      (time, index) => {
        const step = stepsRef.current[index];
        Tone.getDraw().schedule(() => setCurrentStep(index), time);
        if (!step?.active) return;

        const baseFreq = Tone.Frequency(step.note).toFrequency();
        const p1 = pitchRef.current.osc1;
        const p2 = pitchRef.current.osc2;
        osc1.frequency.setValueAtTime(baseFreq * 2 ** (p1.octave + p1.semitones / 12), time);
        osc2.frequency.setValueAtTime(baseFreq * 2 ** (p2.octave + p2.semitones / 12), time);

        const gateDuration = Tone.Time('16n').toSeconds() * GATE_RATIO;
        ampEnv.triggerAttackRelease(gateDuration, time);
        filterEnv.triggerAttackRelease(gateDuration, time);
      },
      Array.from({ length: STEP_COUNT }, (_, i) => i),
      '16n',
    );
    sequence.loop = true;
    sequence.start(0);

    nodesRef.current = { osc1, osc2, osc1Vol, osc2Vol, filter: filterNode, ampEnv, filterEnv, sequence };

    return () => {
      sequence.dispose();
      osc1.dispose();
      osc2.dispose();
      osc1Vol.dispose();
      osc2Vol.dispose();
      filterNode.dispose();
      ampEnv.dispose();
      filterEnv.dispose();
      nodesRef.current = null;
    };
  }, []);

  // Keep live Tone params in sync with React state.
  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.osc1.type = osc1.waveform;
    nodes.osc1.detune.value = osc1.detune;
    nodes.osc1Vol.volume.value = osc1.volume;
    pitchRef.current.osc1 = { octave: osc1.octave, semitones: osc1.semitones };
  }, [osc1]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.osc2.type = osc2.waveform;
    nodes.osc2.detune.value = osc2.detune;
    nodes.osc2Vol.volume.value = osc2.volume;
    pitchRef.current.osc2 = { octave: osc2.octave, semitones: osc2.semitones };
  }, [osc2]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.filter.type = filter.type;
    nodes.filter.Q.value = filter.resonance;
    nodes.filterEnv.baseFrequency = filter.cutoff;
  }, [filter]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.ampEnv.attack = ampEnvSettings.attack;
    nodes.ampEnv.decay = ampEnvSettings.decay;
    nodes.ampEnv.sustain = ampEnvSettings.sustain;
    nodes.ampEnv.release = ampEnvSettings.release;
  }, [ampEnvSettings]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.filterEnv.attack = filterEnvSettings.attack;
    nodes.filterEnv.decay = filterEnvSettings.decay;
    nodes.filterEnv.sustain = filterEnvSettings.sustain;
    nodes.filterEnv.release = filterEnvSettings.release;
  }, [filterEnvSettings]);

  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  const play = useCallback(async () => {
    await Tone.start();
    Tone.getTransport().start();
    setPlaying(true);
  }, []);

  const stop = useCallback(() => {
    Tone.getTransport().stop();
    setCurrentStep(null);
    setPlaying(false);
  }, []);

  const toggleStep = useCallback((index: number) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], active: !next[index].active };
      return next;
    });
  }, []);

  const setStepNote = useCallback((index: number, note: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], note, active: true };
      return next;
    });
  }, []);

  return {
    osc1,
    setOsc1,
    osc2,
    setOsc2,
    filter,
    setFilter,
    ampEnvSettings,
    setAmpEnvSettings,
    filterEnvSettings,
    setFilterEnvSettings,
    steps,
    toggleStep,
    setStepNote,
    bpm,
    setBpm,
    playing,
    play,
    stop,
    currentStep,
  };
}

export type SynthEngine = ReturnType<typeof useSynthEngine>;
