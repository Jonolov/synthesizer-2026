import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { MAX_LANE_STEPS } from './types';
import type {
  EnvelopeSettings,
  FilterSettings,
  Lane,
  LaneId,
  NoiseSettings,
  OscillatorSettings,
  Step,
  Waveform,
} from './types';

const defaultNoise = (): NoiseSettings => ({
  type: 'white',
  volume: -60,
});

const defaultOsc = (waveform: Waveform, volume: number): OscillatorSettings => ({
  waveform,
  detune: 0,
  volume,
  octave: 0,
  semitones: 0,
  subDivide: 2,
  subVolume: -60,
});

const defaultAmpEnv = (): EnvelopeSettings => ({
  attack: 0.03,
  decay: 0.25,
  sustain: 0.65,
  release: 0.6,
});

const defaultFilterEnv = (): EnvelopeSettings => ({
  attack: 0.02,
  decay: 0.4,
  sustain: 0.15,
  release: 0.5,
});

function laneSteps(pattern: Array<[boolean, string]>): Step[] {
  const steps = pattern.map(([active, note]) => ({ active, note }));
  while (steps.length < MAX_LANE_STEPS) steps.push({ active: false, note: 'C4' });
  return steps;
}

// A minor 7 (A-C-E-G), 16-step walking bassline over two bars at half-time.
const defaultLaneA = (): Lane => ({
  steps: laneSteps([
    [true, 'A3'], [false, 'C4'], [true, 'C4'], [false, 'C4'],
    [true, 'A3'], [true, 'E3'], [false, 'C4'], [true, 'G3'],
    [true, 'A3'], [false, 'C4'], [true, 'C4'], [false, 'C4'],
    [true, 'E3'], [false, 'C4'], [true, 'G3'], [false, 'C4'],
  ]),
  length: 16,
  rate: 2,
});

// Am7 arpeggio, 12 steps at a dotted-eighth rate against lane A's 16 --
// the two lengths and rates only realign every 288 ticks.
const defaultLaneB = (): Lane => ({
  steps: laneSteps([
    [true, 'E4'], [false, 'C4'], [true, 'C4'], [true, 'A4'],
    [false, 'C4'], [true, 'E4'], [true, 'G4'], [false, 'C4'],
    [true, 'C4'], [true, 'E4'], [false, 'C4'], [true, 'A4'],
  ]),
  length: 12,
  rate: 3,
});

interface EngineNodes {
  osc1: Tone.Oscillator;
  osc2: Tone.Oscillator;
  osc1Sub: Tone.Oscillator;
  osc2Sub: Tone.Oscillator;
  osc1Vol: Tone.Volume;
  osc2Vol: Tone.Volume;
  osc1SubVol: Tone.Volume;
  osc2SubVol: Tone.Volume;
  noise: Tone.Noise;
  noiseVol: Tone.Volume;
  filter: Tone.Filter;
  ampEnv: Tone.AmplitudeEnvelope;
  filterEnv: Tone.FrequencyEnvelope;
  masterVol: Tone.Volume;
  limiter: Tone.Limiter;
  masterLoop: Tone.Loop;
}

interface LaneRuntime {
  counter: number;
  index: number;
}

interface OscPitch {
  octave: number;
  semitones: number;
  subDivide: number;
}

const FILTER_ENV_OCTAVES = 4;
const GATE_RATIO = 0.85;

function advanceLane(
  runtime: LaneRuntime,
  laneRef: { current: Lane },
  applyFreq: (note: string) => void,
) {
  const lane = laneRef.current;
  const length = Math.max(1, lane.length);
  if (runtime.index >= length) runtime.index = 0;
  const playedIndex = runtime.index;

  let triggered = false;
  if (runtime.counter === 0) {
    const step = lane.steps[playedIndex];
    if (step?.active) {
      applyFreq(step.note);
      triggered = true;
    }
  }

  const rate = Math.max(1, lane.rate);
  runtime.counter = (runtime.counter + 1) % rate;
  if (runtime.counter === 0) {
    runtime.index = (playedIndex + 1) % length;
  }

  return { triggered, playedIndex };
}

export function useSynthEngine() {
  const [osc1, setOsc1] = useState<OscillatorSettings>(() => ({
    ...defaultOsc('square', -18),
    octave: -1,
    subVolume: -30,
  }));
  const [osc2, setOsc2] = useState<OscillatorSettings>(() => defaultOsc('square', -20));
  const [filter, setFilter] = useState<FilterSettings>({
    type: 'lowpass',
    cutoff: 80,
    resonance: 10,
  });
  const [ampEnvSettings, setAmpEnvSettings] = useState<EnvelopeSettings>(defaultAmpEnv);
  const [filterEnvSettings, setFilterEnvSettings] = useState<EnvelopeSettings>(defaultFilterEnv);
  const [noise, setNoise] = useState<NoiseSettings>(defaultNoise);
  const [masterVolume, setMasterVolume] = useState(-12);
  const [laneA, setLaneA] = useState<Lane>(defaultLaneA);
  const [laneB, setLaneB] = useState<Lane>(defaultLaneB);
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [currentStepA, setCurrentStepA] = useState<number | null>(null);
  const [currentStepB, setCurrentStepB] = useState<number | null>(null);

  const nodesRef = useRef<EngineNodes | null>(null);
  const laneARef = useRef(laneA);
  const laneBRef = useRef(laneB);
  const laneARuntime = useRef<LaneRuntime>({ counter: 0, index: 0 });
  const laneBRuntime = useRef<LaneRuntime>({ counter: 0, index: 0 });
  const pitchRef = useRef<{ osc1: OscPitch; osc2: OscPitch }>({
    osc1: { octave: osc1.octave, semitones: osc1.semitones, subDivide: osc1.subDivide },
    osc2: { octave: osc2.octave, semitones: osc2.semitones, subDivide: osc2.subDivide },
  });

  useEffect(() => {
    laneARef.current = laneA;
  }, [laneA]);

  useEffect(() => {
    laneBRef.current = laneB;
  }, [laneB]);

  // Build the audio graph once.
  useEffect(() => {
    const osc1 = new Tone.Oscillator({ type: 'square', frequency: 'C4' }).start();
    const osc2 = new Tone.Oscillator({ type: 'square', frequency: 'C4' }).start();
    const osc1Sub = new Tone.Oscillator({ type: 'square', frequency: 'C4' }).start();
    const osc2Sub = new Tone.Oscillator({ type: 'square', frequency: 'C4' }).start();
    const osc1Vol = new Tone.Volume(-18);
    const osc2Vol = new Tone.Volume(-20);
    const osc1SubVol = new Tone.Volume(-30);
    const osc2SubVol = new Tone.Volume(-60);
    const noiseNode = new Tone.Noise({ type: 'white' }).start();
    const noiseVolNode = new Tone.Volume(-60);
    const filterNode = new Tone.Filter({ type: 'lowpass', Q: 2 });
    const ampEnv = new Tone.AmplitudeEnvelope(defaultAmpEnv());
    const filterEnv = new Tone.FrequencyEnvelope({
      ...defaultFilterEnv(),
      baseFrequency: 500,
      octaves: FILTER_ENV_OCTAVES,
    });
    const masterVolNode = new Tone.Volume(-12);
    const limiterNode = new Tone.Limiter(-1);

    osc1.chain(osc1Vol, filterNode);
    osc2.chain(osc2Vol, filterNode);
    osc1Sub.chain(osc1SubVol, filterNode);
    osc2Sub.chain(osc2SubVol, filterNode);
    noiseNode.chain(noiseVolNode, filterNode);
    filterNode.connect(ampEnv);
    ampEnv.chain(masterVolNode, limiterNode, Tone.getDestination());
    filterEnv.connect(filterNode.frequency);

    const gateDuration = () => Tone.Time('16n').toSeconds() * GATE_RATIO;

    const masterLoop = new Tone.Loop((time) => {
      const resultA = advanceLane(laneARuntime.current, laneARef, (note) => {
        const base = Tone.Frequency(note).toFrequency();
        const p = pitchRef.current.osc1;
        const freq = base * 2 ** (p.octave + p.semitones / 12);
        osc1.frequency.setValueAtTime(freq, time);
        osc1Sub.frequency.setValueAtTime(freq / Math.max(1, p.subDivide), time);
      });
      const resultB = advanceLane(laneBRuntime.current, laneBRef, (note) => {
        const base = Tone.Frequency(note).toFrequency();
        const p = pitchRef.current.osc2;
        const freq = base * 2 ** (p.octave + p.semitones / 12);
        osc2.frequency.setValueAtTime(freq, time);
        osc2Sub.frequency.setValueAtTime(freq / Math.max(1, p.subDivide), time);
      });

      if (resultA.triggered || resultB.triggered) {
        const dur = gateDuration();
        ampEnv.triggerAttackRelease(dur, time);
        filterEnv.triggerAttackRelease(dur, time);
      }

      Tone.getDraw().schedule(() => {
        setCurrentStepA(resultA.playedIndex);
        setCurrentStepB(resultB.playedIndex);
      }, time);
    }, '16n');
    masterLoop.start(0);

    nodesRef.current = {
      osc1, osc2, osc1Sub, osc2Sub,
      osc1Vol, osc2Vol, osc1SubVol, osc2SubVol,
      noise: noiseNode, noiseVol: noiseVolNode,
      filter: filterNode, ampEnv, filterEnv,
      masterVol: masterVolNode, limiter: limiterNode,
      masterLoop,
    };

    return () => {
      masterLoop.dispose();
      osc1.dispose();
      osc2.dispose();
      osc1Sub.dispose();
      osc2Sub.dispose();
      osc1Vol.dispose();
      osc2Vol.dispose();
      osc1SubVol.dispose();
      osc2SubVol.dispose();
      noiseNode.dispose();
      noiseVolNode.dispose();
      filterNode.dispose();
      ampEnv.dispose();
      filterEnv.dispose();
      masterVolNode.dispose();
      limiterNode.dispose();
      nodesRef.current = null;
    };
  }, []);

  // Keep live Tone params in sync with React state.
  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.osc1.type = osc1.waveform;
    nodes.osc1Sub.type = osc1.waveform;
    nodes.osc1.detune.value = osc1.detune;
    nodes.osc1Vol.volume.value = osc1.volume;
    nodes.osc1SubVol.volume.value = osc1.subVolume;
    pitchRef.current.osc1 = { octave: osc1.octave, semitones: osc1.semitones, subDivide: osc1.subDivide };
  }, [osc1]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.osc2.type = osc2.waveform;
    nodes.osc2Sub.type = osc2.waveform;
    nodes.osc2.detune.value = osc2.detune;
    nodes.osc2Vol.volume.value = osc2.volume;
    nodes.osc2SubVol.volume.value = osc2.subVolume;
    pitchRef.current.osc2 = { octave: osc2.octave, semitones: osc2.semitones, subDivide: osc2.subDivide };
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
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.noise.type = noise.type;
    nodes.noiseVol.volume.value = noise.volume;
  }, [noise]);

  useEffect(() => {
    const nodes = nodesRef.current;
    if (!nodes) return;
    nodes.masterVol.volume.value = masterVolume;
  }, [masterVolume]);

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
    laneARuntime.current = { counter: 0, index: 0 };
    laneBRuntime.current = { counter: 0, index: 0 };
    setCurrentStepA(null);
    setCurrentStepB(null);
    setPlaying(false);
  }, []);

  const toggleStep = useCallback((lane: LaneId, index: number) => {
    const setter = lane === 'A' ? setLaneA : setLaneB;
    setter((prev) => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], active: !steps[index].active };
      return { ...prev, steps };
    });
  }, []);

  const setStepNote = useCallback((lane: LaneId, index: number, note: string) => {
    const setter = lane === 'A' ? setLaneA : setLaneB;
    setter((prev) => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], note, active: true };
      return { ...prev, steps };
    });
  }, []);

  const setLaneRate = useCallback((lane: LaneId, rate: number) => {
    const setter = lane === 'A' ? setLaneA : setLaneB;
    setter((prev) => ({ ...prev, rate }));
  }, []);

  const setLaneLength = useCallback((lane: LaneId, length: number) => {
    const setter = lane === 'A' ? setLaneA : setLaneB;
    setter((prev) => ({ ...prev, length }));
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
    noise,
    setNoise,
    masterVolume,
    setMasterVolume,
    laneA,
    laneB,
    toggleStep,
    setStepNote,
    setLaneRate,
    setLaneLength,
    bpm,
    setBpm,
    playing,
    play,
    stop,
    currentStepA,
    currentStepB,
  };
}

export type SynthEngine = ReturnType<typeof useSynthEngine>;
