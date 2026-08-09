import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function fourSum(nums, target) {
  nums.sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < nums.length - 3; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    for (let j = i + 1; j < nums.length - 2; j++) {
      if (j > i + 1 && nums[j] === nums[j - 1]) continue;
      let l = j + 1, r = nums.length - 1;
      while (l < r) {
        const sum = nums[i] + nums[j] + nums[l] + nums[r];
        if (sum < target) l++;
        else if (sum > target) r--;
        else {
          res.push([nums[i], nums[j], nums[l], nums[r]]);
          while (l < r && nums[l] === nums[l + 1]) l++;
          l++;
          r--;
        }
      }
    }
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const target = input.target as number;
  if (nums.length > 14) throw new Error('Keep it to 14 values or fewer — this is O(n³).');

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['i', 'j', 'l', 'r']);
  t.setVars({ target });

  yield t.note(1, { note: 'Fix two values, then run the sorted two-pointer sweep on the rest.' });

  const sorted = [...a.values].sort((x, y) => (x as number) - (y as number));
  for (let k = 0; k < sorted.length; k++) a.set(k, sorted[k]);
  yield t.note(2, { note: 'Sort first, so duplicates sit together and the pointers can be steered.' });

  const res: string[] = [];
  yield t.note(3, { vars: { res: [] }, note: 'No quadruples yet.' });

  for (let i = 0; i < a.length - 3; i++) {
    if (i > 0 && a.num(i) === a.num(i - 1)) {
      yield t.compare(5, { i, j: i - 1, vars: { i }, note: `nums[${i}] repeats — skip to avoid duplicate answers.` });
      continue;
    }
    yield t.read(4, { i, vars: { i }, note: `First anchor: ${a.num(i)}.` });

    for (let j = i + 1; j < a.length - 2; j++) {
      if (j > i + 1 && a.num(j) === a.num(j - 1)) {
        yield t.compare(7, { i: j, j: j - 1, vars: { j }, note: `nums[${j}] repeats — skip.` });
        continue;
      }
      yield t.read(6, { i, j, vars: { j }, note: `Second anchor: ${a.num(j)}.` });

      let l = j + 1;
      let r = a.length - 1;
      yield t.note(8, { indices: [i, j, l, r], vars: { l, r }, note: 'Sweep the remainder with two pointers.' });

      while (l < r) {
        const sum = a.num(i) + a.num(j) + a.num(l) + a.num(r);
        yield t.compare(10, {
          indices: [i, j, l, r],
          vars: { sum },
          note: `${a.num(i)} + ${a.num(j)} + ${a.num(l)} + ${a.num(r)} = ${sum}.`,
        });

        if (sum < target) {
          l++;
          yield t.note(11, { vars: { l }, note: 'Too small — move the left pointer up.' });
        } else if (sum > target) {
          r--;
          yield t.note(12, { vars: { r }, note: 'Too big — move the right pointer down.' });
        } else {
          res.push(`(${a.num(i)}, ${a.num(j)}, ${a.num(l)}, ${a.num(r)})`);
          yield t.found(14, {
            indices: [i, j, l, r],
            vars: { res: [...res] },
            note: `Found ${res[res.length - 1]}.`,
          });
          while (l < r && a.num(l) === a.num(l + 1)) {
            yield t.read(15, { i: l, j: l + 1, vars: { l }, note: 'Skip past the duplicate.' });
            l++;
          }
          l++;
          r--;
          yield t.note(16, { vars: { l, r }, note: 'Close in from both sides.' });
        }
      }
    }
  }

  yield t.note(22, {
    vars: { i: undefined, j: undefined, l: undefined, r: undefined, sum: undefined, res: [...res] },
    note: res.length === 0 ? `Nothing sums to ${target}.` : `${res.length} quadruple${res.length === 1 ? '' : 's'}.`,
  });
}

export const fourSum: AlgorithmDef = {
  id: 'four-sum',
  name: '4Sum',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 0, -1, 0, -2, 2' },
    { key: 'target', label: 'target', kind: 'number', placeholder: '0' },
  ],
  defaultInput: { nums: [1, 0, -1, 0, -2, 2], target: 0 },
  run,
};
