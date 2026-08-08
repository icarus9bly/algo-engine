import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function lengthOfLIS(nums) {
  const dp = new Array(nums.length).fill(1);
  for (let i = nums.length - 1; i >= 0; i--) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] < nums[j]) {
        dp[i] = Math.max(dp[i], 1 + dp[j]);
      }
    }
  }
  return Math.max(...dp, 0);
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');
  const dp = t.array('dp', new Array(nums.length).fill(1), 'dp — longest run starting at i');

  yield t.note(1, {
    note: 'dp[i] is the longest increasing run that starts at i; every entry begins at 1.',
  });

  for (let i = a.length - 1; i >= 0; i--) {
    yield t.read(3, { i, vars: { i }, note: `Anchor at nums[${i}] = ${a.num(i)}.` });

    for (let j = i + 1; j < a.length; j++) {
      const grows = a.num(i) < a.num(j);
      yield t.compare(5, {
        i,
        j,
        vars: { j },
        note: grows
          ? `${a.num(i)} < ${a.num(j)}, so the run can continue at ${j}.`
          : `${a.num(i)} ≥ ${a.num(j)} — cannot extend through ${j}.`,
      });

      if (grows && 1 + dp.num(j) > dp.num(i)) {
        yield t.write(6, dp, i, 1 + dp.num(j), {
          note: `dp[${i}] = 1 + dp[${j}] = ${1 + dp.num(j)}.`,
        });
      }
    }
  }

  const best = a.length === 0 ? 0 : Math.max(...dp.values.map(Number));
  const at = dp.values.findIndex((v) => Number(v) === best);
  yield t.found(10, {
    target: dp,
    indices: at >= 0 ? [at] : [],
    vars: { i: undefined, j: undefined, result: best },
    note: `Longest increasing subsequence: ${best}.`,
  });
}

export const longestIncreasingSubsequence: AlgorithmDef = {
  id: 'longest-increasing-subsequence',
  name: 'Longest Increasing Subsequence',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '10, 9, 2, 5, 3, 7, 101, 18' },
  ],
  defaultInput: { nums: [10, 9, 2, 5, 3, 7, 101, 18] },
  run,
};
