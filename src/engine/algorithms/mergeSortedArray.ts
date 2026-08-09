import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[k--] = nums1[i--];
    } else {
      nums1[k--] = nums2[j--];
    }
  }
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const first = input.nums1 as number[];
  const second = input.nums2 as number[];

  const t = new Tracer();
  // nums1 carries n trailing slots, exactly as the problem hands it over.
  const a = t.array(
    'nums1',
    [...first, ...new Array(second.length).fill(0)],
    'nums1 (with room at the end)',
    ['i', 'k'],
  );
  const b = t.array('nums2', second, 'nums2', ['j']);
  const m = first.length;
  const n = second.length;

  yield t.note(1, {
    note: 'Filling from the back means never overwriting a value of nums1 that has not been placed yet.',
  });

  let i = m - 1;
  let j = n - 1;
  let k = m + n - 1;
  yield t.note(2, { vars: { i, j, k }, note: 'Three cursors, all starting at the back.' });

  while (j >= 0) {
    const takeFirst = i >= 0 && a.num(i) > b.num(j);
    yield t.compare(4, {
      i: i >= 0 ? i : undefined,
      j: undefined,
      vars: { i, j, k },
      note: i < 0
        ? 'nums1 is exhausted, so the rest of nums2 drops straight in.'
        : `${a.num(i)} vs ${b.num(j)} — the larger goes at position ${k}.`,
    });

    if (takeFirst) {
      yield t.write(5, a, k, a.num(i), { note: `Move ${a.num(i)} back to slot ${k}.` });
      i--;
    } else {
      yield t.write(7, a, k, b.num(j), { note: `Place ${b.num(j)} from nums2 at slot ${k}.` });
      j--;
    }
    k--;
    yield t.note(8, { vars: { i, j, k }, note: 'Step the cursors back.' });
  }

  yield t.settle(10, a, a.values.map((_, d) => d), {
    vars: { i: undefined, j: undefined, k: undefined, result: a.values.join(',') },
    note: `Merged in place: ${a.values.join(', ')}.`,
  });
}

export const mergeSortedArray: AlgorithmDef = {
  id: 'merge-sorted-array',
  name: 'Merge Sorted Array',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'nums1', label: 'nums1', kind: 'numbers', placeholder: '1, 2, 3' },
    { key: 'nums2', label: 'nums2', kind: 'numbers', placeholder: '2, 5, 6' },
  ],
  defaultInput: { nums1: [1, 2, 3], nums2: [2, 5, 6] },
  run,
};
