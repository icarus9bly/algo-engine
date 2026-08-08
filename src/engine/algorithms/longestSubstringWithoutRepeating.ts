import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    while (seen.has(s[r])) {
      seen.delete(s[l]);
      l++;
    }
    seen.add(s[r]);
    best = Math.max(best, r - l + 1);
  }
  return best;
}`;

function window(l: number, r: number): number[] {
  return Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  const a = t.array('s', [...s], 's');

  yield t.note(1, { note: 'Grow a window on the right, shrink it from the left when a repeat appears.' });

  const seen = new Set<string>();
  let l = 0;
  let best = 0;
  yield t.note(3, { vars: { l, best, seen: [] } });

  for (let r = 0; r < a.length; r++) {
    const ch = a.at(r) as string;
    yield t.read(4, { i: r, vars: { r }, note: `Try to extend the window with '${ch}'.` });

    while (seen.has(ch)) {
      const gone = a.at(l) as string;
      seen.delete(gone);
      yield t.compare(6, {
        i: l,
        j: r,
        vars: { seen: [...seen] },
        note: `'${ch}' is already inside — drop '${gone}' from the left.`,
      });
      l++;
      yield t.note(7, { indices: window(l, r), vars: { l } });
    }

    seen.add(ch);
    yield t.note(9, {
      indices: window(l, r),
      vars: { seen: [...seen] },
      note: `Window is now ${l}..${r}.`,
    });

    const length = r - l + 1;
    if (length > best) {
      best = length;
      yield t.found(10, {
        indices: window(l, r),
        vars: { best },
        note: `Longest so far: "${a.values.slice(l, r + 1).join('')}" (${best}).`,
      });
    } else {
      yield t.note(10, { indices: window(l, r), vars: { best }, note: `Length ${length} does not beat ${best}.` });
    }
  }

  yield t.note(12, {
    vars: { l: undefined, r: undefined, best },
    note: `Longest substring without repeats: ${best}.`,
  });
}

export const longestSubstringWithoutRepeating: AlgorithmDef = {
  id: 'longest-substring-without-repeating',
  name: 'Longest Substring Without Repeating Characters',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'abcabcbb' },
  ],
  defaultInput: { s: 'abcabcbb' },
  run,
};
