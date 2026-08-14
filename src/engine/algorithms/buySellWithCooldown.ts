import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxProfit(prices) {
  // two spare rows of zeros, so the cooldown day always has a row to read
  const dp = rows(prices.length + 2, [0, 0]);
  for (let i = prices.length - 1; i >= 0; i--) {
    const buy = dp[i + 1][1] - prices[i];
    dp[i][0] = Math.max(dp[i + 1][0], buy);
    const sell = dp[i + 2][0] + prices[i];
    dp[i][1] = Math.max(dp[i + 1][1], sell);
  }
  return dp[0][0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const prices = (input.prices as number[]) ?? [];
  if (prices.some((v) => !Number.isInteger(v) || v < 0)) {
    throw new Error('Every price must be a non-negative integer.');
  }
  if (prices.length > 12) {
    throw new Error('Keep it to 12 days or fewer so the table stays readable.');
  }

  const t = new Tracer();
  const priceArr = t.array('prices', [...prices], 'prices — one row of the table each', ['i']);
  const dp = t.grid(
    'dp',
    Array.from({ length: prices.length + 2 }, () => [0, 0]),
    'dp — column 0: holding nothing, column 1: holding a share',
  );

  yield t.note(1, {
    target: priceArr,
    note: 'Two states are enough for a day: either a share is held or it is not. Each row is one day.',
  });
  yield t.note(3, {
    target: dp,
    indices: [dp.at(prices.length, 0), dp.at(prices.length, 1), dp.at(prices.length + 1, 0), dp.at(prices.length + 1, 1)],
    note: 'Past the last day nothing can be earned, and the spare second row is what a sale on the final day cools down into.',
  });

  for (let i = prices.length - 1; i >= 0; i--) {
    const price = prices[i];

    const skipFree = dp.num(i + 1, 0);
    const buy = dp.num(i + 1, 1) - price;
    yield t.compare(5, {
      target: dp,
      i: dp.at(i + 1, 0),
      j: dp.at(i + 1, 1),
      vars: { i, price },
      note: `Holding nothing on day ${i}: sit tight for ${skipFree}, or buy at ${price} and carry a share worth ${dp.num(i + 1, 1)} — that is ${buy}.`,
    });
    yield t.writeCell(6, dp, i, 0, Math.max(skipFree, buy), {
      note: `${buy > skipFree ? 'Buying' : 'Waiting'} wins, so day ${i} with empty hands is worth ${Math.max(skipFree, buy)}.`,
    });

    const skipHeld = dp.num(i + 1, 1);
    const sell = dp.num(i + 2, 0) + price;
    yield t.compare(7, {
      target: dp,
      i: dp.at(i + 1, 1),
      j: dp.at(i + 2, 0),
      note:
        `Holding a share on day ${i}: keep it for ${skipHeld}, or sell at ${price} — but the cooldown means the next ` +
        `day is skipped, so that picks up from day ${i + 2}: ${dp.num(i + 2, 0)} + ${price} = ${sell}.`,
    });
    yield t.writeCell(8, dp, i, 1, Math.max(skipHeld, sell), {
      note: `${sell > skipHeld ? 'Selling' : 'Holding'} wins, so day ${i} with a share is worth ${Math.max(skipHeld, sell)}.`,
    });
  }

  const result = dp.num(0, 0);
  yield t.settle(10, dp, [dp.at(0, 0)], {
    vars: { i: undefined, price: undefined, result },
    note: `Starting on day 0 with nothing held, the best achievable profit is ${result}.`,
  });
}

export const buySellWithCooldown: AlgorithmDef = {
  id: 'best-time-to-buy-and-sell-stock-with-cooldown',
  name: 'Best Time to Buy And Sell Stock With Cooldown',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [{ key: 'prices', label: 'prices', kind: 'numbers', placeholder: '1, 2, 3, 0, 2' }],
  defaultInput: { prices: [1, 2, 3, 0, 2] },
  run,
};
