import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function checkInclusion(s1, s2) {
  if (s1.length > s2.length) return false;
  const need = count(s1), window = {};
  for (let r = 0; r < s2.length; r++) {
    window[s2[r]] = (window[s2[r]] ?? 0) + 1;
    if (r >= s1.length) {
      const gone = s2[r - s1.length];
      window[gone]--;
      if (window[gone] === 0) delete window[gone];
    }
    if (same(window, need)) return true;
  }
  return false;
}`;

function tally(s: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const ch of s) out[ch] = (out[ch] ?? 0) + 1;
  return out;
}

function same(a: Record<string, number>, b: Record<string, number>): boolean {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s1 = String(input.s1 ?? '');
  const s2 = String(input.s2 ?? '');

  const t = new Tracer();
  t.array('s1', [...s1], 's1 (the pattern)', []);
  const b = t.array('s2', [...s2], 's2', ['r']);

  yield t.note(1, {
    note: 'A permutation is just a matching letter tally, so slide a fixed-width window and compare counts.',
  });

  if (s1.length > s2.length) {
    yield t.note(2, { vars: { result: false }, note: 'The pattern is longer than the text.' });
    return;
  }

  const need = tally(s1);
  const win: Record<string, number> = {};
  yield t.note(3, { vars: { need: { ...need }, window: {} }, note: `The window must hold exactly these ${s1.length} letters.` });

  for (let r = 0; r < b.length; r++) {
    const ch = b.at(r) as string;
    win[ch] = (win[ch] ?? 0) + 1;
    yield t.read(5, { target: b, i: r, vars: { r, window: { ...win } }, note: `Take in '${ch}'.` });

    if (r >= s1.length) {
      const gone = b.at(r - s1.length) as string;
      win[gone]--;
      if (win[gone] === 0) delete win[gone];
      yield t.note(8, {
        target: b,
        i: r - s1.length,
        vars: { window: { ...win } },
        note: `The window is full, so '${gone}' drops off the back.`,
      });
    }

    const l = Math.max(0, r - s1.length + 1);
    const matched = same(win, need);
    yield t.compare(11, {
      target: b,
      indices: span(l, r),
      note: matched
        ? 'The tallies match exactly.'
        : 'The tallies still differ.',
    });

    if (matched) {
      yield t.found(11, {
        target: b,
        indices: span(l, r),
        vars: { result: true },
        note: `"${b.values.slice(l, r + 1).join('')}" is a permutation of "${s1}".`,
      });
      return;
    }
  }

  yield t.note(13, {
    vars: { r: undefined, result: false },
    note: `No window of s2 is a permutation of "${s1}".`,
  });
}

export const permutationInString: AlgorithmDef = {
  id: 'permutation-in-string',
  name: 'Permutation In String',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 's1', label: 's1', kind: 'text', placeholder: 'ab' },
    { key: 's2', label: 's2', kind: 'text', placeholder: 'eidbaooo' },
  ],
  defaultInput: { s1: 'ab', s2: 'eidbaooo' },
  run,
};
