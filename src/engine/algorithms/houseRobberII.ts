import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function rob(nums) {
  if (nums.length === 1) return nums[0];
  return Math.max(robLine(nums, 1, nums.length - 1),
                  robLine(nums, 0, nums.length - 2));
}

function robLine(nums, lo, hi) {
  let prev = 0, curr = 0;
  for (let i = lo; i <= hi; i++) {
    const take = prev + nums[i];
    prev = curr;
    curr = Math.max(curr, take);
  }
  return curr;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'houses (in a circle)');

  yield t.note(1, {
    note: 'The houses form a circle, so the first and last are adjacent — they cannot both be robbed.',
  });

  if (a.length === 0) {
    yield t.note(3, { vars: { result: 0 }, note: 'No houses.' });
    return;
  }

  if (a.length === 1) {
    yield t.found(2, { i: 0, vars: { result: a.num(0) }, note: 'One house, so just rob it.' });
    return;
  }

  const results: number[] = [];

  for (const [lo, hi, why] of [
    [1, a.length - 1, 'Skip the first house, so the last one is allowed.'],
    [0, a.length - 2, 'Skip the last house, so the first one is allowed.'],
  ] as [number, number, string][]) {
    const range = Array.from({ length: hi - lo + 1 }, (_, d) => lo + d);
    yield t.note(3, { indices: range, vars: { lo, hi }, note: why });

    let prev = 0;
    let curr = 0;
    yield t.note(8, {
      indices: range,
      vars: { prev, curr },
      note: 'Run the plain House Robber scan over just this stretch.',
    });

    for (let i = lo; i <= hi; i++) {
      const take = prev + a.num(i);
      yield t.read(10, {
        i,
        vars: { i, take },
        note: `Robbing house ${i} gives ${prev} + ${a.num(i)} = ${take}.`,
      });
      prev = curr;
      curr = Math.max(curr, take);
      yield t.note(12, {
        i,
        vars: { prev, curr },
        note: `Best through house ${i}: ${curr}.`,
      });
    }

    results.push(curr);
    yield t.found(14, {
      indices: range,
      vars: { pass: results.length, results: [...results] },
      note: `This pass yields ${curr}.`,
    });
  }

  const best = Math.max(...results);
  yield t.note(3, {
    vars: {
      i: undefined, lo: undefined, hi: undefined,
      prev: undefined, curr: undefined, take: undefined, pass: undefined,
      result: best,
    },
    note: `Better of the two passes: ${best}.`,
  });
}

export const houseRobberII: AlgorithmDef = {
  id: 'house-robber-ii',
  name: 'House Robber II',
  category: '1-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '2, 3, 2' },
  ],
  defaultInput: { nums: [2, 3, 2] },
  run,
};
