import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function combinationSum(candidates, target) {
  const res = [], current = [];
  function dfs(i, total) {
    if (total === target) { res.push([...current]); return; }
    if (i >= candidates.length || total > target) return;
    current.push(candidates[i]);
    dfs(i, total + candidates[i]);
    current.pop();
    dfs(i + 1, total);
  }
  dfs(0, 0);
  return res;
}`;

function* dfs(
  t: Tracer,
  cands: TracedArray,
  current: TracedArray,
  res: string[],
  target: number,
  i: number,
  total: number,
): Generator<AlgoEvent> {
  if (total === target) {
    res.push(`[${current.values.join(',')}]`);
    yield t.found(4, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { res: [...res], total },
      note: `${current.values.join(' + ')} = ${target}. Record it and back out.`,
    });
    return;
  }

  if (i >= cands.length || total > target) {
    yield t.compare(5, {
      target: cands,
      i: Math.min(i, cands.length - 1),
      vars: { i, total },
      note: total > target
        ? `${total} has overshot ${target} — abandon this branch.`
        : 'No candidates left to try.',
    });
    return;
  }

  const pick = cands.num(i);

  yield t.push(6, current, pick, {
    vars: { i, total },
    note: `Take ${pick} — and stay at index ${i}, since a candidate may be reused.`,
  });
  yield* dfs(t, cands, current, res, target, i, total + pick);

  yield t.pop(8, current, {
    note: `Undo that ${pick}; now try the branch that never takes it.`,
  });
  yield* dfs(t, cands, current, res, target, i + 1, total);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const candidates = input.candidates as number[];
  const target = input.target as number;
  if (candidates.some((c) => c <= 0)) throw new Error('Candidates must be positive.');
  if (!Number.isInteger(target) || target < 0) throw new Error('target must be a non-negative integer.');
  if (target > 40) throw new Error('Keep target at 40 or below so the search stays watchable.');

  const t = new Tracer();
  const cands = t.array('candidates', candidates, 'candidates', ['i']);
  const current = t.array('current', [], 'current combination', []);
  t.setVars({ target });

  yield t.note(1, {
    note: 'Every candidate gets two branches: take it again, or move past it forever. That is what avoids duplicate combinations.',
  });

  const res: string[] = [];
  yield* dfs(t, cands, current, res, target, 0, 0);

  yield t.note(11, {
    vars: { i: undefined, total: undefined, res: [...res] },
    note: res.length === 0
      ? `Nothing sums to ${target}.`
      : `${res.length} combination${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const combinationSum: AlgorithmDef = {
  id: 'combination-sum',
  name: 'Combination Sum',
  category: 'Backtracking',
  code,
  inputFields: [
    { key: 'candidates', label: 'candidates', kind: 'numbers', placeholder: '2, 3, 6, 7' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '7' },
  ],
  defaultInput: { candidates: [2, 3, 6, 7], target: 7 },
  run,
};
