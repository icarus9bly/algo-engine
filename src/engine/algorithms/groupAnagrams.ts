import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef, VarValue } from '../types';

const code = `function groupAnagrams(strs) {
  const groups = new Map();
  for (let i = 0; i < strs.length; i++) {
    const key = [...strs[i]].sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(strs[i]);
  }
  return [...groups.values()];
}`;

function snapshotGroups(groups: Map<string, string[]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, words] of groups) out[key] = words.join(' ');
  return out;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const strs = (input.strs as string[]) ?? [];

  const t = new Tracer();
  const a = t.array('strs', [...strs], 'strs');

  yield t.note(1, { note: 'Bucket words that are rearrangements of each other.' });

  const groups = new Map<string, string[]>();
  yield t.note(2, { vars: { groups: {} }, note: 'groups maps a sorted-letter key → its words.' });

  for (let i = 0; i < a.length; i++) {
    const word = a.at(i) as string;
    yield t.read(3, { i, vars: { i }, note: `Take strs[${i}] = "${word}".` });

    const key = [...word].sort().join('');
    yield t.note(4, {
      i,
      vars: { key },
      note: `Sorting its letters gives "${key}" — the same key for every anagram of it.`,
    });

    const isNew = !groups.has(key);
    if (isNew) groups.set(key, []);
    yield t.compare(5, {
      i,
      vars: { groups: snapshotGroups(groups) },
      note: isNew ? `"${key}" is a new bucket.` : `"${key}" already has a bucket.`,
    });

    groups.get(key)!.push(word);
    yield t.note(6, {
      i,
      vars: { groups: snapshotGroups(groups) },
      note: `Drop "${word}" into "${key}".`,
    });
  }

  const result: VarValue = [...groups.values()].map((w) => `[${w.join(', ')}]`);
  yield t.found(8, {
    indices: a.values.map((_, k) => k),
    vars: { i: undefined, key: undefined, result },
    note: `${groups.size} group${groups.size === 1 ? '' : 's'}.`,
  });
}

export const groupAnagrams: AlgorithmDef = {
  id: 'group-anagrams',
  name: 'Group Anagrams',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 'strs', label: 'strs', kind: 'words', placeholder: 'eat, tea, tan, ate, nat, bat' },
  ],
  defaultInput: { strs: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'] },
  run,
};
