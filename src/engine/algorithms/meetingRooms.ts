import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { parseIntervals, show, showAll } from './intervals';

const code = `function canAttendMeetings(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) return false;
  }
  return true;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const parsed = parseIntervals(String(input.intervals ?? ''));

  const t = new Tracer();
  const src = t.array('meetings', showAll(parsed), 'meetings', ['i']);

  yield t.note(1, {
    note: 'Sorted by start, only neighbouring meetings can clash — no need to compare every pair.',
  });

  const sorted = [...parsed].sort((a, b) => a[0] - b[0]);
  sorted.forEach((iv, k) => src.set(k, show(iv)));
  yield t.emit('write', 2, {
    indices: sorted.map((_, k) => k),
    note: 'Sorted by start time.',
  });

  for (let i = 1; i < sorted.length; i++) {
    const clash = sorted[i][0] < sorted[i - 1][1];
    yield t.compare(4, {
      i,
      j: i - 1,
      vars: { i },
      note: clash
        ? `${show(sorted[i])} starts before ${show(sorted[i - 1])} finishes.`
        : `${show(sorted[i])} starts after ${show(sorted[i - 1])} finishes — fine.`,
    });

    if (clash) {
      yield t.note(4, {
        i,
        j: i - 1,
        vars: { result: false },
        note: 'One person cannot be in both meetings.',
      });
      return;
    }
  }

  yield t.settle(6, src, src.values.map((_, d) => d), {
    vars: { i: undefined, result: true },
    note: 'No two meetings overlap — all of them can be attended.',
  });
}

export const meetingRooms: AlgorithmDef = {
  id: 'meeting-rooms',
  name: 'Meeting Rooms',
  category: 'Intervals',
  code,
  inputFields: [
    { key: 'intervals', label: 'meetings', kind: 'text', placeholder: '0-30, 5-10, 15-20' },
  ],
  defaultInput: { intervals: '0-30, 5-10, 15-20' },
  run,
};
