import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function numDecodings(s) {
  const dp = new Array(s.length + 1).fill(0);
  dp[s.length] = 1;
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] === '0') continue;
    dp[i] = dp[i + 1];
    const two = Number(s.slice(i, i + 2));
    if (i + 1 < s.length && two >= 10 && two <= 26) {
      dp[i] += dp[i + 2];
    }
  }
  return dp[0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  if (!/^[0-9]*$/.test(s)) throw new Error('s must contain digits only.');

  const t = new Tracer();
  const a = t.array('s', [...s], 's', ['i']);
  const dp = t.array('dp', new Array(s.length + 1).fill(0), 'dp — decodings from index i on', ['i']);

  yield t.note(1, { note: "'A'–'Z' map to 1–26, so each position takes one digit or two." });
  yield t.write(3, dp, s.length, 1, {
    note: 'One way to decode the empty tail: stop.',
  });

  for (let i = s.length - 1; i >= 0; i--) {
    yield t.read(4, { i, vars: { i }, note: `Decode starting at index ${i}.` });

    if (a.at(i) === '0') {
      yield t.compare(5, {
        i,
        note: "No letter maps to 0, so nothing can start here — dp stays 0.",
      });
      continue;
    }

    yield t.write(6, dp, i, dp.num(i + 1), {
      note: `Taking '${a.at(i)}' alone leaves dp[${i + 1}] = ${dp.num(i + 1)} ways.`,
    });

    const two = Number(s.slice(i, i + 2));
    if (i + 1 < s.length) {
      const valid = two >= 10 && two <= 26;
      yield t.compare(7, {
        i,
        j: i + 1,
        vars: { two },
        note: valid
          ? `"${two}" is a letter too, so both splits are legal.`
          : `"${two}" is outside 10–26, so the two-digit split is not a letter.`,
      });

      if (valid) {
        yield t.write(9, dp, i, dp.num(i) + dp.num(i + 2), {
          note: `Add the dp[${i + 2}] = ${dp.num(i + 2)} ways that follow the pair.`,
        });
      }
    }
  }

  const result = dp.num(0);
  yield t.settle(12, dp, [0], {
    vars: { i: undefined, two: undefined, result },
    note: `${result} way${result === 1 ? '' : 's'} to decode "${s}".`,
  });
}

export const decodeWays: AlgorithmDef = {
  id: 'decode-ways',
  name: 'Decode Ways',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [{ key: 's', label: 's', kind: 'text', placeholder: '226' }],
  defaultInput: { s: '226' },
  run,
};
