import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (a - c >= 0) {
        dp[a] = Math.min(dp[a], 1 + dp[a - c]);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const coins = input.coins as number[];
  const amount = input.amount as number;
  if (!Number.isInteger(amount) || amount < 0) throw new Error('amount must be a non-negative integer.');
  if (amount > 30) throw new Error('Keep amount at 30 or below so the table stays readable.');
  if (coins.some((c) => c <= 0)) throw new Error('coins must be positive.');

  const t = new Tracer();
  const coinArr = t.array('coins', coins, 'coins', []);
  const dp = t.array('dp', new Array(amount + 1).fill(Infinity), 'dp — fewest coins for amount a', ['a']);

  yield t.note(1, { note: 'Build every amount from 1 up, reusing the best answer for smaller amounts.' });
  yield t.write(3, dp, 0, 0, { note: 'Zero coins make amount 0.' });

  for (let a = 1; a <= amount; a++) {
    yield t.read(4, { target: dp, i: a, vars: { a }, note: `Cheapest way to make ${a}?` });

    for (let ci = 0; ci < coinArr.length; ci++) {
      const c = coinArr.num(ci);
      if (a - c < 0) {
        yield t.compare(6, {
          target: coinArr,
          i: ci,
          note: `Coin ${c} is bigger than ${a} — skip it.`,
        });
        continue;
      }

      const candidate = 1 + dp.num(a - c);
      yield t.compare(7, {
        target: dp,
        i: a,
        j: a - c,
        vars: { candidate: Number.isFinite(candidate) ? candidate : 'unreachable' },
        note: `Using coin ${c} costs 1 + dp[${a - c}] = ${Number.isFinite(candidate) ? candidate : 'unreachable'}.`,
      });

      if (candidate < dp.num(a)) {
        yield t.write(7, dp, a, candidate, {
          note: `Better — ${a} now needs ${candidate} coin${candidate === 1 ? '' : 's'}.`,
        });
      }
    }
  }

  const answer = Number.isFinite(dp.num(amount)) ? dp.num(amount) : -1;
  yield t.settle(11, dp, [amount], {
    vars: { a: undefined, candidate: undefined, result: answer },
    note: answer === -1
      ? `${amount} cannot be made from these coins.`
      : `${amount} needs ${answer} coin${answer === 1 ? '' : 's'}.`,
  });
}

export const coinChange: AlgorithmDef = {
  id: 'coin-change',
  name: 'Coin Change',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'coins', label: 'coins', kind: 'numbers', placeholder: '1, 3, 4' },
    { key: 'amount', label: 'amount', kind: 'number', placeholder: '6' },
  ],
  defaultInput: { coins: [1, 3, 4], amount: 6 },
  run,
};
