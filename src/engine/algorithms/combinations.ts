import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function combine(n, k) {
  const res = [], current = [];
  function dfs(start) {
    if (current.length === k) { res.push([...current]); return; }
    for (let v = start; v <= n; v++) {
      current.push(v);
      dfs(v + 1);
      current.pop();
    }
  }
  dfs(1);
  return res;
}`;

function* dfs(
  t: Tracer,
  pool: TracedArray,
  current: TracedArray,
  res: string[],
  n: number,
  k: number,
  start: number,
): Generator<AlgoEvent> {
  if (current.length === k) {
    res.push(`[${current.values.join(',')}]`);
    yield t.found(4, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { start, res: [...res] },
      note: `${k} number${k === 1 ? '' : 's'} chosen: {${current.values.join(', ')}}.`,
    });
    return;
  }

  if (start > n) {
    yield t.note(5, {
      target: pool,
      vars: { start },
      note: `Nothing left to choose from and only ${current.length} of ${k} picked — this branch dies.`,
    });
    return;
  }

  for (let v = start; v <= n; v++) {
    yield t.push(6, current, v, {
      vars: { start, v },
      note: `Choose ${v}. The next pick starts at ${v + 1}, which is what stops {1,2} and {2,1} both appearing.`,
    });
    yield* dfs(t, pool, current, res, n, k, v + 1);
    yield t.pop(8, current, {
      vars: { start, v },
      note: `Every combination using ${v} at this depth is listed — take it back out and try the next number instead.`,
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = Number(input.n);
  const k = Number(input.k);
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be a positive integer.');
  if (!Number.isInteger(k) || k < 0) throw new Error('k must be a non-negative integer.');
  if (k > n) throw new Error(`k cannot exceed n — there are not ${k} numbers to choose from ${n}.`);
  if (n > 6) throw new Error('Keep n at 6 or below so the search stays watchable.');

  const t = new Tracer();
  const pool = t.array(
    'pool',
    Array.from({ length: n }, (_, idx) => idx + 1),
    `pool — the numbers 1…${n}`,
    ['v'],
  );
  const current = t.array('current', [], 'current combination', []);
  t.setVars({ n, k });

  yield t.note(1, {
    target: pool,
    note: `Order does not matter, so each branch may only pick numbers larger than the last — that turns ${n}! orderings into plain combinations.`,
  });

  const res: string[] = [];
  yield* dfs(t, pool, current, res, n, k, 1);

  yield t.note(12, {
    target: pool,
    vars: { start: undefined, v: undefined, res: [...res], result: res.length },
    note: `${res.length} combination${res.length === 1 ? '' : 's'} of ${k} from ${n}: ${res.join(' ')}.`,
  });
}

export const combinations: AlgorithmDef = {
  id: 'combinations',
  name: 'Combinations',
  category: 'Backtracking',
  code,
  inputFields: [
    { key: 'n', label: 'n', kind: 'number', placeholder: '4' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '2' },
  ],
  defaultInput: { n: 4, k: 2 },
  run,
};
