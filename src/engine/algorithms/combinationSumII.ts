import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function combinationSum2(candidates, target) {
  candidates.sort((a, b) => a - b);
  const res = [], current = [];
  function dfs(i, total) {
    if (total === target) { res.push([...current]); return; }
    if (i >= candidates.length || total > target) return;
    current.push(candidates[i]);
    dfs(i + 1, total + candidates[i]);
    current.pop();
    while (i + 1 < candidates.length && candidates[i] === candidates[i + 1]) i++;
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
    yield t.found(5, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { i, total, res: [...res] },
      note: `${current.values.join(' + ')} = ${target}. Record it and back out.`,
    });
    return;
  }

  if (i >= cands.length || total > target) {
    yield t.compare(6, {
      target: cands,
      i: Math.min(i, cands.length - 1),
      vars: { i, total },
      note: total > target
        ? `${total} has overshot ${target} — and since the list is sorted, everything ahead is only bigger.`
        : 'No candidates left, and the total never reached the target.',
    });
    return;
  }

  const pick = cands.num(i);

  yield t.push(7, current, pick, {
    vars: { i, total },
    note: `Take the ${pick} at index ${i}. Unlike Combination Sum, the next call moves on — each number is on offer once.`,
  });
  yield* dfs(t, cands, current, res, target, i + 1, total + pick);

  yield t.pop(9, current, {
    vars: { i, total },
    note: `Undo that ${pick}; now try the branch that never takes it.`,
  });

  let j = i;
  while (j + 1 < cands.length && cands.num(j) === cands.num(j + 1)) {
    j++;
    yield t.compare(10, {
      target: cands,
      i: j - 1,
      j,
      vars: { i: j },
      note: `Index ${j} is another ${pick}. Refusing it here would rebuild combinations already found, so skip past it.`,
    });
  }

  yield* dfs(t, cands, current, res, target, j + 1, total);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const candidates = [...((input.candidates as number[]) ?? [])].sort((a, b) => a - b);
  const target = Number(input.target);
  if (candidates.length === 0) throw new Error('Give at least one candidate.');
  if (candidates.some((c) => !Number.isInteger(c) || c <= 0)) {
    throw new Error('Every candidate must be a positive integer.');
  }
  if (!Number.isInteger(target) || target < 0) {
    throw new Error('The target must be a non-negative integer.');
  }
  if (candidates.length > 8) throw new Error('Keep it to 8 candidates or fewer so the search stays watchable.');

  const t = new Tracer();
  const cands = t.array('candidates', candidates, 'candidates — sorted, so equal values sit together', ['i']);
  const current = t.array('current', [], 'current combination', []);
  t.setVars({ target });

  yield t.note(2, {
    target: cands,
    note: 'Sorting does two jobs: it puts duplicates next to each other, and it lets an overshoot end a branch for good.',
  });

  const res: string[] = [];
  yield* dfs(t, cands, current, res, target, 0, 0);

  yield t.note(14, {
    target: cands,
    vars: { i: undefined, total: undefined, res: [...res], result: res.length },
    note: res.length === 0
      ? `No combination sums to ${target}.`
      : `${res.length} combination${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const combinationSumII: AlgorithmDef = {
  id: 'combination-sum-ii',
  name: 'Combination Sum II',
  category: 'Backtracking',
  code,
  inputFields: [
    { key: 'candidates', label: 'candidates', kind: 'numbers', placeholder: '10, 1, 2, 7, 6, 1, 5' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '8' },
  ],
  defaultInput: { candidates: [10, 1, 2, 7, 6, 1, 5], target: 8 },
  run,
};
