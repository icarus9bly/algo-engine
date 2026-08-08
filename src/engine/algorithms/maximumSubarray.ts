import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxSubArray(nums) {
  let best = nums[0], curr = 0;
  for (let i = 0; i < nums.length; i++) {
    if (curr < 0) curr = 0;
    curr += nums[i];
    best = Math.max(best, curr);
  }
  return best;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');

  yield t.note(1, {
    note: 'A prefix that has gone negative can only hurt what follows, so drop it.',
  });

  if (a.length === 0) {
    yield t.note(7, { vars: { result: 0 }, note: 'Empty array.' });
    return;
  }

  let best = a.num(0);
  let curr = 0;
  let start = 0;
  let bestL = 0;
  let bestR = 0;
  yield t.note(2, { vars: { best, curr } });

  for (let i = 0; i < a.length; i++) {
    if (curr < 0) {
      yield t.note(4, {
        i,
        vars: { curr: 0 },
        note: `The running sum is ${curr} — worse than starting fresh at ${i}.`,
      });
      curr = 0;
      start = i;
    }

    curr += a.num(i);
    yield t.read(5, {
      indices: span(start, i),
      vars: { i, curr },
      note: `Running sum over ${start}..${i} is ${curr}.`,
    });

    if (curr > best) {
      best = curr;
      bestL = start;
      bestR = i;
      yield t.found(6, {
        indices: span(bestL, bestR),
        vars: { best },
        note: `New best subarray sum: ${best}.`,
      });
    }
  }

  yield t.settle(8, a, span(bestL, bestR), {
    vars: { i: undefined, curr: undefined, result: best },
    note: `Largest subarray sum: ${best}.`,
  });
}

export const maximumSubarray: AlgorithmDef = {
  id: 'maximum-subarray',
  name: 'Maximum Subarray',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '-2, 1, -3, 4, -1, 2, 1, -5, 4' },
  ],
  defaultInput: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  run,
};
