import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function lastStoneWeightII(stones) {
  const total = sum(stones);
  const half = Math.floor(total / 2);
  const dp = Array.from({ length: stones.length + 1 },
                       () => new Array(half + 1).fill(false));
  dp[0][0] = true;
  for (let i = 1; i <= stones.length; i++) {
    for (let s = 0; s <= half; s++) {
      dp[i][s] = dp[i - 1][s];
      if (s >= stones[i - 1] && dp[i - 1][s - stones[i - 1]]) dp[i][s] = true;
    }
  }
  for (let s = half; s >= 0; s--)
    if (dp[stones.length][s]) return total - 2 * s;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const stones = (input.stones as number[]) ?? [];
  if (stones.length === 0) throw new Error('Give at least one stone.');
  if (stones.some((v) => !Number.isInteger(v) || v <= 0)) {
    throw new Error('Every stone must be a positive integer.');
  }
  const total = stones.reduce((acc, v) => acc + v, 0);
  const half = Math.floor(total / 2);
  if ((stones.length + 1) * (half + 1) > 64) {
    throw new Error('Keep the stones small enough that the table fits (about 64 cells).');
  }

  const t = new Tracer();
  const stoneArr = t.array('stones', [...stones], 'stones', ['i']);
  const dp = t.grid(
    'dp',
    Array.from({ length: stones.length + 1 }, () => new Array(half + 1).fill('F')),
    `dp — can the first i stones weigh exactly s? (columns are 0…${half})`,
  );

  yield t.note(1, {
    target: stoneArr,
    note: `Smashing two stones is the same as giving each stone a + or a −, so the answer is the smallest gap between two piles.`,
  });
  yield t.note(3, {
    target: dp,
    vars: { total, half },
    note: `The stones weigh ${total} in total, so the best possible pile is as close to ${half} as it can get without going over.`,
  });
  yield t.writeCell(6, dp, 0, 0, 'T', {
    note: 'With no stones chosen, a pile of 0 is reachable — that single cell seeds the whole table.',
  });

  for (let i = 1; i <= stones.length; i++) {
    const stone = stones[i - 1];
    for (let s = 0; s <= half; s++) {
      const without = dp.value(i - 1, s) === 'T';
      if (without) {
        yield t.writeCell(9, dp, i, s, 'T', {
          vars: { i, s, stone },
          note: `${s} was already reachable without the ${stone}, so leaving it out still works.`,
        });
        continue;
      }

      if (s < stone) {
        yield t.writeCell(9, dp, i, s, 'F', {
          vars: { i, s, stone },
          note: `${s} was not reachable before, and a stone of ${stone} is too heavy to land on it.`,
        });
        continue;
      }

      const withStone = dp.value(i - 1, s - stone) === 'T';
      yield t.compare(10, {
        target: dp,
        i: dp.at(i, s),
        j: dp.at(i - 1, s - stone),
        vars: { i, s, stone },
        note: `To reach ${s} using the ${stone}, the stones before it must reach ${s - stone} — ${withStone ? 'they can' : 'they cannot'}.`,
      });
      yield t.writeCell(10, dp, i, s, withStone ? 'T' : 'F', {
        note: withStone
          ? `Adding the ${stone} to a pile of ${s - stone} makes ${s}.`
          : `No way to build ${s} from the first ${i} stones.`,
      });
    }
  }

  let best = total;
  let bestCell = dp.at(stones.length, 0);
  for (let s = half; s >= 0; s--) {
    const reachable = dp.value(stones.length, s) === 'T';
    yield t.read(14, {
      target: dp,
      i: dp.at(stones.length, s),
      vars: { i: undefined, stone: undefined, s },
      note: `Is a pile of exactly ${s} reachable? ${reachable ? 'Yes — and it is the largest that is, so stop here.' : 'No — try one lighter.'}`,
    });
    if (reachable) {
      best = total - 2 * s;
      bestCell = dp.at(stones.length, s);
      break;
    }
  }

  yield t.settle(14, dp, [bestCell], {
    vars: { s: undefined, result: best },
    note: `The two piles differ by ${total} − 2 × ${(total - best) / 2} = ${best}, which is what the last stone weighs.`,
  });
}

export const lastStoneWeightII: AlgorithmDef = {
  id: 'last-stone-weight-ii',
  name: 'Last Stone Weight II',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [{ key: 'stones', label: 'stones', kind: 'numbers', placeholder: '1, 2, 3, 9' }],
  defaultInput: { stones: [1, 2, 3, 9] },
  run,
};
