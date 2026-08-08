import { useCallback, useEffect, useMemo, useState } from 'react';
import { CodePane } from './components/CodePane';
import { StructureView } from './components/StructureView';
import { Timeline } from './components/Timeline';
import { VarsPane } from './components/VarsPane';
import { parseInput, serializeInput, type RawInput } from './engine/input';
import { algorithmById, algorithms, groupedAlgorithms } from './engine/registry';
import type { AlgoInput } from './engine/types';
import { useEventTrace } from './engine/useEventTrace';

export default function App() {
  const [algoId, setAlgoId] = useState(algorithms[0].id);
  const algo = algorithmById(algoId);

  const [raw, setRaw] = useState<RawInput>(() =>
    serializeInput(algo.inputFields, algo.defaultInput),
  );
  const [input, setInput] = useState<AlgoInput>(algo.defaultInput);
  const [frame, setFrame] = useState(0);

  const parsed = useMemo(() => parseInput(algo.inputFields, raw), [algo, raw]);

  // Commit the input only when it parses, so a half-typed value doesn't blank
  // out the visualisation — the last valid run stays on screen.
  useEffect(() => {
    if (!parsed.input) return;
    const next = parsed.input;
    setInput((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [parsed]);

  useEffect(() => {
    setFrame(0);
  }, [algo, input]);

  const trace = useEventTrace(algo, input);
  const count = trace.events.length;
  const event = count > 0 ? trace.events[Math.min(frame, count - 1)] : null;

  const selectAlgorithm = (id: string) => {
    const next = algorithmById(id);
    setAlgoId(id);
    setRaw(serializeInput(next.inputFields, next.defaultInput));
    setInput(next.defaultInput);
    setFrame(0);
  };

  const resetInput = () => {
    setRaw(serializeInput(algo.inputFields, algo.defaultInput));
    setInput(algo.defaultInput);
    setFrame(0);
  };

  const onFrame = useCallback((n: number) => setFrame(n), []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">▶</span>
          <span className="brand__name">algo engine</span>
        </div>

        <label className="field field--select">
          <span className="field__label">algorithm</span>
          <select value={algoId} onChange={(e) => selectAlgorithm(e.target.value)}>
            {groupedAlgorithms().map(([category, list]) => (
              <optgroup key={category} label={category}>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {algo.inputFields.map((f) => (
          <label className="field" key={f.key}>
            <span className="field__label">{f.label}</span>
            <input
              value={raw[f.key] ?? ''}
              placeholder={f.placeholder}
              spellCheck={false}
              onChange={(e) => setRaw({ ...raw, [f.key]: e.target.value })}
              size={f.kind === 'number' ? 6 : f.kind === 'numbers' ? 18 : 26}
            />
          </label>
        ))}

        <button className="btn btn--ghost" onClick={resetInput}>
          reset
        </button>
      </header>

      {(parsed.error || trace.error || trace.truncated) && (
        <div className="banner">
          {parsed.error ?? trace.error ?? 'Run truncated — too many events.'}
        </div>
      )}

      <main className="workspace">
        <CodePane code={algo.code} activeLine={event?.line} />

        <div className="workspace__right">
          <StructureView structures={event?.structures ?? []} event={event} />
          <VarsPane vars={event?.vars ?? {}} />
        </div>
      </main>

      <div className="status">
        {event?.note ? (
          <span className="status__note">{event.note}</span>
        ) : (
          <span className="status__note status__note--muted">
            Space to play, ← → to step.
          </span>
        )}
      </div>

      <Timeline
        frame={frame}
        count={count}
        onFrame={onFrame}
        traceKey={`${algo.id}:${JSON.stringify(input)}`}
      />
    </div>
  );
}
