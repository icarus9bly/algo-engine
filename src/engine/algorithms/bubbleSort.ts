import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function bubbleSort(nums) {
  for (let end = nums.length - 1; end > 0; end--) {
    let swapped = false;
    for (let j = 0; j < end; j++) {
      if (nums[j] > nums[j + 1]) {
        [nums[j], nums[j + 1]] = [nums[j + 1], nums[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return nums;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');

  yield t.note(1, { note: 'Bubble the largest remaining value to the end of each pass.' });

  for (let end = a.length - 1; end > 0; end--) {
    yield t.note(2, { vars: { end }, note: `Pass over 0..${end}.` });

    let swapped = false;
    yield t.note(3, {
      vars: { swapped },
      note: 'Track whether this pass changes anything — if not, the array is already sorted.',
    });

    for (let j = 0; j < end; j++) {
      yield t.compare(5, {
        i: j,
        j: j + 1,
        vars: { j },
        note: `${a.num(j)} > ${a.num(j + 1)} ? ${a.num(j) > a.num(j + 1) ? 'yes' : 'no'}`,
      });

      if (a.num(j) > a.num(j + 1)) {
        yield t.swap(6, a, j, j + 1, { note: `Swap ${a.num(j)} and ${a.num(j + 1)}.` });
        swapped = true;
        yield t.note(7, {
          i: j,
          j: j + 1,
          vars: { swapped },
          note: 'This pass has changed something, so another one is needed.',
        });
      }
    }

    yield t.settle(9, a, [end], { note: `nums[${end}] = ${a.num(end)} is now final.` });

    if (!swapped) {
      const rest = Array.from({ length: end }, (_, k) => k);
      yield t.settle(10, a, rest, {
        note: 'A pass with no swaps means the rest is already sorted — stop early.',
      });
      break;
    }
  }

  if (a.length > 0) {
    yield t.settle(12, a, [0], {
      vars: { j: undefined, end: undefined, swapped: undefined },
      note: 'With everything above it final, position 0 is final too.',
    });
  }
  yield t.note(12, { note: 'Sorted.' });
}

export const bubbleSort: AlgorithmDef = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  category: 'Sorting',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '5, 1, 4, 2, 8' },
  ],
  defaultInput: { nums: [5, 1, 4, 2, 8, 3] },
  run,
};
