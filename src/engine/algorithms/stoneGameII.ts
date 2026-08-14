import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function stoneGameII(piles) {
  const n = piles.length;
  const suffix = suffixSums(piles);
  const dp = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let m = n; m >= 1; m--) {
      if (i + 2 * m >= n) { dp[i][m] = suffix[i]; continue; }
      let best = 0;
      for (let x = 1; x <= 2 * m; x++)
        best = Math.max(best, suffix[i] - dp[i + x][Math.max(m, x)]);
      dp[i][m] = best;
    }
  }
  return dp[0][1];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const piles = (input.piles as number[]) ?? [];
  const n = piles.length;
  if (n === 0) throw new Error('Give at least one pile.');
  if (n > 7) throw new Error('Keep it to 7 piles or fewer so the table stays readable.');
  if (piles.some((v) => !Number.isInteger(v) || v <= 0)) {
    throw new Error('Every pile must be a positive integer.');
  }

  const suffix = new Array<number>(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + piles[i];

  const t = new Tracer();
  const pileArr = t.array('piles', [...piles], 'piles — taken from the front, 1…2M at a time', ['i']);
  t.array('suffix', [...suffix], 'suffix — stones left from each position onward');
  const dp = t.grid(
    'dp',
    Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0)),
    'dp[i][M] — the most stones the player to move can take from pile i onward',
  );

  yield t.note(1, {
    target: pileArr,
    note: 'A move takes 1…2M piles off the front and sets M to the larger of M and however many were taken.',
  });
  yield t.note(3, {
    target: dp,
    note: 'Two things pin down a position: where the front is, and what M has grown to. That is the whole table.',
  });

  for (let i = n - 1; i >= 0; i--) {
    for (let m = n; m >= 1; m--) {
      if (i + 2 * m >= n) {
        yield t.writeCell(7, dp, i, m, suffix[i], {
          vars: { i, m },
          note: `With M = ${m}, all ${n - i} remaining pile${n - i === 1 ? '' : 's'} can be swept up at once — that is ${suffix[i]} stones.`,
        });
        continue;
      }

      let best = 0;
      let bestX = 1;
      for (let x = 1; x <= 2 * m; x++) {
        const nextM = Math.max(m, x);
        const opponent = dp.num(i + x, nextM);
        const mine = suffix[i] - opponent;
        yield t.compare(10, {
          target: dp,
          i: dp.at(i + x, nextM),
          vars: { i, m, x },
          note:
            `Take ${x} pile${x === 1 ? '' : 's'}: ${suffix[i]} stones remain in play, the opponent then takes ` +
            `${opponent} of them, so this move is worth ${mine}.`,
        });
        if (mine > best) {
          best = mine;
          bestX = x;
        }
      }

      yield t.writeCell(11, dp, i, m, best, {
        vars: { x: undefined },
        note: `Taking ${bestX} pile${bestX === 1 ? '' : 's'} is the best move here, worth ${best} stones.`,
      });
    }
  }

  const result = dp.num(0, 1);
  yield t.settle(14, dp, [dp.at(0, 1)], {
    vars: { i: undefined, m: undefined, result },
    note: `Starting at the front with M = 1, the first player can secure ${result} stones.`,
  });
}

export const stoneGameII: AlgorithmDef = {
  id: 'stone-game-ii',
  name: 'Stone Game II',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [{ key: 'piles', label: 'piles', kind: 'numbers', placeholder: '2, 7, 9, 4, 4' }],
  defaultInput: { piles: [2, 7, 9, 4, 4] },
  run,
};
