import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function change(amount, coins) {
  const dp = Array.from({ length: coins.length + 1 },
                       () => new Array(amount + 1).fill(0));
  dp[coins.length][0] = 1;
  for (let i = coins.length - 1; i >= 0; i--) {
    dp[i][0] = 1;
    for (let a = 1; a <= amount; a++) {
      dp[i][a] = dp[i + 1][a];
      if (a >= coins[i]) dp[i][a] += dp[i][a - coins[i]];
    }
  }
  return dp[0][amount];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const amount = Number(input.amount);
  const coins = (input.coins as number[]) ?? [];
  if (!Number.isInteger(amount) || amount < 0) {
    throw new Error('The amount must be a non-negative integer.');
  }
  if (coins.some((c) => !Number.isInteger(c) || c <= 0)) {
    throw new Error('Every coin must be a positive integer.');
  }
  if ((coins.length + 1) * (amount + 1) > 64) {
    throw new Error('Keep the amount and coin count small enough that the table fits (about 64 cells).');
  }

  const t = new Tracer();
  const coinArr = t.array('coins', [...coins], 'coins — one row of the table each', ['i']);
  const dp = t.grid(
    'dp',
    Array.from({ length: coins.length + 1 }, () => new Array(amount + 1).fill(0)),
    'dp — rows are "coins from here on", columns are the amount to make',
  );

  yield t.note(1, {
    target: coinArr,
    note: 'Rows go bottom-up: row i answers "using only the coins from i onward, how many ways make each amount?"',
  });
  yield t.writeCell(4, dp, coins.length, 0, 1, {
    note: 'With no coins left, there is exactly one way to make 0 — pay nothing. Every count traces back to this cell.',
  });

  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    yield t.writeCell(6, dp, i, 0, 1, {
      vars: { i, coin },
      note: `Amount 0 is always one way, whatever coins are on offer.`,
    });

    for (let a = 1; a <= amount; a++) {
      const without = dp.num(i + 1, a);
      yield t.writeCell(8, dp, i, a, without, {
        vars: { i, a, coin },
        note: `Ignoring the ${coin} entirely leaves ${without} way${without === 1 ? '' : 's'} to make ${a}.`,
      });

      if (a < coin) {
        yield t.note(9, {
          target: dp,
          i: dp.at(i, a),
          note: `A ${coin} does not fit inside ${a}, so that is the whole count.`,
        });
        continue;
      }

      const reuse = dp.num(i, a - coin);
      yield t.compare(9, {
        target: dp,
        i: dp.at(i, a),
        j: dp.at(i, a - coin),
        note: `Spending one ${coin} leaves ${a - coin}, which this same row already makes ${reuse} way${reuse === 1 ? '' : 's'}.`,
      });
      yield t.writeCell(9, dp, i, a, without + reuse, {
        note:
          `dp[${i}][${a}] = ${without} + ${reuse} = ${without + reuse}. Reading from the same row is what lets a ` +
          `coin be reused without ever counting the same handful twice.`,
      });
    }
  }

  const result = dp.num(0, amount);
  yield t.settle(12, dp, [dp.at(0, amount)], {
    vars: { i: undefined, a: undefined, coin: undefined, result },
    note: `${result} way${result === 1 ? '' : 's'} to make ${amount} from these coins.`,
  });
}

export const coinChangeII: AlgorithmDef = {
  id: 'coin-change-ii',
  name: 'Coin Change II',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'amount', label: 'amount', kind: 'number', placeholder: '5' },
    { key: 'coins', label: 'coins', kind: 'numbers', placeholder: '1, 2, 5' },
  ],
  defaultInput: { amount: 5, coins: [1, 2, 5] },
  run,
};
