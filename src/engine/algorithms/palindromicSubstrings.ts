import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function countSubstrings(s) {
  let count = 0;
  for (let c = 0; c < s.length; c++) {
    for (const [a, b] of [[c, c], [c, c + 1]]) {
      let l = a, r = b;
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        count++;
        l--;
        r++;
      }
    }
  }
  return count;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  const a = t.array('s', [...s], 's', ['l', 'r', 'c']);

  yield t.note(1, { note: 'Count every palindromic substring by expanding from each centre.' });

  let count = 0;
  yield t.note(2, { vars: { count } });

  for (let c = 0; c < a.length; c++) {
    for (const [startL, startR] of [[c, c], [c, c + 1]] as [number, number][]) {
      if (startR >= a.length) continue;

      let l = startL;
      let r = startR;
      yield t.note(5, { indices: span(l, r), vars: { c, l, r } });

      while (l >= 0 && r < a.length && a.at(l) === a.at(r)) {
        count++;
        yield t.found(7, {
          indices: span(l, r),
          vars: { count },
          note: `"${a.values.slice(l, r + 1).join('')}" is a palindrome — count is ${count}.`,
        });
        l--;
        r++;
      }
    }
  }

  yield t.note(13, {
    vars: { c: undefined, l: undefined, r: undefined, count },
    note: `${count} palindromic substring${count === 1 ? '' : 's'}.`,
  });
}

export const palindromicSubstrings: AlgorithmDef = {
  id: 'palindromic-substrings',
  name: 'Palindromic Substrings',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [{ key: 's', label: 's', kind: 'text', placeholder: 'aaa' }],
  defaultInput: { s: 'aaa' },
  run,
};
