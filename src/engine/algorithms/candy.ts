import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function candy(ratings) {
  const n = ratings.length;
  const candies = new Array(n).fill(1);
  for (let i = 1; i < n; i++) {
    if (ratings[i] > ratings[i - 1]) candies[i] = candies[i - 1] + 1;
  }
  for (let i = n - 2; i >= 0; i--) {
    if (ratings[i] > ratings[i + 1]) {
      candies[i] = Math.max(candies[i], candies[i + 1] + 1);
    }
  }
  return candies.reduce((a, b) => a + b, 0);
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const ratings = input.ratings as number[];
  if (ratings.length === 0) throw new Error('Give at least one rating.');

  const t = new Tracer();
  const r = t.array('ratings', ratings, 'ratings', ['i'], 'bars');
  const c = t.array('candies', new Array(ratings.length).fill(1), 'candies', ['i']);

  yield t.note(1, {
    note: 'Each neighbour rule points one way, so satisfy the left-hand rule in one pass and the right-hand rule in another.',
  });
  yield t.note(3, { target: c, indices: c.values.map((_, d) => d), note: 'Everyone starts with one sweet.' });

  for (let i = 1; i < r.length; i++) {
    const higher = r.num(i) > r.num(i - 1);
    yield t.compare(5, {
      target: r,
      i,
      j: i - 1,
      vars: { i },
      note: higher
        ? `${r.num(i)} beats the child on the left (${r.num(i - 1)}), so they need more.`
        : `${r.num(i)} does not beat ${r.num(i - 1)} — nothing owed leftward.`,
    });
    if (higher) {
      yield t.write(5, c, i, c.num(i - 1) + 1, {
        note: `Give ${c.num(i - 1) + 1}, one more than the left neighbour.`,
      });
    }
  }

  for (let i = r.length - 2; i >= 0; i--) {
    const higher = r.num(i) > r.num(i + 1);
    yield t.compare(8, {
      target: r,
      i,
      j: i + 1,
      vars: { i },
      note: higher
        ? `${r.num(i)} beats the child on the right (${r.num(i + 1)}).`
        : `${r.num(i)} does not beat ${r.num(i + 1)} — nothing owed rightward.`,
    });
    if (higher && c.num(i) < c.num(i + 1) + 1) {
      yield t.write(9, c, i, c.num(i + 1) + 1, {
        note: `Raise to ${c.num(i + 1) + 1} — taking the maximum keeps the first pass satisfied too.`,
      });
    }
  }

  const total = c.values.reduce((x, y) => (x as number) + (y as number), 0) as number;
  yield t.settle(12, c, c.values.map((_, d) => d), {
    vars: { i: undefined, result: total },
    note: `${total} sweets in total.`,
  });
}

export const candy: AlgorithmDef = {
  id: 'candy',
  name: 'Candy',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'ratings', label: 'ratings', kind: 'numbers', placeholder: '1, 0, 2' },
  ],
  defaultInput: { ratings: [1, 0, 2] },
  run,
};
