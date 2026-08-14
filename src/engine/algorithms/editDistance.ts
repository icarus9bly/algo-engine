import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function minDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 },
                       () => new Array(b.length + 1).fill(0));
  for (let j = 0; j <= b.length; j++) dp[a.length][j] = b.length - j;
  for (let i = 0; i <= a.length; i++) dp[i][b.length] = a.length - i;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1];
      else dp[i][j] = 1 + Math.min(dp[i + 1][j], dp[i][j + 1], dp[i + 1][j + 1]);
    }
  }
  return dp[0][0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const a = String(input.a ?? '');
  const b = String(input.b ?? '');
  if ((a.length + 1) * (b.length + 1) > 64) {
    throw new Error('Keep the two words short enough that the table fits (about 7×7).');
  }

  const t = new Tracer();
  const aArr = t.array('a', [...a], 'a — the word being edited', ['i']);
  t.array('b', [...b], 'b — the target word', ['j']);
  const dp = t.grid(
    'dp',
    Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0)),
    'dp — edits to turn the tail of a into the tail of b',
  );

  yield t.note(1, {
    target: aArr,
    note: 'dp[i][j] is the cheapest way to turn the tail of a from i into the tail of b from j.',
  });

  for (let j = b.length; j >= 0; j--) {
    yield t.writeCell(4, dp, a.length, j, b.length - j, {
      vars: { j },
      note: `a has run out, so the only move left is to insert b's remaining ${b.length - j} character${b.length - j === 1 ? '' : 's'}.`,
    });
  }
  for (let i = a.length - 1; i >= 0; i--) {
    yield t.writeCell(5, dp, i, b.length, a.length - i, {
      vars: { i, j: undefined },
      note: `b has run out, so the only move left is to delete a's remaining ${a.length - i} character${a.length - i === 1 ? '' : 's'}.`,
    });
  }

  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const match = a[i] === b[j];
      yield t.compare(8, {
        target: aArr,
        i,
        vars: { i, j },
        note: `'${a[i]}' vs '${b[j]}' — ${match ? 'the same character' : 'different characters'}.`,
      });

      if (match) {
        const diag = dp.num(i + 1, j + 1);
        yield t.writeCell(8, dp, i, j, diag, {
          note: `Matching characters cost nothing, so this cell just inherits the diagonal: ${diag}.`,
        });
        continue;
      }

      const del = dp.num(i + 1, j);
      const ins = dp.num(i, j + 1);
      const sub = dp.num(i + 1, j + 1);
      const best = Math.min(del, ins, sub);
      yield t.compare(9, {
        target: dp,
        i: dp.at(i + 1, j),
        j: dp.at(i, j + 1),
        indices: [dp.at(i + 1, j + 1)],
        note: `Delete '${a[i]}' costs ${del}, insert '${b[j]}' costs ${ins}, replace costs ${sub} — the cheapest is ${best}.`,
      });
      yield t.writeCell(9, dp, i, j, 1 + best, {
        note: `One edit on top of the cheapest tail: dp[${i}][${j}] = 1 + ${best} = ${1 + best}.`,
      });
    }
  }

  const result = dp.num(0, 0);
  yield t.settle(12, dp, [dp.at(0, 0)], {
    vars: { i: undefined, j: undefined, result },
    note: `Turning "${a}" into "${b}" takes ${result} edit${result === 1 ? '' : 's'}.`,
  });
}

export const editDistance: AlgorithmDef = {
  id: 'edit-distance',
  name: 'Edit Distance',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'a', label: 'a', kind: 'text', placeholder: 'horse' },
    { key: 'b', label: 'b', kind: 'text', placeholder: 'ros' },
  ],
  defaultInput: { a: 'horse', b: 'ros' },
  run,
};
