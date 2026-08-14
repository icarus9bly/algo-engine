import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function stoneGame(piles) {
  const n = piles.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = piles[i];
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const takeLeft = piles[i] - dp[i + 1][j];
      const takeRight = piles[j] - dp[i][j - 1];
      dp[i][j] = Math.max(takeLeft, takeRight);
    }
  }
  return dp[0][n - 1] > 0;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const piles = (input.piles as number[]) ?? [];
  const n = piles.length;
  if (n === 0) throw new Error('Give at least one pile.');
  if (n > 8) throw new Error('Keep it to 8 piles or fewer so the table stays readable.');
  if (piles.some((v) => !Number.isInteger(v) || v <= 0)) {
    throw new Error('Every pile must be a positive integer.');
  }

  const t = new Tracer();
  const pileArr = t.array('piles', [...piles], 'piles — taken only from either end', ['i', 'j']);
  const dp = t.grid(
    'dp',
    Array.from({ length: n }, () => new Array(n).fill('·')),
    'dp[i][j] — how far ahead the player to move ends up on piles i…j',
  );

  yield t.note(1, {
    target: pileArr,
    note: 'Both players play perfectly, so a cell holds a lead, not a score: how far ahead whoever moves next finishes.',
  });
  yield t.note(3, {
    target: dp,
    note: 'Only the upper triangle means anything — a range cannot end before it starts.',
  });

  for (let i = 0; i < n; i++) {
    yield t.writeCell(4, dp, i, i, piles[i], {
      vars: { i, j: i },
      note: `A single pile is taken whole, so the mover finishes ${piles[i]} ahead.`,
    });
  }

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const takeLeft = piles[i] - dp.num(i + 1, j);
      const takeRight = piles[j] - dp.num(i, j - 1);

      yield t.compare(8, {
        target: pileArr,
        i,
        j,
        vars: { len, i, j },
        note:
          `On piles ${i}…${j}: taking the left ${piles[i]} hands the opponent a lead of ${dp.num(i + 1, j)}, ` +
          `so the net is ${takeLeft}.`,
      });
      yield t.compare(9, {
        target: dp,
        i: dp.at(i + 1, j),
        j: dp.at(i, j - 1),
        note:
          `Taking the right ${piles[j]} instead leaves the opponent ${dp.num(i, j - 1)}, so the net is ${takeRight}. ` +
          `Subtracting is what flips the table to the other player.`,
      });
      yield t.writeCell(10, dp, i, j, Math.max(takeLeft, takeRight), {
        note: `The better move is the ${takeLeft >= takeRight ? 'left' : 'right'} end, worth a lead of ${Math.max(takeLeft, takeRight)}.`,
      });
    }
  }

  const lead = dp.num(0, n - 1);
  const result = lead > 0;
  yield t.settle(13, dp, [dp.at(0, n - 1)], {
    vars: { len: undefined, i: undefined, j: undefined, result },
    note: `Over the whole row the first player finishes ${lead} ahead, so they ${result ? 'win' : 'do not win'}.`,
  });
}

export const stoneGame: AlgorithmDef = {
  id: 'stone-game',
  name: 'Stone Game',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [{ key: 'piles', label: 'piles', kind: 'numbers', placeholder: '5, 3, 4, 5' }],
  defaultInput: { piles: [5, 3, 4, 5] },
  run,
};
