import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function climbStairs(n) {
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer.');
  if (n > 25) throw new Error('Keep n at 25 or below so the table stays readable.');

  const t = new Tracer();
  const dp = t.array('dp', new Array(Math.max(n + 1, 2)).fill(0), 'dp — ways to reach step i');
  t.setVars({ n });

  yield t.note(1, { note: 'Each step is reachable from one step back or two steps back.' });
  yield t.write(3, dp, 0, 1, { note: 'One way to stand at the bottom: do nothing.' });
  yield t.write(4, dp, 1, 1, { note: 'One way to reach step 1.' });

  for (let i = 2; i <= n; i++) {
    yield t.compare(6, {
      i: i - 1,
      j: i - 2,
      vars: { i },
      note: `dp[${i - 1}] = ${dp.num(i - 1)} and dp[${i - 2}] = ${dp.num(i - 2)}.`,
    });
    yield t.write(6, dp, i, dp.num(i - 1) + dp.num(i - 2), {
      note: `dp[${i}] = ${dp.num(i - 1)} + ${dp.num(i - 2)} = ${dp.num(i - 1) + dp.num(i - 2)}.`,
    });
  }

  yield t.settle(8, dp, [n], {
    vars: { i: undefined, result: dp.num(n) },
    note: `${dp.num(n)} distinct ways to climb ${n} step${n === 1 ? '' : 's'}.`,
  });
}

export const climbingStairs: AlgorithmDef = {
  id: 'climbing-stairs',
  name: 'Climbing Stairs',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '5' }],
  defaultInput: { n: 5 },
  run,
};
