import { Tracer, mapToRecord } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const target = input.target as number;

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');
  t.setVars({ target });

  yield t.note(1, { note: `Find two indices whose values sum to ${target}.` });

  const seen = new Map<number, number>();
  yield t.note(2, { note: 'seen maps value → index of everything visited.', vars: { seen: {} } });

  for (let i = 0; i < a.length; i++) {
    yield t.read(3, { i, vars: { i }, note: `Visit index ${i}.` });

    const need = target - a.num(i);
    yield t.read(4, {
      i,
      vars: { need },
      note: `nums[${i}] = ${a.num(i)}, so we need ${need}.`,
    });

    if (seen.has(need)) {
      const j = seen.get(need)!;
      yield t.compare(5, {
        i,
        j,
        vars: { j },
        note: `${need} is in seen, at index ${j}.`,
      });
      yield t.found(6, {
        i,
        j,
        vars: { answer: [j, i] },
        note: `nums[${j}] + nums[${i}] = ${a.num(j)} + ${a.num(i)} = ${target}.`,
      });
      return;
    }

    yield t.compare(5, { i, note: `${need} is not in seen yet.` });

    seen.set(a.num(i), i);
    yield t.note(8, {
      i,
      vars: { seen: mapToRecord(seen as Map<number, number>) },
      note: `Remember ${a.num(i)} → ${i}.`,
    });
  }

  yield t.note(10, { vars: { answer: [], i: undefined, j: undefined, need: undefined }, note: 'No pair sums to the target.' });
}

export const twoSum: AlgorithmDef = {
  id: 'two-sum',
  name: 'Two Sum',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '2, 7, 11, 15' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '9' },
  ],
  defaultInput: { nums: [2, 7, 11, 15], target: 9 },
  run,
};
