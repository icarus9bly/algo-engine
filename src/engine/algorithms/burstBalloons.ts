import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxCoins(nums) {
  const a = [1, ...nums, 1];
  const n = a.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let len = 2; len < n; len++) {
    for (let i = 0; i + len < n; i++) {
      const j = i + len;
      for (let k = i + 1; k < j; k++) {
        const coins = a[i] * a[k] * a[j] + dp[i][k] + dp[k][j];
        dp[i][j] = Math.max(dp[i][j], coins);
      }
    }
  }
  return dp[0][n - 1];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = (input.nums as number[]) ?? [];
  if (nums.length === 0) throw new Error('Give at least one balloon.');
  if (nums.length > 6) throw new Error('Keep it to 6 balloons or fewer so the table stays readable.');
  if (nums.some((v) => !Number.isInteger(v) || v < 0)) {
    throw new Error('Every balloon must hold a non-negative integer.');
  }

  const t = new Tracer();
  const a = [1, ...nums, 1];
  const n = a.length;
  const balloons = t.array('a', [...a], 'a — the balloons, padded with a 1 at each end', ['i', 'j', 'k']);
  const dp = t.grid(
    'dp',
    Array.from({ length: n }, () => new Array(n).fill(0)),
    'dp[i][j] — the most coins from bursting everything strictly between i and j',
  );

  yield t.note(1, {
    target: balloons,
    note: 'Asking which balloon bursts first is hopeless — its neighbours keep changing. So each cell asks which one bursts LAST.',
  });
  yield t.note(2, {
    target: balloons,
    indices: [0, n - 1],
    note: 'A 1 is padded onto each end so every burst has two neighbours, and the padding is never itself burst.',
  });
  yield t.note(4, {
    target: dp,
    note: 'Ranges are filled shortest first, so the two sub-ranges a cell depends on are always already known.',
  });

  for (let len = 2; len < n; len++) {
    for (let i = 0; i + len < n; i++) {
      const j = i + len;
      for (let k = i + 1; k < j; k++) {
        const direct = a[i] * a[k] * a[j];
        const left = dp.num(i, k);
        const right = dp.num(k, j);
        const coins = direct + left + right;

        yield t.compare(8, {
          target: balloons,
          i: k,
          indices: [i, j],
          vars: { len, i, j, k },
          note:
            `If balloon ${k} (worth ${a[k]}) is the last to go in ${i}…${j}, its neighbours by then are the untouched ` +
            `${a[i]} and ${a[j]} — so it pays ${a[i]} × ${a[k]} × ${a[j]} = ${direct}.`,
        });
        yield t.compare(9, {
          target: dp,
          i: dp.at(i, k),
          j: dp.at(k, j),
          note: `Everything left of it is worth ${left} and everything right of it ${right}, for ${direct} + ${left} + ${right} = ${coins}.`,
        });

        if (coins > dp.num(i, j)) {
          yield t.writeCell(10, dp, i, j, coins, {
            note: `Best so far for ${i}…${j}: burst ${k} last, for ${coins}.`,
          });
        } else {
          yield t.note(10, {
            target: dp,
            i: dp.at(i, j),
            note: `${coins} does not beat the ${dp.num(i, j)} already banked for ${i}…${j}.`,
          });
        }
      }
    }
  }

  const result = dp.num(0, n - 1);
  yield t.settle(14, dp, [dp.at(0, n - 1)], {
    vars: { len: undefined, i: undefined, j: undefined, k: undefined, result },
    note: `Bursting every balloon in the best order collects ${result} coins.`,
  });
}

export const burstBalloons: AlgorithmDef = {
  id: 'burst-balloons',
  name: 'Burst Balloons',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [{ key: 'nums', label: 'balloons', kind: 'numbers', placeholder: '3, 1, 5, 8' }],
  defaultInput: { nums: [3, 1, 5, 8] },
  run,
};
