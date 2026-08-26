import { useCallback, useRef } from 'react';
import { MAX_LANE_RATE, MAX_LANE_STEPS, SEQUENCE_NOTES, type Lane } from '../audio/types';
import { Knob } from './Knob';

interface SequencerLaneProps {
  label: string;
  lane: Lane;
  currentStep: number | null;
  onToggle: (index: number) => void;
  onSetNote: (index: number, note: string) => void;
  onRateChange: (rate: number) => void;
  onLengthChange: (length: number) => void;
}

const TRACK_HEIGHT = 56;
const NOTE_LABELS = ['C5', 'G4', 'C4', 'G3'];

function noteHeight(note: string) {
  const idx = SEQUENCE_NOTES.indexOf(note as (typeof SEQUENCE_NOTES)[number]);
  const t = idx < 0 ? 0.5 : idx / (SEQUENCE_NOTES.length - 1);
  return (1 - t) * TRACK_HEIGHT;
}

function noteFromY(y: number, height: number) {
  const t = Math.min(1, Math.max(0, y / height));
  const idx = Math.round(t * (SEQUENCE_NOTES.length - 1));
  return SEQUENCE_NOTES[idx];
}

export function SequencerLane({
  label,
  lane,
  currentStep,
  onToggle,
  onSetNote,
  onRateChange,
  onLengthChange,
}: SequencerLaneProps) {
  const dragInfo = useRef<{ index: number; wasActive: boolean; moved: boolean; startY: number } | null>(null);

  const updateFromPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const note = noteFromY(e.clientY - rect.top, rect.height);
      onSetNote(index, note);
    },
    [onSetNote],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragInfo.current = { index, wasActive: lane.steps[index].active, moved: false, startY: e.clientY };
      updateFromPointer(e, index);
    },
    [lane.steps, updateFromPointer],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, index: number) => {
      const info = dragInfo.current;
      if (!info || info.index !== index) return;
      if (Math.abs(e.clientY - info.startY) > 3) info.moved = true;
      updateFromPointer(e, index);
    },
    [updateFromPointer],
  );

  const handlePointerUp = useCallback(
    (index: number) => {
      const info = dragInfo.current;
      if (info && info.index === index && !info.moved && info.wasActive) {
        onToggle(index);
      }
      dragInfo.current = null;
    },
    [onToggle],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[10px] tracking-widest text-text-dim">{label}</div>
        <div className="flex items-center gap-4">
          <Knob
            label="LEN"
            value={lane.length}
            min={1}
            max={MAX_LANE_STEPS}
            step={1}
            size={30}
            accent="accent2"
            onChange={(v) => onLengthChange(Math.round(v))}
          />
          <Knob
            label="RATE"
            value={lane.rate}
            min={1}
            max={MAX_LANE_RATE}
            step={1}
            size={30}
            accent="accent2"
            onChange={(v) => onRateChange(Math.round(v))}
            formatValue={(v) => `×${v}`}
          />
        </div>
      </div>

      <div className="flex gap-2.5">
        <div className="flex w-5 flex-col justify-between py-px text-right text-[8px] tracking-wide text-text-dimmer">
          {NOTE_LABELS.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>

        <div className="relative flex-grow">
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
            {NOTE_LABELS.map((n) => (
              <div key={n} className="border-t border-panel-border" />
            ))}
          </div>

          <div className="relative flex items-end gap-1.5" style={{ height: TRACK_HEIGHT }}>
            {lane.steps.map((step, index) => {
              const isPlayhead = currentStep === index;
              const beyondLength = index >= lane.length;
              const groupGap = (index + 1) % 4 === 0 && index !== lane.steps.length - 1;
              const h = noteHeight(step.note);
              return (
                <div
                  key={index}
                  onPointerDown={(e) => handlePointerDown(e, index)}
                  onPointerMove={(e) => handlePointerMove(e, index)}
                  onPointerUp={() => handlePointerUp(index)}
                  className="relative h-full flex-1 touch-none"
                  style={{ marginRight: groupGap ? 12 : 0, opacity: beyondLength ? 0.25 : 1 }}
                >
                  {isPlayhead && (
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        inset: 0,
                        margin: '-6px -6px',
                        background: 'rgba(109,255,184,0.14)',
                        border: '1px solid rgba(109,255,184,0.5)',
                      }}
                    />
                  )}
                  {step.active ? (
                    <>
                      <div
                        className="pointer-events-none absolute left-1/2 bottom-0 w-px -translate-x-1/2"
                        style={{ height: h, background: isPlayhead ? '#4a6058' : 'var(--color-stem)' }}
                      />
                      <div
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: h - 4,
                          width: isPlayhead ? 9 : 8,
                          height: isPlayhead ? 9 : 8,
                          borderRadius: 1,
                          background: isPlayhead ? 'var(--color-accent-bright)' : 'var(--color-accent)',
                          boxShadow: isPlayhead ? '0 0 8px 1px rgba(109,255,184,0.7)' : undefined,
                        }}
                      />
                    </>
                  ) : (
                    <div className="pointer-events-none absolute bottom-px left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-track" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
