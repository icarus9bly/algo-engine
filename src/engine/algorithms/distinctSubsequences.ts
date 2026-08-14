import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function numDistinct(s, t) {
  const dp = Array.from({ length: s.length + 1 },
                       () => new Array(t.length + 1).fill(0));
  for (let i = 0; i <= s.length; i++) dp[i][t.length] = 1;
  for (let i = s.length - 1; i >= 0; i--) {
    for (let j = t.length - 1; j >= 0; j--) {
      dp[i][j] = dp[i + 1][j];
      if (s[i] === t[j]) dp[i][j] += dp[i + 1][j + 1];
    }
  }
  return dp[0][0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const target = String(input.t ?? '');
  if ((s.length + 1) * (target.length + 1) > 64) {
    throw new Error('Keep the two strings short enough that the table fits (about 8×8).');
  }

  const tr = new Tracer();
  const sArr = tr.array('s', [...s], 's — the string being searched', ['i']);
  tr.array('t', [...target], 't — the subsequence to find', ['j']);
  const dp = tr.grid(
    'dp',
    Array.from({ length: s.length + 1 }, () => new Array(target.length + 1).fill(0)),
    'dp — ways the tail of t appears inside the tail of s',
  );

  yield tr.note(1, {
    target: sArr,
    note: 'dp[i][j] counts the ways the tail of t from j appears as a subsequence of the tail of s from i.',
  });

  for (let i = s.length; i >= 0; i--) {
    yield tr.writeCell(4, dp, i, target.length, 1, {
      vars: { i },
      note: 'An empty t is already found once — by taking nothing at all.',
    });
  }

  for (let i = s.length - 1; i >= 0; i--) {
    for (let j = target.length - 1; j >= 0; j--) {
      const skip = dp.num(i + 1, j);
      yield tr.writeCell(6, dp, i, j, skip, {
        vars: { i, j },
        note: `Skipping '${s[i]}' leaves the same job to the rest of s, worth ${skip}.`,
      });

      const match = s[i] === target[j];
      yield tr.compare(7, {
        target: sArr,
        i,
        note: `'${s[i]}' vs '${target[j]}' — ${match ? "they match, so '" + s[i] + "' may also be used" : 'no match, so it can only be skipped'}.`,
      });

      if (match) {
        const use = dp.num(i + 1, j + 1);
        yield tr.writeCell(7, dp, i, j, skip + use, {
          note: `Using it adds the ${use} way${use === 1 ? '' : 's'} from the diagonal: ${skip} + ${use} = ${skip + use}.`,
        });
      }
    }
  }

  const result = dp.num(0, 0);
  yield tr.settle(10, dp, [dp.at(0, 0)], {
    vars: { i: undefined, j: undefined, result },
    note: `"${target}" appears in "${s}" as a subsequence ${result} time${result === 1 ? '' : 's'}.`,
  });
}

export const distinctSubsequences: AlgorithmDef = {
  id: 'distinct-subsequences',
  name: 'Distinct Subsequences',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'rabbbit' },
    { key: 't', label: 't', kind: 'text', placeholder: 'rabbit' },
  ],
  defaultInput: { s: 'rabbbit', t: 'rabbit' },
  run,
};
