import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function numSquares(n) {
  const dp = new Array(n + 1).fill(Infinity);
  dp[0] = 0;
  for (let target = 1; target <= n; target++) {
    for (let s = 1; s * s <= target; s++) {
      dp[target] = Math.min(dp[target], 1 + dp[target - s * s]);
    }
  }
  return dp[n];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer.');
  if (n > 30) throw new Error('Keep n at 30 or below so the table stays readable.');

  const t = new Tracer();
  const dp = t.array('dp', new Array(n + 1).fill(Infinity), 'dp — fewest squares summing to i', ['target']);

  yield t.note(1, {
    note: 'Every number is some perfect square plus a smaller number already solved.',
  });
  yield t.write(3, dp, 0, 0, { note: 'Zero needs no squares.' });

  for (let target = 1; target <= n; target++) {
    yield t.read(4, { i: target, vars: { target }, note: `Fewest squares summing to ${target}?` });

    for (let s = 1; s * s <= target; s++) {
      const sq = s * s;
      const candidate = 1 + dp.num(target - sq);
      yield t.compare(6, {
        i: target - sq,
        vars: { square: sq },
        note: `Using ${sq} leaves ${target - sq}, which needs ${dp.num(target - sq)} — so ${candidate} in total.`,
      });
      if (candidate < dp.num(target)) {
        yield t.write(6, dp, target, candidate, {
          note: `Better — ${target} needs ${candidate} square${candidate === 1 ? '' : 's'}.`,
        });
      }
    }
  }

  yield t.settle(9, dp, [n], {
    vars: { target: undefined, square: undefined, result: dp.num(n) },
    note: `${n} is the sum of ${dp.num(n)} perfect square${dp.num(n) === 1 ? '' : 's'}.`,
  });
}

export const perfectSquares: AlgorithmDef = {
  id: 'perfect-squares',
  name: 'Perfect Squares',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '12' }],
  defaultInput: { n: 12 },
  run,
};
