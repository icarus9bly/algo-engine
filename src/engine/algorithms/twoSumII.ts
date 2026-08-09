import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function twoSum(numbers, target) {
  let l = 0, r = numbers.length - 1;
  while (l < r) {
    const sum = numbers[l] + numbers[r];
    if (sum === target) return [l + 1, r + 1];
    if (sum < target) l++;
    else r--;
  }
  return [];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.numbers as number[];
  const target = input.target as number;

  const t = new Tracer();
  const a = t.array('numbers', nums, 'numbers (sorted)', ['l', 'r']);
  t.setVars({ target });

  yield t.note(1, {
    note: 'Because the array is sorted, the sum tells you which end to move — no hash map needed.',
  });

  let l = 0;
  let r = a.length - 1;
  yield t.note(2, { vars: { l, r }, note: 'Start at the widest pair.' });

  while (l < r) {
    const sum = a.num(l) + a.num(r);
    yield t.compare(4, {
      i: l,
      j: r,
      vars: { sum },
      note: `${a.num(l)} + ${a.num(r)} = ${sum}.`,
    });

    if (sum === target) {
      yield t.found(5, {
        i: l,
        j: r,
        vars: { result: [l + 1, r + 1] },
        note: `That is the target — the answer is 1-indexed, so [${l + 1}, ${r + 1}].`,
      });
      return;
    }

    if (sum < target) {
      l++;
      yield t.note(6, { vars: { l }, note: `${sum} is short of ${target}, so move left up for a bigger value.` });
    } else {
      r--;
      yield t.note(7, { vars: { r }, note: `${sum} overshoots ${target}, so move right down.` });
    }
  }

  yield t.note(9, {
    vars: { l: undefined, r: undefined, sum: undefined, result: [] },
    note: 'The pointers met without finding a pair.',
  });
}

export const twoSumII: AlgorithmDef = {
  id: 'two-sum-ii',
  name: 'Two Sum II Input Array Is Sorted',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'numbers', label: 'numbers', kind: 'numbers', placeholder: '2, 7, 11, 15' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '9' },
  ],
  defaultInput: { numbers: [2, 7, 11, 15], target: 9 },
  run,
};
