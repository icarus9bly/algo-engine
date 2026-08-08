import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { parseIntervals, show, showAll, type Interval } from './intervals';

const code = `function insert(intervals, newInterval) {
  const res = [];
  let i = 0;
  while (i < intervals.length && intervals[i][1] < newInterval[0]) {
    res.push(intervals[i++]);
  }
  while (i < intervals.length && intervals[i][0] <= newInterval[1]) {
    newInterval = [Math.min(newInterval[0], intervals[i][0]),
                   Math.max(newInterval[1], intervals[i][1])];
    i++;
  }
  res.push(newInterval);
  while (i < intervals.length) res.push(intervals[i++]);
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const intervals = parseIntervals(String(input.intervals ?? ''));
  const added = parseIntervals(String(input.newInterval ?? ''));
  if (added.length !== 1) throw new Error('Give exactly one new interval, like 4-8.');

  const t = new Tracer();
  t.array('intervals', showAll(intervals), 'intervals (sorted)', ['i']);
  const out = t.array('res', [], 'res', []);
  let merged: Interval = added[0];
  t.setVars({ newInterval: show(merged) });

  yield t.note(1, {
    note: 'The list is already sorted, so the intervals split into three runs: before, overlapping, and after.',
  });

  let i = 0;
  while (i < intervals.length && intervals[i][1] < merged[0]) {
    yield t.compare(4, {
      i,
      vars: { i },
      note: `${show(intervals[i])} ends before ${show(merged)} starts — it passes through untouched.`,
    });
    yield t.push(5, out, show(intervals[i]), { note: `Keep ${show(intervals[i])}.` });
    i++;
  }

  while (i < intervals.length && intervals[i][0] <= merged[1]) {
    yield t.compare(7, {
      i,
      vars: { i },
      note: `${show(intervals[i])} overlaps ${show(merged)} — absorb it.`,
    });
    merged = [
      Math.min(merged[0], intervals[i][0]),
      Math.max(merged[1], intervals[i][1]),
    ];
    yield t.note(8, {
      i,
      vars: { newInterval: show(merged) },
      note: `The growing interval is now ${show(merged)}.`,
    });
    i++;
  }

  yield t.push(11, out, show(merged), {
    note: `Nothing else overlaps, so ${show(merged)} takes its place.`,
  });

  while (i < intervals.length) {
    yield t.read(12, {
      i,
      vars: { i },
      note: `${show(intervals[i])} starts after the merged interval ends.`,
    });
    yield t.push(12, out, show(intervals[i]), { note: `Keep ${show(intervals[i])}.` });
    i++;
  }

  yield t.settle(13, out, out.values.map((_, d) => d), {
    vars: { i: undefined, result: out.values.join(' ') },
    note: `Result: ${out.values.join(', ')}.`,
  });
}

export const insertInterval: AlgorithmDef = {
  id: 'insert-interval',
  name: 'Insert Interval',
  category: 'Intervals',
  code,
  inputFields: [
    { key: 'intervals', label: 'intervals', kind: 'text', placeholder: '1-3, 6-9' },
    { key: 'newInterval', label: 'new', kind: 'text', placeholder: '2-5' },
  ],
  defaultInput: { intervals: '1-3, 6-9', newInterval: '2-5' },
  run,
};
