import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `addNum(num) {
  push(small, num);
  if (small.size && large.size && top(small) > top(large)) {
    push(large, pop(small));
  }
  if (small.size > large.size + 1) push(large, pop(small));
  if (large.size > small.size + 1) push(small, pop(large));
}

findMedian() {
  if (small.size > large.size) return top(small);
  if (large.size > small.size) return top(large);
  return (top(small) + top(large)) / 2;
}`;

/** True when `a` belongs above `b` in this heap. */
type Above = (a: number, b: number) => boolean;

function* heapPush(
  t: Tracer,
  arr: TracedArray,
  value: number,
  line: number,
  above: Above,
): Generator<AlgoEvent> {
  yield t.push(line, arr, value, { note: `Add ${value} at the bottom of ${arr.label}.` });

  let i = arr.length - 1;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (!above(arr.num(i), arr.num(parent))) break;
    yield t.swap(line, arr, i, parent, {
      note: `${arr.num(i)} outranks its parent ${arr.num(parent)} — bubble it up.`,
    });
    i = parent;
  }
}

function* heapPop(
  t: Tracer,
  arr: TracedArray,
  line: number,
  above: Above,
): Generator<AlgoEvent, number> {
  const top = arr.num(0);
  yield t.read(line, { target: arr, i: 0, note: `Take ${top} off the top of ${arr.label}.` });

  if (arr.length === 1) {
    yield t.pop(line, arr, { note: `${arr.label.split(' ')[0]} is now empty.` });
    return top;
  }

  const last = arr.num(arr.length - 1);
  arr.popCell();
  arr.set(0, last);
  yield t.emit('write', line, {
    target: arr,
    i: 0,
    note: `Move ${last} from the bottom to the top, then sink it into place.`,
  });

  let i = 0;
  for (;;) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let best = i;
    if (l < arr.length && above(arr.num(l), arr.num(best))) best = l;
    if (r < arr.length && above(arr.num(r), arr.num(best))) best = r;
    if (best === i) break;
    yield t.swap(line, arr, i, best, {
      note: `${arr.num(best)} outranks ${arr.num(i)} — sink.`,
    });
    i = best;
  }

  return top;
}

const higher: Above = (a, b) => a > b;
const lower: Above = (a, b) => a < b;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const stream = input.nums as number[];
  if (stream.length > 12) throw new Error('Keep the stream to 12 values or fewer.');

  const t = new Tracer();
  const small = t.array('small', [], 'small — max-heap, largest on top', []);
  const large = t.array('large', [], 'large — min-heap, smallest on top', []);

  yield t.note(1, {
    note: 'Split the values in half: a max-heap of the smaller ones and a min-heap of the larger. The median sits on top.',
  });

  const medians: number[] = [];

  for (const num of stream) {
    yield t.note(1, { vars: { num }, note: `Stream in ${num}.` });

    yield* heapPush(t, small, num, 2, higher);

    if (small.length > 0 && large.length > 0 && small.num(0) > large.num(0)) {
      yield t.compare(3, {
        target: small,
        i: 0,
        note: `${small.num(0)} is bigger than ${large.num(0)}, so it is on the wrong side.`,
      });
      const moved = yield* heapPop(t, small, 4, higher);
      yield* heapPush(t, large, moved, 4, lower);
    }

    if (small.length > large.length + 1) {
      yield t.compare(6, {
        target: small,
        note: `small has ${small.length} and large has ${large.length} — rebalance.`,
      });
      const moved = yield* heapPop(t, small, 6, higher);
      yield* heapPush(t, large, moved, 6, lower);
    }

    if (large.length > small.length + 1) {
      yield t.compare(7, {
        target: large,
        note: `large has ${large.length} and small has ${small.length} — rebalance.`,
      });
      const moved = yield* heapPop(t, large, 7, lower);
      yield* heapPush(t, small, moved, 7, higher);
    }

    let median: number;
    if (small.length > large.length) {
      median = small.num(0);
      yield t.found(11, {
        target: small,
        i: 0,
        vars: { median },
        note: `An odd count, with the extra on the small side — the median is ${median}.`,
      });
    } else if (large.length > small.length) {
      median = large.num(0);
      yield t.found(12, {
        target: large,
        i: 0,
        vars: { median },
        note: `An odd count, with the extra on the large side — the median is ${median}.`,
      });
    } else {
      median = (small.num(0) + large.num(0)) / 2;
      yield t.found(13, {
        target: small,
        i: 0,
        vars: { median },
        note: `Even count — average the two tops: (${small.num(0)} + ${large.num(0)}) / 2 = ${median}.`,
      });
    }

    medians.push(median);
    yield t.note(13, {
      vars: { medians: [...medians] },
      note: `Median after ${medians.length} value${medians.length === 1 ? '' : 's'}: ${median}.`,
    });
  }

  yield t.note(14, {
    vars: { num: undefined, median: undefined, medians: [...medians] },
    note: `Running medians: ${medians.join(', ') || 'none'}.`,
  });
}

export const findMedianFromDataStream: AlgorithmDef = {
  id: 'find-median-from-data-stream',
  name: 'Find Median From Data Stream',
  category: 'Heap / Priority Queue',
  code,
  inputFields: [
    { key: 'nums', label: 'stream', kind: 'numbers', placeholder: '5, 15, 1, 3, 8' },
  ],
  defaultInput: { nums: [5, 15, 1, 3, 8] },
  run,
};
