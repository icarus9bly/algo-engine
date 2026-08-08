import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function rob(nums) {
  const dp = new Array(nums.length).fill(0);
  for (let i = 0; i < nums.length; i++) {
    const skip = i > 0 ? dp[i - 1] : 0;
    const take = nums[i] + (i > 1 ? dp[i - 2] : 0);
    dp[i] = Math.max(skip, take);
  }
  return dp[nums.length - 1] ?? 0;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'houses');
  const dp = t.array('dp', new Array(nums.length).fill(0), 'dp — best loot through house i');

  yield t.note(1, { note: 'Adjacent houses cannot both be robbed.' });

  for (let i = 0; i < a.length; i++) {
    const skip = i > 0 ? dp.num(i - 1) : 0;
    yield t.read(4, {
      target: dp,
      i: i > 0 ? i - 1 : 0,
      vars: { i, skip },
      note: `Skipping house ${i} keeps ${skip}.`,
    });

    const take = a.num(i) + (i > 1 ? dp.num(i - 2) : 0);
    yield t.read(5, {
      i,
      vars: { take },
      note: `Robbing it gives ${a.num(i)}${i > 1 ? ` + dp[${i - 2}] = ${dp.num(i - 2)}` : ''} = ${take}.`,
    });

    yield t.write(6, dp, i, Math.max(skip, take), {
      note: take >= skip ? `Rob house ${i}.` : `Better to skip house ${i}.`,
    });
  }

  const best = a.length === 0 ? 0 : dp.num(a.length - 1);
  yield t.settle(8, dp, a.length ? [a.length - 1] : [], {
    vars: { i: undefined, skip: undefined, take: undefined, result: best },
    note: `Most that can be stolen: ${best}.`,
  });
}

export const houseRobber: AlgorithmDef = {
  id: 'house-robber',
  name: 'House Robber',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '2, 7, 9, 3, 1' },
  ],
  defaultInput: { nums: [2, 7, 9, 3, 1] },
  run,
};
