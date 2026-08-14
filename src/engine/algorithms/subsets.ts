import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function subsets(nums) {
  const res = [], current = [];
  function dfs(i) {
    if (i === nums.length) { res.push([...current]); return; }
    current.push(nums[i]);
    dfs(i + 1);
    current.pop();
    dfs(i + 1);
  }
  dfs(0);
  return res;
}`;

function* dfs(
  t: Tracer,
  nums: TracedArray,
  current: TracedArray,
  res: string[],
  i: number,
): Generator<AlgoEvent> {
  if (i === nums.length) {
    res.push(`[${current.values.join(',')}]`);
    yield t.found(4, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { i, res: [...res] },
      note: current.length === 0
        ? 'Every element was refused — that is the empty subset, and it counts.'
        : `Every element has been decided: {${current.values.join(', ')}}.`,
    });
    return;
  }

  const pick = nums.num(i);

  yield t.push(5, current, pick, {
    vars: { i },
    note: `Take ${pick} into the subset, then decide the rest.`,
  });
  yield* dfs(t, nums, current, res, i + 1);

  yield t.pop(7, current, {
    vars: { i },
    note: `Put ${pick} back. Every subset containing it has now been listed, so explore the ones without it.`,
  });
  yield* dfs(t, nums, current, res, i + 1);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = (input.nums as number[]) ?? [];
  if (values.length > 6) {
    throw new Error('Keep it to 6 numbers or fewer — the search doubles with each one.');
  }

  const t = new Tracer();
  const nums = t.array('nums', values, 'nums', ['i']);
  const current = t.array('current', [], 'current subset', []);

  yield t.note(1, {
    target: nums,
    note: `Each element faces one yes/no question, so the search is a binary tree ${values.length} deep with 2^${values.length} = ${2 ** values.length} leaves.`,
  });

  const res: string[] = [];
  yield* dfs(t, nums, current, res, 0);

  yield t.note(11, {
    target: nums,
    vars: { i: undefined, res: [...res], result: res.length },
    note: `${res.length} subsets: ${res.join(' ')}.`,
  });
}

export const subsets: AlgorithmDef = {
  id: 'subsets',
  name: 'Subsets',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 2, 3' }],
  defaultInput: { nums: [1, 2, 3] },
  run,
};
