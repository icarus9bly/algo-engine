import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { parseIntervals, show, showAll } from './intervals';

const code = `function eraseOverlapIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let removed = 0;
  let prevEnd = intervals[0][1];
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] >= prevEnd) {
      prevEnd = intervals[i][1];
    } else {
      removed++;
      prevEnd = Math.min(prevEnd, intervals[i][1]);
    }
  }
  return removed;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const parsed = parseIntervals(String(input.intervals ?? ''));
  if (parsed.length === 0) throw new Error('Give at least one interval.');

  const t = new Tracer();
  const src = t.array('intervals', showAll(parsed), 'intervals', ['i']);

  yield t.note(1, {
    note: 'When two intervals clash, dropping the one that ends later always leaves more room.',
  });

  const sorted = [...parsed].sort((a, b) => a[0] - b[0]);
  sorted.forEach((iv, k) => src.set(k, show(iv)));
  yield t.emit('write', 2, {
    indices: sorted.map((_, k) => k),
    note: 'Sorted by start time.',
  });

  let removed = 0;
  let prevEnd = sorted[0][1];
  yield t.settle(4, src, [0], {
    vars: { removed, prevEnd },
    note: `Keep ${show(sorted[0])}; it ends at ${prevEnd}.`,
  });

  for (let i = 1; i < sorted.length; i++) {
    const clash = sorted[i][0] < prevEnd;
    yield t.compare(6, {
      i,
      vars: { i },
      note: clash
        ? `${show(sorted[i])} starts before ${prevEnd}, so it clashes.`
        : `${show(sorted[i])} starts at or after ${prevEnd} — no clash.`,
    });

    if (!clash) {
      prevEnd = sorted[i][1];
      yield t.settle(7, src, [i], {
        vars: { prevEnd },
        note: `Keep it; the frontier moves to ${prevEnd}.`,
      });
    } else {
      removed++;
      prevEnd = Math.min(prevEnd, sorted[i][1]);
      yield t.note(10, {
        i,
        vars: { removed, prevEnd },
        note: `Drop whichever of the two ends later, leaving the frontier at ${prevEnd}. ${removed} removed so far.`,
      });
    }
  }

  yield t.note(13, {
    vars: { i: undefined, prevEnd: undefined, result: removed },
    note: `${removed} interval${removed === 1 ? '' : 's'} must go for the rest to be disjoint.`,
  });
}

export const nonOverlappingIntervals: AlgorithmDef = {
  id: 'non-overlapping-intervals',
  name: 'Non Overlapping Intervals',
  category: 'Intervals',
  code,
  inputFields: [
    { key: 'intervals', label: 'intervals', kind: 'text', placeholder: '1-2, 2-3, 3-4, 1-3' },
  ],
  defaultInput: { intervals: '1-2, 2-3, 3-4, 1-3' },
  run,
};
