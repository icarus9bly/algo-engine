import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 },
                       () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  return dp[0][0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const a = String(input.a ?? '');
  const b = String(input.b ?? '');
  if ((a.length + 1) * (b.length + 1) > 64) {
    throw new Error('Keep the two strings short enough that the table fits (about 7×7).');
  }

  const t = new Tracer();
  const aArr = t.array('a', [...a], 'a', ['i']);
  t.array('b', [...b], 'b', ['j']);
  const dp = t.grid(
    'dp',
    Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0)),
    'dp — rows are a, columns are b',
  );

  yield t.note(1, {
    note: 'dp[i][j] is the answer for the tails of both strings starting at i and j.',
  });
  yield t.note(2, {
    target: dp,
    note: 'The extra row and column are the empty tails, worth 0.',
  });

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const match = a[i] === b[j];
      yield t.compare(5, {
        target: aArr,
        i,
        vars: { i, j },
        note: `'${a[i]}' vs '${b[j]}' — ${match ? 'they match' : 'no match'}.`,
      });

      if (match) {
        const diag = dp.num(i + 1, j + 1);
        yield t.read(5, {
          target: dp,
          i: dp.at(i + 1, j + 1),
          note: `Both characters join the subsequence, so add 1 to the diagonal ${diag}.`,
        });
        yield t.writeCell(5, dp, i, j, 1 + diag, {
          note: `dp[${i}][${j}] = 1 + ${diag} = ${1 + diag}.`,
        });
      } else {
        const down = dp.num(i + 1, j);
        const rightOf = dp.num(i, j + 1);
        yield t.compare(6, {
          target: dp,
          i: dp.at(i + 1, j),
          j: dp.at(i, j + 1),
          note: `Drop one character or the other: ${down} vs ${rightOf}.`,
        });
        yield t.writeCell(6, dp, i, j, Math.max(down, rightOf), {
          note: `dp[${i}][${j}] = ${Math.max(down, rightOf)}.`,
        });
      }
    }
  }

  const result = dp.num(0, 0);
  yield t.settle(9, dp, [dp.at(0, 0)], {
    vars: { i: undefined, j: undefined, result },
    note: `Longest common subsequence has length ${result}.`,
  });
}

export const longestCommonSubsequence: AlgorithmDef = {
  id: 'longest-common-subsequence',
  name: 'Longest Common Subsequence',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'a', label: 'a', kind: 'text', placeholder: 'abcde' },
    { key: 'b', label: 'b', kind: 'text', placeholder: 'ace' },
  ],
  defaultInput: { a: 'abcde', b: 'ace' },
  run,
};
