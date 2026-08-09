import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function containsNearbyDuplicate(nums, k) {
  const window = new Set();
  let l = 0;
  for (let r = 0; r < nums.length; r++) {
    if (r - l > k) window.delete(nums[l++]);
    if (window.has(nums[r])) return true;
    window.add(nums[r]);
  }
  return false;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const k = input.k as number;

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['l', 'r']);
  t.setVars({ k });

  yield t.note(1, {
    note: `A duplicate only counts if the two copies are at most ${k} apart, so only a window that wide needs remembering.`,
  });

  const win = new Set<number>();
  let l = 0;
  yield t.note(3, { vars: { l, window: [] }, note: 'The window starts empty.' });

  for (let r = 0; r < a.length; r++) {
    if (r - l > k) {
      win.delete(a.num(l));
      yield t.note(5, {
        i: l,
        vars: { l: l + 1, window: [...win] },
        note: `${a.num(l)} has fallen more than ${k} behind — drop it.`,
      });
      l++;
    }

    const dup = win.has(a.num(r));
    yield t.compare(6, {
      i: r,
      indices: span(l, r),
      vars: { r },
      note: dup
        ? `${a.num(r)} is already inside the window.`
        : `${a.num(r)} is not in the window.`,
    });

    if (dup) {
      yield t.found(6, {
        i: r,
        vars: { result: true },
        note: `Two copies of ${a.num(r)} within ${k} positions.`,
      });
      return;
    }

    win.add(a.num(r));
    yield t.note(7, {
      indices: span(l, r),
      vars: { window: [...win] },
      note: `Add ${a.num(r)} to the window.`,
    });
  }

  yield t.note(9, {
    vars: { l: undefined, r: undefined, result: false },
    note: `No value repeats within ${k} positions.`,
  });
}

export const containsDuplicateII: AlgorithmDef = {
  id: 'contains-duplicate-ii',
  name: 'Contains Duplicate II',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 2, 3, 1' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { nums: [1, 2, 3, 1], k: 3 },
  run,
};
