import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function findMin(nums) {
  let l = 0, r = nums.length - 1;
  while (l < r) {
    const mid = Math.floor((l + r) / 2);
    if (nums[mid] > nums[r]) {
      l = mid + 1;
    } else {
      r = mid;
    }
  }
  return nums[l];
}`;

function span(l: number, r: number): number[] {
  return Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');

  yield t.note(1, {
    note: 'The array is sorted then rotated, so the minimum is the one place order breaks.',
  });

  if (a.length === 0) {
    yield t.note(11, { note: 'Empty array — nothing to find.' });
    return;
  }

  let l = 0;
  let r = a.length - 1;
  yield t.note(2, { indices: span(l, r), vars: { l, r } });

  while (l < r) {
    const mid = Math.floor((l + r) / 2);
    yield t.compare(5, {
      i: mid,
      j: r,
      vars: { mid },
      note: `nums[${mid}] = ${a.num(mid)} vs nums[${r}] = ${a.num(r)}.`,
    });

    if (a.num(mid) > a.num(r)) {
      l = mid + 1;
      yield t.note(6, {
        indices: span(l, r),
        vars: { l },
        note: 'Left half is in order, so the break must be to the right of mid.',
      });
    } else {
      r = mid;
      yield t.note(8, {
        indices: span(l, r),
        vars: { r },
        note: 'mid is no bigger than the right end, so the minimum is at mid or left of it.',
      });
    }
  }

  yield t.found(11, {
    i: l,
    vars: { mid: undefined, result: a.num(l) },
    note: `The pointers met at the minimum: ${a.num(l)}.`,
  });
}

export const findMinRotated: AlgorithmDef = {
  id: 'find-min-rotated',
  name: 'Find Minimum In Rotated Sorted Array',
  category: 'Binary Search',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '4, 5, 6, 7, 0, 1, 2' },
  ],
  defaultInput: { nums: [4, 5, 6, 7, 0, 1, 2] },
  run,
};
