import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function permuteUnique(nums) {
  nums.sort((a, b) => a - b);
  const res = [], current = [], used = new Array(nums.length).fill(false);
  function dfs() {
    if (current.length === nums.length) { res.push([...current]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue;
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
    yield t.found(5, {
      target: current,
      indices: current.values.map((_, d) => d),
      vars: { res: [...res] },
      note: `Every position is filled: ${current.values.join(', ')}.`,
    });
    return;
  }

  for (let i = 0; i < nums.length; i++) {
    if (used.num(i) === 1) {
      yield t.compare(7, {
        target: used,
        i,
        vars: { i },
        note: `Index ${i} is already placed in this arrangement.`,
      });
      continue;
    }

    if (i > 0 && nums.num(i) === nums.num(i - 1) && used.num(i - 1) === 0) {
      yield t.compare(8, {
        target: nums,
        i,
        j: i - 1,
        vars: { i },
        note:
          `Another ${nums.num(i)} sits at index ${i - 1} and is still free. Starting with this copy would repeat an ` +
          `arrangement the free one is about to make, so equal values must be used left to right.`,
      });
      continue;
    }

    yield t.write(9, used, i, 1, {
      vars: { i },
      note: `Claim the ${nums.num(i)} at index ${i} for position ${current.length}.`,
    });
    const soFar = [...current.values, nums.num(i)];
    yield t.push(10, current, nums.num(i), {
      note: `The arrangement so far is ${soFar.join(', ')}.`,
    });

    yield* dfs(t, nums, used, current, res);

    yield t.pop(12, current, {
      vars: { i },
      note: `Every arrangement with ${nums.num(i)} in position ${current.length - 1} is done — take it back off.`,
    });
    yield t.write(13, used, i, 0, {
      note: `Release index ${i} again.`,
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = [...((input.nums as number[]) ?? [])].sort((a, b) => a - b);
  if (values.length === 0) throw new Error('Give at least one number.');
  if (values.length > 5) throw new Error('Keep it to 5 numbers or fewer — the count grows as n factorial.');

  const t = new Tracer();
  const nums = t.array('nums', values, 'nums — sorted, so equal values sit together', ['i']);
  const used = t.array('used', new Array(values.length).fill(0), 'used — 1 once an index is spoken for', ['i']);
  const current = t.array('current', [], 'current arrangement', []);

  yield t.note(2, {
    target: nums,
    note: 'Sorting puts equal values side by side, which is what makes the duplicate rule a single check against the left neighbour.',
  });

  const res: string[] = [];
  yield* dfs(t, nums, used, current, res);

  yield t.note(17, {
    target: nums,
    vars: { i: undefined, res: [...res], result: res.length },
    note: `${res.length} distinct permutation${res.length === 1 ? '' : 's'}: ${res.join(' ')}.`,
  });
}

export const permutationsII: AlgorithmDef = {
  id: 'permutations-ii',
  name: 'Permutations II',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 1, 2' }],
  defaultInput: { nums: [1, 1, 2] },
  run,
};
