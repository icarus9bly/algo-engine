import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function subsetsWithDup(nums) {
  nums.sort((a, b) => a - b);
  const res = [], current = [];
  function dfs(i) {
    if (i === nums.length) { res.push([...current]); return; }
    current.push(nums[i]);
    dfs(i + 1);
    current.pop();
    while (i + 1 < nums.length && nums[i] === nums[i + 1]) i++;
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
    yield t.found(5, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { i, res: [...res] },
      note: current.length === 0
        ? 'Everything was refused — the empty subset.'
        : `A complete subset: {${current.values.join(', ')}}.`,
    });
    return;
  }

  const pick = nums.num(i);

  yield t.push(6, current, pick, {
    vars: { i },
    note: `Take the ${pick} at index ${i}, then decide the rest.`,
  });
  yield* dfs(t, nums, current, res, i + 1);

  yield t.pop(8, current, {
    vars: { i },
    note: `Put that ${pick} back and look at subsets without it.`,
  });

  let j = i;
  while (j + 1 < nums.length && nums.num(j) === nums.num(j + 1)) {
    j++;
    yield t.compare(9, {
      target: nums,
      i: j - 1,
      j,
      vars: { i: j },
      note:
        `Index ${j} holds another ${pick}. Refusing this one after refusing the first would rebuild subsets ` +
        `already listed, so skip past it.`,
    });
  }

  yield* dfs(t, nums, current, res, j + 1);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = [...((input.nums as number[]) ?? [])].sort((a, b) => a - b);
  if (values.length > 6) {
    throw new Error('Keep it to 6 numbers or fewer — the search doubles with each one.');
  }

  const t = new Tracer();
  const nums = t.array('nums', values, 'nums — sorted, so equal values sit together', ['i']);
  const current = t.array('current', [], 'current subset', []);

  yield t.note(2, {
    target: nums,
    note: 'Sorting first is the whole trick: duplicates end up adjacent, so a repeat is recognisable by looking one step to the right.',
  });

  const res: string[] = [];
  yield* dfs(t, nums, current, res, 0);

  yield t.note(13, {
    target: nums,
    vars: { i: undefined, res: [...res], result: res.length },
    note: `${res.length} distinct subset${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const subsetsII: AlgorithmDef = {
  id: 'subsets-ii',
  name: 'Subsets II',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 2, 2' }],
  defaultInput: { nums: [1, 2, 2] },
  run,
};
