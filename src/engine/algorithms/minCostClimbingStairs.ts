import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function minCostClimbingStairs(cost) {
  const dp = new Array(cost.length + 1).fill(0);
  for (let i = 2; i <= cost.length; i++) {
    dp[i] = Math.min(dp[i - 1] + cost[i - 1],
                     dp[i - 2] + cost[i - 2]);
  }
  return dp[cost.length];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cost = input.cost as number[];
  if (cost.length < 2) throw new Error('Give at least two steps.');
  if (cost.length > 20) throw new Error('Keep it to 20 steps or fewer.');

  const t = new Tracer();
  const c = t.array('cost', cost, 'cost', ['i']);
  const dp = t.array('dp', new Array(cost.length + 1).fill(0), 'dp — cheapest way to stand at i', ['i']);

  yield t.note(1, { note: 'You may start at step 0 or 1, so both cost nothing to reach.' });
  yield t.note(2, { target: dp, indices: [0, 1], note: 'Reaching either starting step is free.' });

  for (let i = 2; i <= c.length; i++) {
    const one = dp.num(i - 1) + c.num(i - 1);
    const two = dp.num(i - 2) + c.num(i - 2);
    yield t.compare(4, {
      target: dp,
      i: i - 1,
      j: i - 2,
      vars: { i, viaOne: one, viaTwo: two },
      note: `One step from ${i - 1} costs ${one}; two steps from ${i - 2} costs ${two}.`,
    });
    yield t.write(4, dp, i, Math.min(one, two), {
      note: `dp[${i}] = ${Math.min(one, two)}.`,
    });
  }

  const result = dp.num(c.length);
  yield t.settle(6, dp, [c.length], {
    vars: { i: undefined, viaOne: undefined, viaTwo: undefined, result },
    note: `Cheapest way past the top: ${result}.`,
  });
}

export const minCostClimbingStairs: AlgorithmDef = {
  id: 'min-cost-climbing-stairs',
  name: 'Min Cost Climbing Stairs',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'cost', label: 'cost', kind: 'numbers', placeholder: '1, 100, 1, 1, 1, 100, 1, 1, 100, 1' },
  ],
  defaultInput: { cost: [1, 100, 1, 1, 1, 100, 1, 1, 100, 1] },
  run,
};
