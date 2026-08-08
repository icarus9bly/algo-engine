import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function topKFrequent(nums, k) {
  const count = {};
  for (const n of nums) count[n] = (count[n] ?? 0) + 1;
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const n in count) buckets[count[n]].push(n);
  const res = [];
  for (let f = buckets.length - 1; f > 0 && res.length < k; f--) {
    for (const n of buckets[f]) {
      if (res.length < k) res.push(n);
    }
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const k = input.k as number;

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['i']);
  t.setVars({ k });

  yield t.note(1, { note: `Find the ${k} most frequent values.` });

  const count: Record<string, number> = {};
  yield t.note(2, { vars: { count: {} }, note: 'Tally how often each value appears.' });

  for (let i = 0; i < a.length; i++) {
    const key = String(a.num(i));
    count[key] = (count[key] ?? 0) + 1;
    yield t.read(3, {
      i,
      vars: { i, count: { ...count } },
      note: `${key} has now been seen ${count[key]} time${count[key] === 1 ? '' : 's'}.`,
    });
  }

  // Registered late so earlier frames aren't cluttered by an empty row.
  const buckets = t.array(
    'buckets',
    new Array(a.length + 1).fill(''),
    'buckets — index is a frequency',
    ['f'],
  );
  yield t.note(4, {
    target: buckets,
    vars: { i: undefined },
    note: 'One bucket per possible frequency. Counting sort, so no comparison sort is needed.',
  });

  for (const key of Object.keys(count)) {
    const f = count[key];
    const cell = String(buckets.at(f));
    yield t.write(5, buckets, f, cell === '' ? key : `${cell} ${key}`, {
      note: `${key} appears ${f}×, so it goes in bucket ${f}.`,
    });
  }

  const res: number[] = [];
  yield t.note(6, {
    target: buckets,
    vars: { res: [] },
    note: `Now read the buckets from the highest frequency down, taking the first ${k}.`,
  });

  for (let f = buckets.length - 1; f > 0 && res.length < k; f--) {
    const cell = String(buckets.at(f));
    yield t.read(7, {
      target: buckets,
      i: f,
      vars: { f },
      note: cell === '' ? `Bucket ${f} is empty.` : `Bucket ${f} holds ${cell}.`,
    });

    if (cell === '') continue;

    for (const token of cell.split(' ')) {
      if (res.length >= k) break;
      res.push(Number(token));
      yield t.found(9, {
        target: buckets,
        i: f,
        vars: { res: [...res] },
        note: `Take ${token} — ${res.length} of ${k}.`,
      });
    }
  }

  yield t.note(12, {
    vars: { f: undefined, res: [...res] },
    note: `Answer: ${res.join(', ') || 'none'}.`,
  });
}

export const topKFrequent: AlgorithmDef = {
  id: 'top-k-frequent',
  name: 'Top K Frequent Elements',
  category: 'Arrays & Hashing',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1, 1, 1, 2, 2, 3' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '2' },
  ],
  defaultInput: { nums: [1, 1, 1, 2, 2, 3], k: 2 },
  run,
};
