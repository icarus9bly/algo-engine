import { useMemo } from 'react';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from './types';

/** Guards against a buggy generator hanging the tab. */
const MAX_EVENTS = 20000;

export interface Trace {
  events: AlgoEvent[];
  error: string | null;
  truncated: boolean;
}

/**
 * Runs an algorithm generator to completion exactly once and caches the full
 * event list. Scrubbing backward is then a plain array index — nothing
 * re-executes, so a run is always deterministic and cheap to replay.
 */
export function useEventTrace(algo: AlgorithmDef, input: AlgoInput): Trace {
  const inputKey = JSON.stringify(input);

  return useMemo(() => {
    const events: AlgoEvent[] = [];
    let error: string | null = null;
    let truncated = false;

    try {
      for (const event of algo.run(input)) {
        events.push(event);
        if (events.length >= MAX_EVENTS) {
          truncated = true;
          break;
        }
      }
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    return { events, error, truncated };
    // `inputKey` stands in for a deep compare of `input`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algo, inputKey]);
}
