import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function findTargetSumWays(nums, target) {
  const total = sum(nums);
  if (Math.abs(target) > total) return 0;
  const dp = Array.from({ length: nums.length + 1 },
                       () => new Array(2 * total + 1).fill(0));
  dp[0][total] = 1;
  for (let i = 0; i < nums.length; i++) {
    for (let s = 0; s <= 2 * total; s++) {
      if (dp[i][s] === 0) continue;
      dp[i + 1][s + nums[i]] += dp[i][s];
      dp[i + 1][s - nums[i]] += dp[i][s];
    }
  }
  return dp[nums.length][total + target];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = (input.nums as number[]) ?? [];
  const target = Number(input.target);
  if (!Number.isInteger(target)) throw new Error('The target must be an integer.');
  if (nums.some((v) => !Number.isInteger(v) || v < 0)) {
    throw new Error('Every number must be a non-negative integer.');
  }
  const total = nums.reduce((acc, v) => acc + v, 0);
  if ((nums.length + 1) * (2 * total + 1) > 96) {
    throw new Error('Keep the numbers small enough that the table fits (about 96 cells).');
  }

  const t = new Tracer();
  const numArr = t.array('nums', [...nums], 'nums — each one gets a + or a −', ['i']);

  if (Math.abs(target) > total) {
    yield t.note(3, {
      target: numArr,
      vars: { total, result: 0 },
      note: `Every sign choice lands between −${total} and ${total}, so ${target} is out of reach — 0 ways.`,
    });
    return;
  }

  const width = 2 * total + 1;
  const dp = t.grid(
    'dp',
    Array.from({ length: nums.length + 1 }, () => new Array(width).fill(0)),
    `dp — columns run −${total} … +${total}; the middle column is a running total of 0`,
  );

  yield t.note(1, {
    target: numArr,
    vars: { total },
    note: `The running total can never leave −${total} … +${total}, so one column per reachable total is enough.`,
  });
  yield t.writeCell(6, dp, 0, total, 1, {
    note: 'Before any number is signed, a running total of 0 has been reached exactly one way.',
  });

  for (let i = 0; i < nums.length; i++) {
    const n = nums[i];
    for (let s = 0; s < width; s++) {
      const ways = dp.num(i, s);
      if (ways === 0) continue;

      yield t.read(9, {
        target: dp,
        i: dp.at(i, s),
        vars: { i, s, n, running: s - total },
        note: `${ways} way${ways === 1 ? '' : 's'} reach a running total of ${s - total} after ${i} number${i === 1 ? '' : 's'}.`,
      });
      yield t.writeCell(10, dp, i + 1, s + n, dp.num(i + 1, s + n) + ways, {
        note: `Signing this ${n} as +${n} carries those ${ways} onto ${s - total + n}.`,
      });
      yield t.writeCell(11, dp, i + 1, s - n, dp.num(i + 1, s - n) + ways, {
        note: `Signing it as −${n} carries the same ${ways} onto ${s - total - n}.`,
      });
    }
  }

  const result = dp.num(nums.length, total + target);
  yield t.settle(14, dp, [dp.at(nums.length, total + target)], {
    vars: { i: undefined, s: undefined, n: undefined, running: undefined, result },
    note: `${result} way${result === 1 ? '' : 's'} to sign every number and total exactly ${target}.`,
  });
}

export const targetSum: AlgorithmDef = {
  id: 'target-sum',
  name: 'Target Sum',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 1, 1, 1, 1' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { nums: [1, 1, 1, 1, 1], target: 3 },
  run,
};
