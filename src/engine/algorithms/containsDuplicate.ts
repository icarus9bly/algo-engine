import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function containsDuplicate(nums) {
  const seen = new Set();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(nums[i])) {
      return true;
    }
    seen.add(nums[i]);
  }
  return false;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');

  yield t.note(1, { note: 'Does any value appear twice?' });

  const seen = new Set<number>();
  // Display-only: lets us point at *both* copies when a duplicate turns up.
  const firstIndex = new Map<number, number>();
  yield t.note(2, { vars: { seen: [] }, note: 'seen holds every value visited so far.' });

  for (let i = 0; i < a.length; i++) {
    yield t.read(3, { i, vars: { i }, note: `Visit nums[${i}] = ${a.num(i)}.` });

    const duplicate = seen.has(a.num(i));
    yield t.compare(4, {
      i,
      note: duplicate ? `${a.num(i)} is already in seen.` : `${a.num(i)} is new.`,
    });

    if (duplicate) {
      const j = firstIndex.get(a.num(i))!;
      yield t.found(5, {
        i,
        j,
        vars: { j, result: true },
        note: `${a.num(i)} already appeared at index ${j}.`,
      });
      return;
    }

    seen.add(a.num(i));
    firstIndex.set(a.num(i), i);
    yield t.note(7, {
      i,
      vars: { seen: [...seen] },
      note: `Add ${a.num(i)} to seen.`,
    });
  }

  yield t.note(9, {
    vars: { i: undefined, result: false },
    note: 'Every value was distinct.',
  });
}

export const containsDuplicate: AlgorithmDef = {
  id: 'contains-duplicate',
  name: 'Contains Duplicate',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 2, 3, 1' },
  ],
  defaultInput: { nums: [1, 2, 3, 1] },
  run,
};
