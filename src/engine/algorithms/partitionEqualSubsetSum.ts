import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function canPartition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 !== 0) return false;
  const half = total / 2;
  const dp = new Array(half + 1).fill(false);
  dp[0] = true;
  for (const n of nums) {
    for (let s = half; s >= n; s--) {
      if (dp[s - n]) dp[s] = true;
    }
  }
  return dp[half];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  if (nums.some((n) => n <= 0)) throw new Error('Values must be positive.');
  const total = nums.reduce((x, y) => x + y, 0);
  if (total > 40) throw new Error('Keep the total at 40 or below so the table stays readable.');

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['i']);

  yield t.note(1, { note: 'Two equal halves means finding a subset summing to half the total.' });

  if (total % 2 !== 0) {
    yield t.note(3, {
      vars: { total, result: false },
      note: `The total is ${total}, which is odd — it cannot split evenly.`,
    });
    return;
  }

  const half = total / 2;
  const dp = t.array('dp', new Array(half + 1).fill('F'), 'dp — is this sum reachable?', ['s']);
  t.setVars({ total, half });
  yield t.note(4, { target: dp, note: `Each slot asks: can some subset add up to exactly that?` });

  yield t.write(6, dp, 0, 'T', { note: 'A sum of 0 is always reachable — take nothing.' });

  for (let i = 0; i < a.length; i++) {
    const n = a.num(i);
    yield t.read(7, { target: a, i, vars: { i }, note: `Consider ${n}.` });

    // Descending, so each value is used at most once.
    for (let s = half; s >= n; s--) {
      if (dp.at(s - n) === 'T' && dp.at(s) !== 'T') {
        yield t.compare(8, {
          target: dp,
          i: s - n,
          vars: { s },
          note: `${s - n} was reachable, so adding ${n} reaches ${s}.`,
        });
        yield t.write(9, dp, s, 'T', { note: `${s} is now reachable.` });
      }
    }
  }

  const ok = dp.at(half) === 'T';
  yield t.settle(12, dp, [half], {
    vars: { i: undefined, s: undefined, result: ok },
    note: ok
      ? `A subset sums to ${half}, so the array splits evenly.`
      : `No subset reaches ${half}, so it cannot be split.`,
  });
}

export const partitionEqualSubsetSum: AlgorithmDef = {
  id: 'partition-equal-subset-sum',
  name: 'Partition Equal Subset Sum',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 5, 11, 5' },
  ],
  defaultInput: { nums: [1, 5, 11, 5] },
  run,
};
