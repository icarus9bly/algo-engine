import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function subsetXORSum(nums) {
  let total = 0;
  const current = [];
  function dfs(i, xor) {
    if (i === nums.length) { total += xor; return; }
    current.push(nums[i]);
    dfs(i + 1, xor ^ nums[i]);
    current.pop();
    dfs(i + 1, xor);
  }
  dfs(0, 0);
  return total;
}`;

interface Sum {
  total: number;
}

function* dfs(
  t: Tracer,
  nums: TracedArray,
  current: TracedArray,
  sum: Sum,
  i: number,
  xor: number,
): Generator<AlgoEvent> {
  if (i === nums.length) {
    sum.total += xor;
    yield t.found(5, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { i, xor, total: sum.total },
      note: current.length === 0
        ? 'The empty subset XORs to 0 and adds nothing — but it is still one of the subsets.'
        : `{${current.values.join(', ')}} XORs to ${xor}; the running total is now ${sum.total}.`,
    });
    return;
  }

  const pick = nums.num(i);

  yield t.push(6, current, pick, {
    vars: { i, xor },
    note: `Take ${pick} into the subset: the XOR so far becomes ${xor} ^ ${pick} = ${xor ^ pick}.`,
  });
  yield* dfs(t, nums, current, sum, i + 1, xor ^ pick);

  yield t.pop(8, current, {
    vars: { i, xor },
    note: `Drop ${pick} back out; the XOR returns to ${xor}. XOR is its own undo, which is why nothing has to be recomputed.`,
  });
  yield* dfs(t, nums, current, sum, i + 1, xor);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = (input.nums as number[]) ?? [];
  if (values.length === 0) throw new Error('Give at least one number.');
  if (values.length > 6) throw new Error('Keep it to 6 numbers or fewer — the search doubles with each one.');
  if (values.some((v) => !Number.isInteger(v) || v < 0)) {
    throw new Error('Every number must be a non-negative integer.');
  }

  const t = new Tracer();
  const nums = t.array('nums', values, 'nums', ['i']);
  const current = t.array('current', [], 'current subset', []);

  yield t.note(1, {
    target: nums,
    note: `Every subset contributes its XOR, so all ${2 ** values.length} of them get visited — there is nothing to prune.`,
  });

  const sum: Sum = { total: 0 };
  yield* dfs(t, nums, current, sum, 0, 0);

  yield t.note(12, {
    target: nums,
    vars: { i: undefined, xor: undefined, result: sum.total },
    note: `The XOR totals of all ${2 ** values.length} subsets add up to ${sum.total}.`,
  });
}

export const subsetXORSum: AlgorithmDef = {
  id: 'sum-of-all-subsets-xor-total',
  name: 'Sum of All Subsets XOR Total',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'nums', label: 'nums', kind: 'numbers', placeholder: '5, 1, 6' }],
  defaultInput: { nums: [5, 1, 6] },
  run,
};
