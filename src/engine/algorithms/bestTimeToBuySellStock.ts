import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxProfit(prices) {
  let min = Infinity, best = 0;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < min) {
      min = prices[i];
    } else {
      best = Math.max(best, prices[i] - min);
    }
  }
  return best;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const prices = input.prices as number[];

  const t = new Tracer();
  const a = t.array('prices', prices, 'prices', null, 'bars');

  yield t.note(1, { note: 'Buy once, sell once, later. One pass is enough.' });

  let min = Infinity;
  let best = 0;
  let buyAt = -1;
  yield t.note(2, { vars: { min: 'Infinity', best }, note: 'Track the cheapest day seen so far.' });

  for (let i = 0; i < a.length; i++) {
    yield t.read(3, { i, vars: { i }, note: `Day ${i}, price ${a.num(i)}.` });

    if (a.num(i) < min) {
      min = a.num(i);
      buyAt = i;
      yield t.note(5, {
        i,
        vars: { min },
        note: `Cheapest so far — a better day to buy at ${min}.`,
      });
    } else {
      const profit = a.num(i) - min;
      yield t.compare(7, {
        i,
        j: buyAt,
        vars: { profit },
        note: `Selling here nets ${a.num(i)} − ${min} = ${profit}.`,
      });
      if (profit > best) {
        best = profit;
        yield t.found(7, {
          i,
          j: buyAt,
          vars: { best },
          note: `New best profit: buy day ${buyAt}, sell day ${i} → ${best}.`,
        });
      }
    }
  }

  yield t.note(10, {
    vars: { i: undefined, profit: undefined, best },
    note: `Maximum profit: ${best}.`,
  });
}

export const bestTimeToBuySellStock: AlgorithmDef = {
  id: 'best-time-to-buy-sell-stock',
  name: 'Best Time to Buy And Sell Stock',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 'prices', label: 'prices', kind: 'numbers', placeholder: '7, 1, 5, 3, 6, 4' },
  ],
  defaultInput: { prices: [7, 1, 5, 3, 6, 4] },
  run,
};
