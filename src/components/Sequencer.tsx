import { useCallback, useRef } from 'react';
import { SEQUENCE_NOTES, type Step } from '../audio/types';

interface SequencerProps {
  steps: Step[];
  currentStep: number | null;
  onToggle: (index: number) => void;
  onSetNote: (index: number, note: string) => void;
}

const TRACK_HEIGHT = 72;
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

export function Sequencer({ steps, currentStep, onToggle, onSetNote }: SequencerProps) {
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
      dragInfo.current = { index, wasActive: steps[index].active, moved: false, startY: e.clientY };
      updateFromPointer(e, index);
    },
    [steps, updateFromPointer],
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
    <div className="flex flex-grow flex-col gap-3.5">
      <div className="flex justify-between">
        <div className="text-[10px] tracking-widest text-text-dim">SEQUENCE</div>
        <div className="text-[10px] tracking-widest text-text-dim">16 STEPS &middot; 2 OCT</div>
      </div>

      <div className="flex flex-grow gap-2.5">
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

          <div className="relative flex h-full items-end gap-1.5" style={{ height: TRACK_HEIGHT }}>
            {steps.map((step, index) => {
              const isPlayhead = currentStep === index;
              const groupGap = (index + 1) % 4 === 0 && index !== steps.length - 1;
              const h = noteHeight(step.note);
              return (
                <div
                  key={index}
                  onPointerDown={(e) => handlePointerDown(e, index)}
                  onPointerMove={(e) => handlePointerMove(e, index)}
                  onPointerUp={() => handlePointerUp(index)}
                  className="relative h-full flex-1 touch-none"
                  style={{ marginRight: groupGap ? 12 : 0 }}
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

      <div className="flex pl-[30px] text-[9px] tracking-wide text-text-dimmer">
        <div className="flex-[4]">1</div>
        <div className="flex-[4]">5</div>
        <div className="flex-[4]">9</div>
        <div className="flex-[4]">13</div>
      </div>
    </div>
  );
}
