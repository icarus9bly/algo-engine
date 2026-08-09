import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function mergeAlternately(word1, word2) {
  let res = '', i = 0, j = 0;
  while (i < word1.length || j < word2.length) {
    if (i < word1.length) res += word1[i++];
    if (j < word2.length) res += word2[j++];
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const w1 = String(input.word1 ?? '');
  const w2 = String(input.word2 ?? '');

  const t = new Tracer();
  const a = t.array('word1', [...w1], 'word1', ['i']);
  const b = t.array('word2', [...w2], 'word2', ['j']);
  const out = t.array('res', [], 'res', []);

  yield t.note(1, {
    note: 'Take one character from each in turn; when one runs out, the other just finishes.',
  });

  let i = 0;
  let j = 0;
  yield t.note(2, { target: out, vars: { i, j }, note: 'Both cursors start at the front.' });

  while (i < a.length || j < b.length) {
    if (i < a.length) {
      yield t.read(4, { target: a, i, vars: { i }, note: `Take '${a.at(i)}' from word1.` });
      yield t.push(4, out, a.at(i), { note: `res is now "${[...out.values, a.at(i)].join('')}".` });
      i++;
    } else {
      yield t.note(4, { target: a, note: 'word1 is exhausted.' });
    }

    if (j < b.length) {
      yield t.read(5, { target: b, i: j, vars: { j }, note: `Take '${b.at(j)}' from word2.` });
      yield t.push(5, out, b.at(j), { note: `res is now "${[...out.values, b.at(j)].join('')}".` });
      j++;
    } else {
      yield t.note(5, { target: b, note: 'word2 is exhausted.' });
    }
  }

  yield t.settle(7, out, out.values.map((_, d) => d), {
    vars: { i: undefined, j: undefined, result: out.values.join('') },
    note: `Merged: "${out.values.join('')}".`,
  });
}

export const mergeStringsAlternately: AlgorithmDef = {
  id: 'merge-strings-alternately',
  name: 'Merge Strings Alternately',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'word1', label: 'word1', kind: 'text', placeholder: 'abc' },
    { key: 'word2', label: 'word2', kind: 'text', placeholder: 'pqrs' },
  ],
  defaultInput: { word1: 'abc', word2: 'pqrs' },
  run,
};
