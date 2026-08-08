import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function longestPalindrome(s) {
  let best = '';
  for (let c = 0; c < s.length; c++) {
    for (const [a, b] of [[c, c], [c, c + 1]]) {
      let l = a, r = b;
      while (l >= 0 && r < s.length && s[l] === s[r]) {
        l--;
        r++;
      }
      const found = s.slice(l + 1, r);
      if (found.length > best.length) best = found;
    }
  }
  return best;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  const a = t.array('s', [...s], 's', ['l', 'r', 'c']);

  yield t.note(1, {
    note: 'Every palindrome grows out from a centre — try each character, and each gap between characters.',
  });

  let best = '';

  for (let c = 0; c < a.length; c++) {
    for (const [startL, startR, kind] of [
      [c, c, 'odd length, centred on one character'],
      [c, c + 1, 'even length, centred between two characters'],
    ] as [number, number, string][]) {
      if (startR >= a.length) continue;

      let l = startL;
      let r = startR;
      yield t.note(5, { indices: span(l, r), vars: { c, l, r }, note: `Centre at ${c} — ${kind}.` });

      while (l >= 0 && r < a.length && a.at(l) === a.at(r)) {
        yield t.compare(6, {
          i: l,
          j: r,
          vars: { l, r },
          note: `'${a.at(l)}' matches '${a.at(r)}' — expand.`,
        });
        l--;
        r++;
      }

      const found = a.values.slice(l + 1, r).join('');
      if (found.length > best.length) {
        best = found;
        yield t.found(12, {
          indices: span(l + 1, r - 1),
          vars: { best },
          note: `Longest so far: "${found}".`,
        });
      } else {
        yield t.note(12, {
          indices: span(l + 1, r - 1),
          vars: { best },
          note: `"${found}" does not beat "${best}".`,
        });
      }
    }
  }

  yield t.note(14, {
    vars: { c: undefined, l: undefined, r: undefined, best },
    note: `Longest palindromic substring: "${best}".`,
  });
}

export const longestPalindromicSubstring: AlgorithmDef = {
  id: 'longest-palindromic-substring',
  name: 'Longest Palindromic Substring',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [{ key: 's', label: 's', kind: 'text', placeholder: 'babad' }],
  defaultInput: { s: 'babad' },
  run,
};
