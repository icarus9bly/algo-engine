import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function canJump(nums) {
  let goal = nums.length - 1;
  for (let i = nums.length - 2; i >= 0; i--) {
    if (i + nums[i] >= goal) {
      goal = i;
    }
  }
  return goal === 0;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['i', 'goal']);

  yield t.note(1, {
    note: 'Walk backwards, dragging the goal left every time a position can reach it.',
  });

  if (a.length === 0) {
    yield t.note(7, { vars: { result: false }, note: 'Empty array.' });
    return;
  }

  let goal = a.length - 1;
  yield t.note(2, { i: goal, vars: { goal }, note: 'The goal starts at the last index.' });

  for (let i = a.length - 2; i >= 0; i--) {
    const reach = i + a.num(i);
    const reaches = reach >= goal;
    yield t.compare(4, {
      i,
      j: goal,
      vars: { i, reach },
      note: `From ${i} you can reach ${reach}; the goal is at ${goal} — ${reaches ? 'reachable' : 'too far'}.`,
    });

    if (reaches) {
      goal = i;
      yield t.note(5, {
        i,
        vars: { goal },
        note: `The goal moves back to ${goal}.`,
      });
    }
  }

  const ok = goal === 0;
  yield t.note(8, {
    i: goal,
    vars: { i: undefined, reach: undefined, result: ok },
    note: ok
      ? 'The goal walked all the way back to index 0 — the end is reachable.'
      : `The goal stalled at ${goal}, which nothing to its left can reach.`,
  });
}

export const jumpGame: AlgorithmDef = {
  id: 'jump-game',
  name: 'Jump Game',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '2, 3, 1, 1, 4' },
  ],
  defaultInput: { nums: [2, 3, 1, 1, 4] },
  run,
};
