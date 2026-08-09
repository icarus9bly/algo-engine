import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function removeDuplicates(nums) {
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[read - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums (sorted)', ['read', 'write']);

  yield t.note(1, {
    note: 'One cursor reads ahead, the other marks where the next kept value belongs.',
  });

  if (a.length === 0) {
    yield t.note(9, { vars: { result: 0 }, note: 'Empty array.' });
    return;
  }

  let write = 1;
  yield t.note(2, { i: 0, vars: { write }, note: 'The first value is always kept.' });

  for (let read = 1; read < a.length; read++) {
    const isNew = a.num(read) !== a.num(read - 1);
    yield t.compare(4, {
      i: read,
      j: read - 1,
      vars: { read },
      note: isNew
        ? `${a.num(read)} differs from ${a.num(read - 1)} — keep it.`
        : `${a.num(read)} repeats the previous value — skip it.`,
    });

    if (isNew) {
      yield t.write(5, a, write, a.num(read), {
        note: `Copy ${a.num(read)} into slot ${write}.`,
      });
      write++;
      yield t.note(6, { vars: { write }, note: `${write} unique value${write === 1 ? '' : 's'} so far.` });
    }
  }

  yield t.settle(9, a, Array.from({ length: write }, (_, d) => d), {
    vars: { read: undefined, result: write },
    note: `The first ${write} slot${write === 1 ? '' : 's'} hold the unique values; the tail is left as scratch.`,
  });
}

export const removeDuplicatesSorted: AlgorithmDef = {
  id: 'remove-duplicates-sorted',
  name: 'Remove Duplicates From Sorted Array',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '0,0,1,1,1,2,2,3,3,4' },
  ],
  defaultInput: { nums: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4] },
  run,
};
