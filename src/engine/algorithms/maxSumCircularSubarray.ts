import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxSubarraySumCircular(nums) {
  let total = 0;
  let curMax = 0, bestMax = -Infinity;
  let curMin = 0, bestMin = Infinity;
  for (const n of nums) {
    curMax = Math.max(curMax + n, n);
    bestMax = Math.max(bestMax, curMax);
    curMin = Math.min(curMin + n, n);
    bestMin = Math.min(bestMin, curMin);
    total += n;
  }
  return bestMax > 0 ? Math.max(bestMax, total - bestMin) : bestMax;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  if (nums.length === 0) throw new Error('Give at least one value.');

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums (wrapping around)', ['i']);

  yield t.note(1, {
    note: 'A wrapping subarray is everything except a non-wrapping one — so run Kadane twice, once for the maximum and once for the minimum.',
  });

  let total = 0;
  let curMax = 0;
  let bestMax = -Infinity;
  let curMin = 0;
  let bestMin = Infinity;
  yield t.note(4, { vars: { total, curMax, curMin }, note: 'Track both running sums at once.' });

  for (let i = 0; i < a.length; i++) {
    const n = a.num(i);
    curMax = Math.max(curMax + n, n);
    bestMax = Math.max(bestMax, curMax);
    curMin = Math.min(curMin + n, n);
    bestMin = Math.min(bestMin, curMin);
    total += n;
    yield t.read(6, {
      i,
      vars: { i, curMax, bestMax, curMin, bestMin, total },
      note: `After ${n}: best run so far ${bestMax}, worst run so far ${bestMin}.`,
    });
  }

  const wrapped = total - bestMin;
  if (bestMax > 0) {
    yield t.compare(13, {
      vars: { wrapped },
      note: `A wrapping answer is the total ${total} minus the worst middle ${bestMin} = ${wrapped}; the straight answer is ${bestMax}.`,
    });
    yield t.note(13, {
      vars: { result: Math.max(bestMax, wrapped) },
      note: `Take the better of the two: ${Math.max(bestMax, wrapped)}.`,
    });
  } else {
    yield t.note(13, {
      vars: { result: bestMax },
      note: 'Every value is negative, so removing the worst middle would leave nothing — the plain maximum stands.',
    });
  }
}

export const maxSumCircularSubarray: AlgorithmDef = {
  id: 'max-sum-circular-subarray',
  name: 'Maximum Sum Circular Subarray',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '5, -3, 5' },
  ],
  defaultInput: { nums: [5, -3, 5] },
  run,
};
