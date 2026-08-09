import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function jump(nums) {
  let jumps = 0, l = 0, r = 0;
  while (r < nums.length - 1) {
    let farthest = 0;
    for (let i = l; i <= r; i++) {
      farthest = Math.max(farthest, i + nums[i]);
    }
    l = r + 1;
    r = farthest;
    jumps++;
  }
  return jumps;
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  if (nums.length === 0) throw new Error('Give at least one value.');

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['l', 'r'], 'bars');

  yield t.note(1, {
    note: 'This is breadth-first search in disguise: l..r is everything reachable in the current number of jumps.',
  });

  let jumps = 0;
  let l = 0;
  let r = 0;
  yield t.note(2, { i: 0, vars: { jumps, l, r }, note: 'Zero jumps reaches only the start.' });

  while (r < a.length - 1) {
    let farthest = 0;
    for (let i = l; i <= r; i++) {
      const reach = i + a.num(i);
      yield t.read(6, {
        i,
        indices: span(l, r),
        note: `From ${i} you can reach ${reach}.`,
      });
      farthest = Math.max(farthest, reach);
    }

    l = r + 1;
    r = Math.min(farthest, a.length - 1);
    jumps++;
    yield t.note(9, {
      indices: span(l, r),
      vars: { jumps, l, r },
      note: `After ${jumps} jump${jumps === 1 ? '' : 's'}, everything up to ${r} is reachable.`,
    });
  }

  yield t.settle(12, a, [a.length - 1], {
    vars: { l: undefined, r: undefined, result: jumps },
    note: `The end is reachable in ${jumps} jump${jumps === 1 ? '' : 's'}.`,
  });
}

export const jumpGameII: AlgorithmDef = {
  id: 'jump-game-ii',
  name: 'Jump Game II',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '2, 3, 1, 1, 4' },
  ],
  defaultInput: { nums: [2, 3, 1, 1, 4] },
  run,
};
