import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function findClosestElements(arr, k, x) {
  let l = 0, r = arr.length - 1;
  while (r - l + 1 > k) {
    if (Math.abs(arr[l] - x) > Math.abs(arr[r] - x)) l++;
    else r--;
  }
  return arr.slice(l, r + 1);
}`;

function span(l: number, r: number): number[] {
  return l > r ? [] : Array.from({ length: r - l + 1 }, (_, d) => l + d);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const arr = input.arr as number[];
  const k = input.k as number;
  const x = input.x as number;
  if (k < 1 || k > arr.length) throw new Error(`k must be between 1 and ${arr.length}.`);

  const t = new Tracer();
  const a = t.array('arr', arr, 'arr (sorted)', ['l', 'r']);
  t.setVars({ k, x });

  yield t.note(1, {
    note: `The answer is a contiguous run, because the array is sorted. So start with everything and shave off the worse end ${arr.length - k} time${arr.length - k === 1 ? '' : 's'}.`,
  });

  let l = 0;
  let r = a.length - 1;
  yield t.note(2, { indices: span(l, r), vars: { l, r }, note: 'Start with the whole array.' });

  while (r - l + 1 > k) {
    const dl = Math.abs(a.num(l) - x);
    const dr = Math.abs(a.num(r) - x);
    yield t.compare(4, {
      i: l,
      j: r,
      note: `${a.num(l)} is ${dl} from ${x}; ${a.num(r)} is ${dr} away.`,
    });

    if (dl > dr) {
      l++;
      yield t.note(4, {
        indices: span(l, r),
        vars: { l },
        note: 'The left end is further away, so drop it.',
      });
    } else {
      r--;
      yield t.note(5, {
        indices: span(l, r),
        vars: { r },
        note: 'The right end is no closer, so drop it — ties favour the smaller value.',
      });
    }
  }

  yield t.settle(7, a, span(l, r), {
    vars: { l: undefined, r: undefined, result: a.values.slice(l, r + 1).join(',') },
    note: `The ${k} closest to ${x}: ${a.values.slice(l, r + 1).join(', ')}.`,
  });
}

export const findKClosestElements: AlgorithmDef = {
  id: 'find-k-closest-elements',
  name: 'Find K Closest Elements',
  category: 'Sliding Window',
  code,
  inputFields: [
    { key: 'arr', label: 'arr', kind: 'numbers', placeholder: '1, 2, 3, 4, 5' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '4' },
    { key: 'x', label: 'x', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { arr: [1, 2, 3, 4, 5], k: 4, x: 3 },
  run,
};
