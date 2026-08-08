import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const count = {};
  for (const ch of s) count[ch] = (count[ch] ?? 0) + 1;
  for (const ch of t) {
    if (!count[ch]) return false;
    count[ch]--;
  }
  return true;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const s = String(input.s ?? '');
  const tText = String(input.t ?? '');

  const tr = new Tracer();
  const sArr = tr.array('s', [...s], 's', ['i']);
  const tArr = tr.array('t', [...tText], 't', ['i']);

  yield tr.note(1, { note: 'Is t a rearrangement of s?' });

  if (sArr.length !== tArr.length) {
    yield tr.note(2, {
      vars: { result: false },
      note: `Lengths differ (${sArr.length} vs ${tArr.length}) — cannot be an anagram.`,
    });
    return;
  }

  const count: Record<string, number> = {};
  yield tr.note(3, { vars: { count: {} }, note: 'count tallies each letter of s.' });

  for (let i = 0; i < sArr.length; i++) {
    const ch = sArr.at(i) as string;
    count[ch] = (count[ch] ?? 0) + 1;
    yield tr.read(4, {
      target: sArr,
      i,
      vars: { i, count: { ...count } },
      note: `s[${i}] = '${ch}' → count is now ${count[ch]}.`,
    });
  }

  for (let i = 0; i < tArr.length; i++) {
    const ch = tArr.at(i) as string;
    yield tr.read(5, {
      target: tArr,
      i,
      vars: { i },
      note: `t[${i}] = '${ch}'.`,
    });

    if (!count[ch]) {
      yield tr.compare(6, {
        target: tArr,
        i,
        vars: { result: false },
        note: `No '${ch}' left in count — t has a letter s doesn't.`,
      });
      return;
    }

    count[ch]--;
    yield tr.note(7, {
      target: tArr,
      i,
      vars: { count: { ...count } },
      note: `Spend one '${ch}'. ${count[ch]} left.`,
    });
  }

  yield tr.found(9, {
    target: tArr,
    indices: tArr.values.map((_, k) => k),
    vars: { i: undefined, result: true },
    note: 'Every letter in t was covered by s — anagram.',
  });
}

export const validAnagram: AlgorithmDef = {
  id: 'valid-anagram',
  name: 'Valid Anagram',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 's', label: 's', kind: 'text', placeholder: 'anagram' },
    { key: 't', label: 't', kind: 'text', placeholder: 'nagaram' },
  ],
  defaultInput: { s: 'anagram', t: 'nagaram' },
  run,
};
