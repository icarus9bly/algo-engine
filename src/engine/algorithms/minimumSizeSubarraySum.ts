import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function minSubArrayLen(target, nums) {
  let l = 0, sum = 0, best = Infinity;
  for (let r = 0; r < nums.length; r++) {
    sum += nums[r];
    while (sum >= target) {
      best = Math.min(best, r - l + 1);
      sum -= nums[l];
      l++;
    }
  }
  return best === Infinity ? 0 : best;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const target = input.target as number;
  if (nums.some((n) => n <= 0)) throw new Error('Values must be positive for the window to work.');

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['l', 'r'], 'bars');
  t.setVars({ target });

  yield t.note(1, {
    note: `All values are positive, so the sum only grows on the right and only shrinks on the left — the window never has to back up.`,
  });

  let l = 0;
  let sum = 0;
  let best = Infinity;
  yield t.note(2, { vars: { l, sum, best: '∞' }, note: 'Nothing in the window yet.' });

  for (let r = 0; r < a.length; r++) {
    sum += a.num(r);
    yield t.read(4, {
      i: r,
      indices: span(l, r),
      vars: { r, sum },
      note: `Extend by ${a.num(r)} — the window now sums to ${sum}.`,
    });

    while (sum >= target) {
      const length = r - l + 1;
      if (length < best) {
        best = length;
        yield t.found(6, {
          indices: span(l, r),
          vars: { best },
          note: `${sum} reaches ${target} with only ${length} value${length === 1 ? '' : 's'} — a new shortest.`,
        });
      } else {
        yield t.compare(6, {
          indices: span(l, r),
          note: `${length} values does not beat ${best}.`,
        });
      }

      sum -= a.num(l);
      yield t.note(7, {
        i: l,
        vars: { l: l + 1, sum },
        note: `Drop ${a.num(l)} from the left to see how much shorter it can get.`,
      });
      l++;
    }
  }

  const result = best === Infinity ? 0 : best;
  yield t.note(10, {
    vars: { l: undefined, r: undefined, sum: undefined, result },
    note: result === 0
      ? `No window reaches ${target}.`
      : `Shortest window reaching ${target}: ${result} values.`,
  });
}

export const minimumSizeSubarraySum: AlgorithmDef = {
  id: 'minimum-size-subarray-sum',
  name: 'Minimum Size Subarray Sum',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 'target', label: 'target', kind: 'number', placeholder: '7' },
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '2,3,1,2,4,3' },
  ],
  defaultInput: { target: 7, nums: [2, 3, 1, 2, 4, 3] },
  run,
};
