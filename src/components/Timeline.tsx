import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  frame: number;
  count: number;
  onFrame: (next: number) => void;
  /** Bumped by the parent when a new trace starts, so playback stops. */
  traceKey: string;
}

const SPEEDS = [0.5, 1, 2, 4];
const BASE_DELAY_MS = 500;

export function Timeline({ frame, count, onFrame, traceKey }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const frameRef = useRef(frame);
  frameRef.current = frame;
  const last = Math.max(0, count - 1);

  useEffect(() => {
    setPlaying(false);
  }, [traceKey]);

  useEffect(() => {
    if (!playing || count === 0) return;
    const id = window.setInterval(() => {
      const next = frameRef.current + 1;
      if (next > last) {
        setPlaying(false);
        return;
      }
      onFrame(next);
    }, BASE_DELAY_MS / speed);
    return () => window.clearInterval(id);
  }, [playing, speed, count, last, onFrame]);

  const step = useCallback(
    (delta: number) => {
      setPlaying(false);
      onFrame(Math.min(last, Math.max(0, frame + delta)));
    },
    [frame, last, onFrame],
  );

  const togglePlay = useCallback(() => {
    if (!playing && frame >= last) onFrame(0);
    setPlaying((p) => !p);
  }, [playing, frame, last, onFrame]);

  // Keyboard control, ignored while the user is typing in an input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'Home') { e.preventDefault(); setPlaying(false); onFrame(0); }
      else if (e.key === 'End') { e.preventDefault(); setPlaying(false); onFrame(last); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, togglePlay, onFrame, last]);

  return (
    <section className="timeline">
      <div className="timeline__controls">
        <button className="btn" onClick={() => { setPlaying(false); onFrame(0); }} title="Restart (Home)">
          ⏮
        </button>
        <button className="btn" onClick={() => step(-1)} disabled={frame === 0} title="Step back (←)">
          ◀
        </button>
        <button className="btn btn--primary" onClick={togglePlay} title="Play / pause (Space)">
          {playing ? '❚❚' : '▶'}
        </button>
        <button className="btn" onClick={() => step(1)} disabled={frame >= last} title="Step forward (→)">
          ▶
        </button>
        <button className="btn" onClick={() => { setPlaying(false); onFrame(last); }} title="Jump to end (End)">
          ⏭
        </button>
      </div>

      <input
        className="scrubber"
        type="range"
        min={0}
        max={last}
        value={Math.min(frame, last)}
        onChange={(e) => { setPlaying(false); onFrame(Number(e.target.value)); }}
        aria-label="Timeline position"
      />

      <div className="timeline__meta">
        <span className="counter">
          {count === 0 ? '0 / 0' : `${frame + 1} / ${count}`}
        </span>
        <label className="speed">
          speed
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
