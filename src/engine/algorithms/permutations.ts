import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function permute(nums) {
  const res = [], current = [], used = new Array(nums.length).fill(false);
  function dfs() {
    if (current.length === nums.length) { res.push([...current]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(nums[i]);
      dfs();
      current.pop();
      used[i] = false;
    }
  }
  dfs();
  return res;
}`;

function* dfs(
  t: Tracer,
  nums: TracedArray,
  used: TracedArray,
  current: TracedArray,
  res: string[],
): Generator<AlgoEvent> {
  if (current.length === nums.length) {
    res.push(`[${current.values.join(',')}]`);
    yield t.found(4, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { res: [...res] },
      note: `Every position is filled: ${current.values.join(', ')}.`,
    });
    return;
  }

  for (let i = 0; i < nums.length; i++) {
    if (used.num(i) === 1) {
      yield t.compare(6, {
        target: used,
        i,
        vars: { i },
        note: `${nums.num(i)} is already placed in this arrangement — a permutation uses each element once.`,
      });
      continue;
    }

    yield t.write(7, used, i, 1, {
      vars: { i },
      note: `Claim the ${nums.num(i)} at index ${i} for position ${current.length}.`,
    });
    const soFar = [...current.values, nums.num(i)];
    yield t.push(8, current, nums.num(i), {
      note: `The arrangement so far is ${soFar.join(', ')}.`,
    });

    yield* dfs(t, nums, used, current, res);

    yield t.pop(10, current, {
      vars: { i },
      note: `Every arrangement with ${nums.num(i)} in position ${current.length - 1} is done — take it back off.`,
    });
    yield t.write(11, used, i, 0, {
      note: `Release index ${i} so deeper branches elsewhere can use it again.`,
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = (input.nums as number[]) ?? [];
  if (values.length === 0) throw new Error('Give at least one number.');
  if (values.length > 5) throw new Error('Keep it to 5 numbers or fewer — the count grows as n factorial.');

  const t = new Tracer();
  const nums = t.array('nums', values, 'nums', ['i']);
  const used = t.array('used', new Array(values.length).fill(0), 'used — 1 once an index is spoken for', ['i']);
  const current = t.array('current', [], 'current arrangement', []);

  const factorial = values.reduce((acc, _, idx) => acc * (idx + 1), 1);
  yield t.note(1, {
    target: nums,
    note: `Each position may take any element not already used, so the search has ${values.length}! = ${factorial} leaves.`,
  });

  const res: string[] = [];
  yield* dfs(t, nums, used, current, res);

  yield t.note(15, {
    target: nums,
    vars: { i: undefined, res: [...res], result: res.length },
    note: `${res.length} permutation${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const permutations: AlgorithmDef = {
  id: 'permutations',
  name: 'Permutations',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 2, 3' }],
  defaultInput: { nums: [1, 2, 3] },
  run,
};
