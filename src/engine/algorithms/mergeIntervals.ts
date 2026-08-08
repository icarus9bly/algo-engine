import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { parseIntervals, show, showAll, type Interval } from './intervals';

const code = `function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const res = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = res[res.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      res.push(intervals[i]);
    }
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const parsed = parseIntervals(String(input.intervals ?? ''));
  if (parsed.length === 0) throw new Error('Give at least one interval.');

  const t = new Tracer();
  const src = t.array('intervals', showAll(parsed), 'intervals', ['i']);
  const out = t.array('res', [], 'res', []);

  yield t.note(1, { note: 'Sorting by start means any overlap can only involve the previous kept interval.' });

  const sorted = [...parsed].sort((a, b) => a[0] - b[0]);
  sorted.forEach((iv, k) => src.set(k, show(iv)));
  yield t.emit('write', 2, {
    target: src,
    indices: sorted.map((_, k) => k),
    note: 'Sorted by start time.',
  });

  const res: Interval[] = [sorted[0]];
  yield t.push(3, out, show(sorted[0]), { note: `Seed with ${show(sorted[0])}.` });

  for (let i = 1; i < sorted.length; i++) {
    const last = res[res.length - 1];
    const overlaps = sorted[i][0] <= last[1];
    yield t.compare(6, {
      target: src,
      i,
      vars: { i },
      note: overlaps
        ? `${show(sorted[i])} starts at or before ${last[1]}, so it overlaps ${show(last)}.`
        : `${show(sorted[i])} starts after ${show(last)} ends — a separate interval.`,
    });

    if (overlaps) {
      last[1] = Math.max(last[1], sorted[i][1]);
      res[res.length - 1] = last;
      yield t.write(7, out, out.length - 1, show(last), {
        note: `Extend it to ${show(last)}.`,
      });
    } else {
      res.push(sorted[i]);
      yield t.push(9, out, show(sorted[i]), { note: `Start a new interval at ${show(sorted[i])}.` });
    }
  }

  yield t.settle(12, out, out.values.map((_, d) => d), {
    vars: { i: undefined, result: out.values.join(' ') },
    note: `Merged into ${out.length} interval${out.length === 1 ? '' : 's'}: ${out.values.join(', ')}.`,
  });
}

export const mergeIntervals: AlgorithmDef = {
  id: 'merge-intervals',
  name: 'Merge Intervals',
  category: 'Intervals',
  code,
  inputFields: [
    { key: 'intervals', label: 'intervals', kind: 'text', placeholder: '1-3, 2-6, 8-10, 15-18' },
  ],
  defaultInput: { intervals: '1-3, 2-6, 8-10, 15-18' },
  run,
};
