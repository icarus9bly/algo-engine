import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function combinationSum4(nums, target) {
  const dp = new Array(target + 1).fill(0);
  dp[0] = 1;
  for (let total = 1; total <= target; total++) {
    for (const n of nums) {
      if (n <= total) dp[total] += dp[total - n];
    }
  }
  return dp[target];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const target = input.target as number;
  if (nums.some((n) => n <= 0)) throw new Error('Values must be positive.');
  if (!Number.isInteger(target) || target < 0) throw new Error('target must be a non-negative integer.');
  if (target > 30) throw new Error('Keep target at 30 or below so the table stays readable.');

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', []);
  const dp = t.array('dp', new Array(target + 1).fill(0), 'dp — ordered ways to make this total', ['total']);

  yield t.note(1, {
    note: 'Order counts here, so the loop over totals sits outside and the loop over values inside — swapping them would count combinations instead.',
  });
  yield t.write(3, dp, 0, 1, { note: 'One way to make 0: use nothing.' });

  for (let total = 1; total <= target; total++) {
    yield t.read(4, { target: dp, i: total, vars: { total }, note: `How many ordered ways make ${total}?` });

    for (let k = 0; k < a.length; k++) {
      const n = a.num(k);
      if (n > total) {
        yield t.compare(6, {
          target: a,
          i: k,
          note: `${n} is larger than ${total} — skip.`,
        });
        continue;
      }
      const add = dp.num(total - n);
      yield t.compare(6, {
        target: dp,
        i: total - n,
        note: `Ending with ${n} leaves ${total - n}, which has ${add} way${add === 1 ? '' : 's'}.`,
      });
      if (add > 0) {
        yield t.write(6, dp, total, dp.num(total) + add, {
          note: `dp[${total}] rises to ${dp.num(total) + add}.`,
        });
      }
    }
  }

  yield t.settle(9, dp, [target], {
    vars: { total: undefined, result: dp.num(target) },
    note: `${dp.num(target)} ordered combination${dp.num(target) === 1 ? '' : 's'} sum to ${target}.`,
  });
}

export const combinationSumIV: AlgorithmDef = {
  id: 'combination-sum-iv',
  name: 'Combination Sum IV',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 2, 3' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '4' },
  ],
  defaultInput: { nums: [1, 2, 3], target: 4 },
  run,
};
