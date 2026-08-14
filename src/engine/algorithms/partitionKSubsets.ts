import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function canPartitionKSubsets(nums, k) {
  const total = sum(nums);
  if (total % k !== 0) return false;
  const target = total / k;
  nums.sort((a, b) => b - a);
  if (nums[0] > target) return false;
  const buckets = new Array(k).fill(0);
  function dfs(i) {
    if (i === nums.length) return true;
    for (let b = 0; b < k; b++) {
      if (buckets[b] + nums[i] > target) continue;
      if (b > 0 && buckets[b] === buckets[b - 1]) continue;
      buckets[b] += nums[i];
      if (dfs(i + 1)) return true;
      buckets[b] -= nums[i];
    }
    return false;
  }
  return dfs(0);
}`;

function* dfs(
  t: Tracer,
  nums: TracedArray,
  buckets: TracedArray,
  target: number,
  k: number,
  i: number,
): Generator<AlgoEvent, boolean> {
  if (i === nums.length) {
    yield t.found(9, {
      target: buckets,
      indices: buckets.values.map((_, d) => d),
      vars: { i },
      note: `Every number is placed and all ${k} buckets hold ${target}.`,
    });
    return true;
  }

  const n = nums.num(i);

  for (let b = 0; b < k; b++) {
    if (buckets.num(b) + n > target) {
      yield t.compare(11, {
        target: buckets,
        i: b,
        vars: { i, b },
        note: `Bucket ${b} holds ${buckets.num(b)}; adding ${n} would pass ${target}.`,
      });
      continue;
    }

    if (b > 0 && buckets.num(b) === buckets.num(b - 1)) {
      yield t.compare(12, {
        target: buckets,
        i: b,
        j: b - 1,
        vars: { i, b },
        note:
          `Bucket ${b} holds exactly what bucket ${b - 1} holds, and that one already turned this number down. ` +
          `Empty buckets are interchangeable, so trying again here just repeats the same search.`,
      });
      continue;
    }

    yield t.write(13, buckets, b, buckets.num(b) + n, {
      vars: { i, b },
      note: `Drop ${n} into bucket ${b}, bringing it to ${buckets.num(b) + n} of ${target}.`,
    });

    if (yield* dfs(t, nums, buckets, target, k, i + 1)) return true;

    yield t.write(15, buckets, b, buckets.num(b) - n, {
      vars: { i, b },
      note: `That branch failed — pull ${n} back out of bucket ${b}.`,
    });
  }

  yield t.note(17, {
    target: nums,
    i,
    vars: { i },
    note: `${n} fits in no bucket from here, so this arrangement fails.`,
  });
  return false;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = [...((input.nums as number[]) ?? [])].sort((a, b) => b - a);
  const k = Number(input.k);
  if (values.length === 0) throw new Error('Give at least one number.');
  if (values.length > 8) throw new Error('Keep it to 8 numbers or fewer so the search stays watchable.');
  if (values.some((v) => !Number.isInteger(v) || v <= 0)) {
    throw new Error('Every number must be a positive integer.');
  }
  if (!Number.isInteger(k) || k < 1) throw new Error('k must be a positive integer.');
  if (k > values.length) throw new Error(`Only ${values.length} numbers — they cannot fill ${k} non-empty buckets.`);

  const t = new Tracer();
  const nums = t.array('nums', values, 'nums — largest first', ['i']);
  const buckets = t.array('buckets', new Array(k).fill(0), `buckets — the ${k} subsets being filled`, ['b']);

  const total = values.reduce((acc, v) => acc + v, 0);
  t.setVars({ total, k });

  yield t.note(2, {
    target: nums,
    indices: values.map((_, d) => d),
    note: `The numbers total ${total}.`,
  });

  if (total % k !== 0) {
    yield t.note(3, {
      target: nums,
      vars: { result: false },
      note: `${total} does not divide evenly into ${k} parts, so no partition exists.`,
    });
    return;
  }

  const target = total / k;
  t.setVars({ target });

  yield t.note(4, {
    target: buckets,
    indices: buckets.values.map((_, d) => d),
    note: `Each bucket must reach ${total} ÷ ${k} = ${target}.`,
  });
  yield t.note(5, {
    target: nums,
    note: 'Largest first, so a number that cannot be placed fails immediately rather than at the bottom of a long descent.',
  });

  if (values[0] > target) {
    yield t.note(6, {
      target: nums,
      i: 0,
      vars: { result: false },
      note: `The largest number is ${values[0]}, already more than a bucket can hold.`,
    });
    return;
  }

  const result = yield* dfs(t, nums, buckets, target, k, 0);

  yield t.note(19, {
    target: buckets,
    indices: buckets.values.map((_, d) => d),
    vars: { i: undefined, b: undefined, result },
    note: result
      ? `The numbers split into ${k} subsets of ${target}.`
      : `No split into ${k} equal subsets exists.`,
  });
}

export const partitionKSubsets: AlgorithmDef = {
  id: 'partition-to-k-equal-sum-subsets',
  name: 'Partition to K Equal Sum Subsets',
  category: 'Backtracking',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '4, 3, 2, 3, 5, 2, 1' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '4' },
  ],
  defaultInput: { nums: [4, 3, 2, 3, 5, 2, 1], k: 4 },
  run,
};
