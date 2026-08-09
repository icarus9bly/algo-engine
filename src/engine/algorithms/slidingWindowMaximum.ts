import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxSlidingWindow(nums, k) {
  const dq = [], res = [];
  for (let r = 0; r < nums.length; r++) {
    while (dq.length && nums[dq[dq.length - 1]] < nums[r]) dq.pop();
    dq.push(r);
    if (dq[0] <= r - k) dq.shift();
    if (r >= k - 1) res.push(nums[dq[0]]);
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const nums = input.nums as number[];
  const k = input.k as number;
  if (k < 1 || k > nums.length) throw new Error(`k must be between 1 and ${nums.length}.`);

  const t = new Tracer();
  const a = t.array('nums', nums, 'nums', ['r'], 'bars');
  const dq = t.array('dq', [], 'deque — indices, values decreasing', []);
  const out = t.array('res', [], 'res', []);
  t.setVars({ k });

  yield t.note(1, {
    note: 'The deque holds only indices that could still be a maximum, so its values always decrease from front to back.',
  });

  const idx: number[] = [];

  for (let r = 0; r < a.length; r++) {
    yield t.read(3, { i: r, vars: { r }, note: `The window's right edge reaches ${a.num(r)}.` });

    while (idx.length > 0 && a.num(idx[idx.length - 1]) < a.num(r)) {
      const dropped = idx.pop()!;
      yield t.read(4, {
        target: dq,
        i: dq.length - 1,
        note: `${a.num(dropped)} is smaller than ${a.num(r)} and stands to its left — it can never be a maximum again.`,
      });
      yield t.pop(4, dq, { note: `Discard index ${dropped}.` });
    }

    idx.push(r);
    yield t.push(5, dq, r, { note: `Index ${r} joins the back of the deque.` });

    if (idx[0] <= r - k) {
      const gone = idx.shift()!;
      yield t.shift(6, dq, {
        note: `Index ${gone} has slid out of the window — drop it from the front.`,
      });
    }

    if (r >= k - 1) {
      yield t.found(7, {
        i: idx[0],
        vars: { window: `${r - k + 1}..${r}` },
        note: `The front of the deque, ${a.num(idx[0])}, is the maximum of this window.`,
      });
      yield t.push(7, out, a.num(idx[0]), { note: `Record ${a.num(idx[0])}.` });
    }
  }

  yield t.settle(9, out, out.values.map((_, d) => d), {
    vars: { r: undefined, window: undefined, result: out.values.join(',') },
    note: `Window maxima: ${out.values.join(', ')}.`,
  });
}

export const slidingWindowMaximum: AlgorithmDef = {
  id: 'sliding-window-maximum',
  name: 'Sliding Window Maximum',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 'nums', label: 'nums', kind: 'numbers', placeholder: '1,3,-1,-3,5,3,6,7' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 },
  run,
};
