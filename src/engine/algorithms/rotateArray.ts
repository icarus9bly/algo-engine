import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function rotate(nums, k) {
  k %= nums.length;
  reverse(nums, 0, nums.length - 1);
  reverse(nums, 0, k - 1);
  reverse(nums, k, nums.length - 1);
}

function reverse(nums, l, r) {
  while (l < r) {
    [nums[l], nums[r]] = [nums[r], nums[l]];
    l++;
    r--;
  }
}`;

function* reverse(
  t: Tracer,
  a: TracedArray,
  lo: number,
  hi: number,
  why: string,
): Generator<AlgoEvent> {
  const span = lo > hi ? [] : Array.from({ length: hi - lo + 1 }, (_, d) => lo + d);
  yield t.note(9, { indices: span, note: why });

  let l = lo;
  let r = hi;
  while (l < r) {
    yield t.swap(11, a, l, r, { vars: { l, r }, note: `Swap slots ${l} and ${r}.` });
    l++;
    r--;
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  let k = input.k as number;
  if (!Number.isInteger(k) || k < 0) throw new Error('k must be a non-negative integer.');
  if (nums.length === 0) throw new Error('Give at least one value.');

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['l', 'r']);

  k %= a.length;
  t.setVars({ k });
  yield t.note(1, {
    note: `Rotating right by ${k} is three reversals — no extra array and no repeated shifting.`,
  });

  yield* reverse(t, a, 0, a.length - 1, 'First reverse the whole array. The last k values are now at the front, but backwards.');
  yield* reverse(t, a, 0, k - 1, `Reverse the first ${k} to put that block back in order.`);
  yield* reverse(t, a, k, a.length - 1, 'Reverse the remainder to fix the rest.');

  yield t.settle(6, a, a.values.map((_, d) => d), {
    vars: { l: undefined, r: undefined, result: a.values.join(',') },
    note: `Rotated right by ${k}: ${a.values.join(', ')}.`,
  });
}

export const rotateArray: AlgorithmDef = {
  id: 'rotate-array',
  name: 'Rotate Array',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1,2,3,4,5,6,7' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { nums: [1, 2, 3, 4, 5, 6, 7], k: 3 },
  run,
};
