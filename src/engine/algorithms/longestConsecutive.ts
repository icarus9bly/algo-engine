import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (set.has(n - 1)) continue;
    let length = 1;
    while (set.has(n + length)) length++;
    best = Math.max(best, length);
  }
  return best;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');

  yield t.note(1, { note: 'Longest run of consecutive values, in any order, in O(n).' });

  const set = new Set(nums);
  // Display-only: lets a run light up the cells it actually came from.
  const where = new Map<number, number>();
  for (let i = a.length - 1; i >= 0; i--) where.set(a.num(i), i);

  yield t.note(2, { vars: { set: [...set] }, note: 'A set makes "is n-1 present?" O(1).' });

  let best = 0;
  yield t.note(3, { vars: { best }, note: 'No run measured yet.' });

  for (let i = 0; i < a.length; i++) {
    const n = a.num(i);
    if (where.get(n) !== i) continue; // skip duplicate cells of the same value

    yield t.read(4, { i, vars: { i, n }, note: `Consider ${n}.` });

    if (set.has(n - 1)) {
      const prev = where.get(n - 1);
      yield t.compare(5, {
        i,
        j: prev,
        note: `${n - 1} exists, so ${n} is mid-run — only run starts are worth walking.`,
      });
      continue;
    }

    yield t.compare(5, { i, note: `${n - 1} is absent, so ${n} starts a run.` });

    let length = 1;
    while (set.has(n + length)) {
      const idxs = [];
      for (let d = 0; d <= length; d++) {
        const at = where.get(n + d);
        if (at !== undefined) idxs.push(at);
      }
      yield t.read(7, {
        indices: idxs,
        vars: { length: length + 1 },
        note: `${n + length} is present — the run reaches ${length + 1}.`,
      });
      length++;
    }

    if (length > best) {
      best = length;
      const idxs = [];
      for (let d = 0; d < length; d++) {
        const at = where.get(n + d);
        if (at !== undefined) idxs.push(at);
      }
      yield t.found(8, {
        indices: idxs,
        vars: { best },
        note: `New best: ${n}..${n + length - 1} is ${length} long.`,
      });
    } else {
      yield t.note(8, { i, vars: { best }, note: `Run of ${length} does not beat ${best}.` });
    }
  }

  yield t.note(10, {
    vars: { i: undefined, n: undefined, length: undefined, best },
    note: `Longest consecutive run: ${best}.`,
  });
}

export const longestConsecutive: AlgorithmDef = {
  id: 'longest-consecutive',
  name: 'Longest Consecutive Sequence',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '100, 4, 200, 1, 3, 2' },
  ],
  defaultInput: { nums: [100, 4, 200, 1, 3, 2] },
  run,
};
