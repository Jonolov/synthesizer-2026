export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth';

export type FilterType = 'lowpass' | 'highpass' | 'bandpass';

export interface EnvelopeSettings {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface OscillatorSettings {
  waveform: Waveform;
  detune: number;
  volume: number;
  octave: number;
  semitones: number;
  subDivide: number;
  subVolume: number;
}

export interface FilterSettings {
  type: FilterType;
  cutoff: number;
  resonance: number;
}

export type NoiseType = 'white' | 'pink' | 'brown';

export interface NoiseSettings {
  type: NoiseType;
  volume: number;
}

export interface Step {
  active: boolean;
  note: string;
}

export const MAX_LANE_STEPS = 16;
export const MAX_LANE_RATE = 4;

export interface Lane {
  steps: Step[];
  length: number;
  rate: number;
}

export type LaneId = 'A' | 'B';

export const SEQUENCE_NOTES = [
  'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4',
  'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3',
] as const;
