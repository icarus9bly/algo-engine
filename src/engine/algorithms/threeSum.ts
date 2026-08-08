import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const sum = nums[i] + nums[l] + nums[r];
      if (sum < 0) l++;
      else if (sum > 0) r--;
      else {
        res.push([nums[i], nums[l], nums[r]]);
        while (l < r && nums[l] === nums[l + 1]) l++;
        l++;
        r--;
      }
    }
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums');

  yield t.note(1, { note: 'Find every distinct triple that sums to zero.' });

  // Sorting is a single visual jump: what matters is that duplicates end up
  // adjacent and the array becomes monotonic, which is what lets two pointers
  // work at all.
  const sorted = [...a.values].sort((x, y) => (x as number) - (y as number));
  for (let k = 0; k < sorted.length; k++) a.set(k, sorted[k]);
  yield t.note(2, {
    note: 'Sort first — duplicates become adjacent and the array is monotonic.',
  });

  const res: string[] = [];
  yield t.note(3, { vars: { res: [] }, note: 'No triples found yet.' });

  for (let i = 0; i < a.length - 2; i++) {
    yield t.read(4, { i, vars: { i, l: undefined, r: undefined, sum: undefined }, note: `Anchor at nums[${i}] = ${a.num(i)}.` });

    if (i > 0 && a.num(i) === a.num(i - 1)) {
      yield t.compare(5, {
        i,
        j: i - 1,
        note: `nums[${i}] repeats nums[${i - 1}] — skip it or we'd emit the same triple twice.`,
      });
      continue;
    }

    let l = i + 1;
    let r = a.length - 1;
    yield t.note(6, {
      indices: [i, l, r],
      vars: { l, r },
      note: 'Two pointers sweep the rest of the array.',
    });

    while (l < r) {
      const sum = a.num(i) + a.num(l) + a.num(r);
      yield t.compare(8, {
        indices: [i, l, r],
        vars: { sum },
        note: `${a.num(i)} + ${a.num(l)} + ${a.num(r)} = ${sum}.`,
      });

      if (sum < 0) {
        l++;
        yield t.note(9, { vars: { l }, note: 'Too small — move the left pointer up to gain value.' });
      } else if (sum > 0) {
        r--;
        yield t.note(10, { vars: { r }, note: 'Too big — move the right pointer down to lose value.' });
      } else {
        res.push(`(${a.num(i)}, ${a.num(l)}, ${a.num(r)})`);
        yield t.found(12, {
          indices: [i, l, r],
          vars: { res: [...res] },
          note: `Triple found: ${res[res.length - 1]}.`,
        });

        while (l < r && a.num(l) === a.num(l + 1)) {
          yield t.read(13, {
            i: l,
            j: l + 1,
            vars: { l },
            note: `nums[${l + 1}] repeats nums[${l}] — skip past the duplicate.`,
          });
          l++;
        }

        l++;
        r--;
        yield t.note(14, { vars: { l, r }, note: 'Close in from both sides.' });
      }
    }
  }

  yield t.note(19, {
    vars: { i: undefined, l: undefined, r: undefined, sum: undefined, res: [...res] },
    note: res.length === 0 ? 'No triple sums to zero.' : `${res.length} triple${res.length === 1 ? '' : 's'} found.`,
  });
}

export const threeSum: AlgorithmDef = {
  id: 'three-sum',
  name: '3Sum',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '-1, 0, 1, 2, -1, -4' },
  ],
  defaultInput: { nums: [-1, 0, 1, 2, -1, -4] },
  run,
};
