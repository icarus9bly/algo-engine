import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function isPalindrome(s) {
  let l = 0, r = s.length - 1;
  while (l < r) {
    while (l < r && !isAlnum(s[l])) l++;
    while (l < r && !isAlnum(s[r])) r--;
    if (lower(s[l]) !== lower(s[r])) return false;
    l++;
    r--;
  }
  return true;
}`;

const ALNUM = /[a-z0-9]/i;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');

  const t = new Tracer();
  const a = t.array('s', [...s], 's');

  yield t.note(1, { note: 'Read inward from both ends, ignoring anything that is not a letter or digit.' });

  let l = 0;
  let r = a.length - 1;
  yield t.note(2, { vars: { l, r }, note: 'Start one pointer at each end.' });

  while (l < r) {
    while (l < r && !ALNUM.test(a.at(l) as string)) {
      yield t.read(4, {
        i: l,
        vars: { l },
        note: `'${a.at(l)}' is not alphanumeric — skip it.`,
      });
      l++;
    }

    while (l < r && !ALNUM.test(a.at(r) as string)) {
      yield t.read(5, {
        i: r,
        vars: { r },
        note: `'${a.at(r)}' is not alphanumeric — skip it.`,
      });
      r--;
    }

    if (l >= r) break;

    const left = String(a.at(l)).toLowerCase();
    const right = String(a.at(r)).toLowerCase();
    const same = left === right;

    yield t.compare(6, {
      i: l,
      j: r,
      vars: { l, r },
      note: `'${left}' vs '${right}' — ${same ? 'match' : 'mismatch'}.`,
    });

    if (!same) {
      yield t.note(6, {
        i: l,
        j: r,
        vars: { result: false },
        note: 'A mismatched pair is enough to rule it out.',
      });
      return;
    }

    l++;
    r--;
    yield t.note(8, { vars: { l, r }, note: 'Step both pointers inward.' });
  }

  yield t.found(10, {
    indices: a.values.map((_, k) => k),
    vars: { result: true },
    note: 'The pointers met without a mismatch — palindrome.',
  });
}

export const validPalindrome: AlgorithmDef = {
  id: 'valid-palindrome',
  name: 'Valid Palindrome',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'A man, a plan, a canal: Panama' },
  ],
  defaultInput: { s: 'A man, a plan, a canal: Panama' },
  run,
};
