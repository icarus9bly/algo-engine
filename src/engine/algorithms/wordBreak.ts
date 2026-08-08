import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function wordBreak(s, words) {
  const dp = new Array(s.length + 1).fill(false);
  dp[s.length] = true;
  for (let i = s.length - 1; i >= 0; i--) {
    for (const w of words) {
      if (s.startsWith(w, i) && dp[i + w.length]) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const words = (input.words as string[]) ?? [];

  const t = new Tracer();
  t.array('s', [...s], 's', ['i']);
  const dict = t.array('words', [...words], 'dictionary', []);
  const dp = t.array('dp', new Array(s.length + 1).fill('F'), 'dp — is the tail from i breakable?', ['i']);

  yield t.note(1, { note: 'Work backwards: a position is breakable if some word starts there and the rest is breakable.' });
  yield t.write(3, dp, s.length, 'T', { note: 'The empty tail is trivially breakable.' });

  for (let i = s.length - 1; i >= 0; i--) {
    yield t.read(4, { i, vars: { i }, note: `Can the tail starting at ${i} be broken up?` });

    for (let w = 0; w < dict.length; w++) {
      const word = String(dict.at(w));
      const fits = s.startsWith(word, i);
      const restOk = fits && dp.at(i + word.length) === 'T';

      yield t.compare(6, {
        target: dict,
        i: w,
        vars: { word },
        note: !fits
          ? `"${word}" does not appear at index ${i}.`
          : restOk
            ? `"${word}" fits and the remainder is breakable.`
            : `"${word}" fits, but the remainder is not breakable.`,
      });

      if (restOk) {
        yield t.write(7, dp, i, 'T', { note: `Index ${i} is breakable via "${word}".` });
        break;
      }
    }
  }

  const ok = dp.at(0) === 'T';
  yield t.settle(12, dp, [0], {
    vars: { i: undefined, word: undefined, result: ok },
    note: ok ? `"${s}" can be segmented.` : `"${s}" cannot be segmented.`,
  });
}

export const wordBreak: AlgorithmDef = {
  id: 'word-break',
  name: 'Word Break',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'leetcode' },
    { key: 'words', label: 'words', kind: 'words', placeholder: 'leet, code' },
  ],
  defaultInput: { s: 'leetcode', words: ['leet', 'code'] },
  run,
};
