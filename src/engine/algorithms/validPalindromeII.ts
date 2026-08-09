import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function validPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) {
      return isPalindrome(s, l + 1, r)
          || isPalindrome(s, l, r - 1);
    }
    l++;
    r--;
  }
  return true;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* check(
  t: Tracer,
  a: TracedArray,
  lo: number,
  hi: number,
  which: string,
): Generator<AlgoEvent, boolean> {
  yield t.note(6, {
    indices: span(lo, hi),
    note: `Try ${which}: is "${a.values.slice(lo, hi + 1).join('')}" a palindrome?`,
  });

  let l = lo;
  let r = hi;
  while (l < r) {
    const same = a.at(l) === a.at(r);
    yield t.compare(6, {
      i: l,
      j: r,
      vars: { l, r },
      note: `'${a.at(l)}' vs '${a.at(r)}' — ${same ? 'match' : 'mismatch'}.`,
    });
    if (!same) return false;
    l++;
    r--;
  }
  return true;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  const a = t.array('s', [...s], 's', ['l', 'r']);

  yield t.note(1, { note: 'One character may be deleted, so the first mismatch gives exactly two things to try.' });

  let l = 0;
  let r = a.length - 1;
  yield t.note(2, { vars: { l, r }, note: 'Start from both ends.' });

  while (l < r) {
    const same = a.at(l) === a.at(r);
    yield t.compare(4, {
      i: l,
      j: r,
      vars: { l, r },
      note: `'${a.at(l)}' vs '${a.at(r)}' — ${same ? 'match' : 'mismatch'}.`,
    });

    if (!same) {
      yield t.note(5, {
        i: l,
        j: r,
        note: 'Delete one side or the other; nothing else can rescue it.',
      });

      const skipLeft = yield* check(t, a, l + 1, r, `dropping '${a.at(l)}'`);
      if (skipLeft) {
        yield t.found(5, {
          indices: span(l + 1, r),
          vars: { result: true },
          note: `Dropping '${a.at(l)}' leaves a palindrome.`,
        });
        return;
      }

      const skipRight = yield* check(t, a, l, r - 1, `dropping '${a.at(r)}'`);
      yield t.note(5, {
        indices: skipRight ? span(l, r - 1) : [],
        vars: { result: skipRight },
        note: skipRight
          ? `Dropping '${a.at(r)}' leaves a palindrome.`
          : 'Neither deletion works, so one removal is not enough.',
      });
      return;
    }

    l++;
    r--;
    yield t.note(8, { vars: { l, r }, note: 'Both sides match — step inward.' });
  }

  yield t.found(11, {
    indices: a.values.map((_, d) => d),
    vars: { l: undefined, r: undefined, result: true },
    note: 'Already a palindrome, with no deletion needed.',
  });
}

export const validPalindromeII: AlgorithmDef = {
  id: 'valid-palindrome-ii',
  name: 'Valid Palindrome II',
  category: 'Two Pointers',
  code,
  inputFields: [{ key: 's', label: 's', kind: 'text', placeholder: 'abca' }],
  defaultInput: { s: 'abca' },
  run,
};
