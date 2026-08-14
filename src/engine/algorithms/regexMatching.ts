import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function isMatch(s, p) {
  const dp = Array.from({ length: s.length + 1 },
                       () => new Array(p.length + 1).fill(false));
  dp[s.length][p.length] = true;
  for (let i = s.length; i >= 0; i--) {
    for (let j = p.length - 1; j >= 0; j--) {
      const first = i < s.length && (p[j] === s[i] || p[j] === '.');
      if (p[j + 1] === '*') dp[i][j] = dp[i][j + 2] || (first && dp[i + 1][j]);
      else dp[i][j] = first && dp[i + 1][j + 1];
    }
  }
  return dp[0][0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const p = String(input.p ?? '');
  if ((s.length + 1) * (p.length + 1) > 64) {
    throw new Error('Keep the string and pattern short enough that the table fits (about 7×7).');
  }
  if (!/^[a-z.*]*$/.test(p)) {
    throw new Error('The pattern may only use lowercase letters, "." and "*".');
  }
  if (p.startsWith('*') || p.includes('**')) {
    throw new Error('Every "*" must follow a letter or a ".".');
  }
  if (!/^[a-z]*$/.test(s)) {
    throw new Error('The string may only use lowercase letters.');
  }

  const t = new Tracer();
  t.array('s', [...s], 's — the string to match', ['i']);
  const pArr = t.array('p', [...p], 'p — the pattern', ['j']);
  const dp = t.grid(
    'dp',
    Array.from({ length: s.length + 1 }, () => new Array(p.length + 1).fill('F')),
    'dp — does the tail of s from this row match the tail of p from this column?',
  );

  yield t.note(1, {
    target: pArr,
    note: '"." matches any single character and "*" repeats the character before it any number of times, zero included.',
  });
  yield t.writeCell(4, dp, s.length, p.length, 'T', {
    vars: { i: s.length, j: p.length },
    note: 'An empty pattern matches an empty string. Every other cell is decided from cells below and to the right of it.',
  });

  for (let i = s.length; i >= 0; i--) {
    for (let j = p.length - 1; j >= 0; j--) {
      const first = i < s.length && (p[j] === s[i] || p[j] === '.');
      yield t.compare(7, {
        target: pArr,
        i: j,
        vars: { i, j },
        note:
          i === s.length
            ? `s is exhausted, so pattern '${p[j]}' has nothing left to match.`
            : `Pattern '${p[j]}' against '${s[i]}' — ${first ? 'a match' : 'no match'}.`,
      });

      if (p[j + 1] === '*') {
        const skip = dp.value(i, j + 2) === 'T';
        const repeat = first && dp.value(i + 1, j) === 'T';
        yield t.compare(8, {
          target: dp,
          i: dp.at(i, j + 2),
          j: first ? dp.at(i + 1, j) : undefined,
          note: `'${p[j]}*' can be dropped entirely (${skip ? 'works' : 'fails'})${
            first ? ` or consume '${s[i]}' and stay on the same pattern (${repeat ? 'works' : 'fails'})` : ''
          }.`,
        });
        yield t.writeCell(8, dp, i, j, skip || repeat ? 'T' : 'F', {
          note: skip
            ? `Using '${p[j]}*' zero times already matches, so this cell is true.`
            : repeat
              ? `Letting '${p[j]}*' swallow '${s[i]}' matches, so this cell is true.`
              : `Neither zero repeats nor one more repeat works — this cell is false.`,
        });
        continue;
      }

      const rest = first && dp.value(i + 1, j + 1) === 'T';
      yield t.writeCell(9, dp, i, j, rest ? 'T' : 'F', {
        note: first
          ? `'${p[j]}' takes '${s[i]}', so this cell copies the diagonal: ${rest ? 'true' : 'false'}.`
          : 'The first character already fails, so nothing after it matters — false.',
      });
    }
  }

  const result = dp.value(0, 0) === 'T';
  yield t.settle(12, dp, [dp.at(0, 0)], {
    vars: { i: undefined, j: undefined, result },
    note: `"${p}" ${result ? 'matches' : 'does not match'} "${s}".`,
  });
}

export const regexMatching: AlgorithmDef = {
  id: 'regular-expression-matching',
  name: 'Regular Expression Matching',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'aab' },
    { key: 'p', label: 'pattern', kind: 'text', placeholder: 'c*a*b' },
  ],
  defaultInput: { s: 'aab', p: 'c*a*b' },
  run,
};
