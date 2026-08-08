import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function search(nums, target) {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const mid = Math.floor((l + r) / 2);
    if (nums[mid] === target) return mid;
    if (nums[l] <= nums[mid]) {
      if (target >= nums[l] && target < nums[mid]) r = mid - 1;
      else l = mid + 1;
    } else {
      if (target > nums[mid] && target <= nums[r]) l = mid + 1;
      else r = mid - 1;
    }
  }
  return -1;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const target = input.target as number;

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');
  t.setVars({ target });

  yield t.note(1, {
    note: 'One half of a rotated array is always properly sorted — decide which, then discard half.',
  });

  let l = 0;
  let r = a.length - 1;
  yield t.note(2, { indices: span(l, r), vars: { l, r } });

  while (l <= r) {
    const mid = Math.floor((l + r) / 2);
    yield t.read(4, { i: mid, vars: { mid }, note: `Look at nums[${mid}] = ${a.num(mid)}.` });

    if (a.num(mid) === target) {
      yield t.found(5, { i: mid, vars: { result: mid }, note: `Found ${target} at index ${mid}.` });
      return;
    }

    if (a.num(l) <= a.num(mid)) {
      yield t.compare(6, {
        i: l,
        j: mid,
        note: `nums[${l}] ≤ nums[${mid}], so the left half is the sorted one.`,
      });

      if (target >= a.num(l) && target < a.num(mid)) {
        r = mid - 1;
        yield t.note(7, { indices: span(l, r), vars: { r }, note: `${target} falls inside the sorted left half.` });
      } else {
        l = mid + 1;
        yield t.note(8, { indices: span(l, r), vars: { l }, note: `${target} is not in the sorted left half.` });
      }
    } else {
      yield t.compare(9, {
        i: mid,
        j: r,
        note: `nums[${l}] > nums[${mid}], so the right half is the sorted one.`,
      });

      if (target > a.num(mid) && target <= a.num(r)) {
        l = mid + 1;
        yield t.note(10, { indices: span(l, r), vars: { l }, note: `${target} falls inside the sorted right half.` });
      } else {
        r = mid - 1;
        yield t.note(11, { indices: span(l, r), vars: { r }, note: `${target} is not in the sorted right half.` });
      }
    }
  }

  yield t.note(14, {
    vars: { l: undefined, r: undefined, mid: undefined, result: -1 },
    note: `${target} is not in the array.`,
  });
}

export const searchRotated: AlgorithmDef = {
  id: 'search-rotated',
  name: 'Search In Rotated Sorted Array',
  category: 'Binary Search',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '4, 5, 6, 7, 0, 1, 2' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '0' },
  ],
  defaultInput: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 },
  run,
};
