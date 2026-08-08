import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxProduct(nums) {
  let best = nums[0], curMax = 1, curMin = 1;
  for (let i = 0; i < nums.length; i++) {
    const n = nums[i];
    const candidate = curMax * n;
    curMax = Math.max(n, candidate, curMin * n);
    curMin = Math.min(n, candidate, curMin * n);
    best = Math.max(best, curMax);
  }
  return best;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');

  yield t.note(1, {
    note: 'A negative flips largest and smallest, so both must be carried along.',
  });

  if (a.length === 0) {
    yield t.note(9, { vars: { result: 0 }, note: 'Empty array.' });
    return;
  }

  let best = a.num(0);
  let curMax = 1;
  let curMin = 1;
  yield t.note(2, { i: 0, vars: { best, curMax, curMin } });

  for (let i = 0; i < a.length; i++) {
    const n = a.num(i);
    yield t.read(4, { i, vars: { i, n } });

    const candidate = curMax * n;
    const nextMax = Math.max(n, candidate, curMin * n);
    const nextMin = Math.min(n, candidate, curMin * n);
    yield t.compare(6, {
      i,
      vars: { curMax: nextMax, curMin: nextMin },
      note: n < 0
        ? `${n} is negative, so the running minimum ${curMin} becomes the new maximum candidate.`
        : `Extend the run: ${curMax} × ${n} = ${candidate}.`,
    });
    curMax = nextMax;
    curMin = nextMin;

    if (curMax > best) {
      best = curMax;
      yield t.found(8, { i, vars: { best }, note: `New best product: ${best}.` });
    }
  }

  yield t.note(10, {
    vars: { i: undefined, n: undefined, curMax: undefined, curMin: undefined, result: best },
    note: `Largest product of any contiguous run: ${best}.`,
  });
}

export const maxProductSubarray: AlgorithmDef = {
  id: 'max-product-subarray',
  name: 'Maximum Product Subarray',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '2, 3, -2, 4' },
  ],
  defaultInput: { nums: [2, 3, -2, 4] },
  run,
};
