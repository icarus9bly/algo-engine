import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { parseIntervals, showAll } from './intervals';

const code = `function minMeetingRooms(intervals) {
  const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
  const ends = intervals.map(i => i[1]).sort((a, b) => a - b);
  let rooms = 0, most = 0, s = 0, e = 0;
  while (s < starts.length) {
    if (starts[s] < ends[e]) {
      rooms++;
      s++;
    } else {
      rooms--;
      e++;
    }
    most = Math.max(most, rooms);
  }
  return most;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const parsed = parseIntervals(String(input.intervals ?? ''));

  const t = new Tracer();
  t.array('meetings', showAll(parsed), 'meetings', []);
  const startArr = t.array('starts', [...parsed.map((i) => i[0])].sort((a, b) => a - b), 'starts (sorted)', ['s']);
  const endArr = t.array('ends', [...parsed.map((i) => i[1])].sort((a, b) => a - b), 'ends (sorted)', ['e']);

  yield t.note(1, {
    note: 'Detach starts from ends: the answer is just the largest number of meetings ever open at once.',
  });

  if (parsed.length === 0) {
    yield t.note(15, { vars: { result: 0 }, note: 'No meetings.' });
    return;
  }

  let rooms = 0;
  let most = 0;
  let s = 0;
  let e = 0;
  yield t.note(4, { vars: { rooms, most, s, e }, note: 'No rooms in use yet.' });

  while (s < startArr.length) {
    const startsFirst = startArr.num(s) < endArr.num(e);
    yield t.compare(6, {
      target: startArr,
      i: s,
      vars: { s, e },
      note: startsFirst
        ? `The next event is a meeting starting at ${startArr.num(s)}.`
        : `The next event is a meeting ending at ${endArr.num(e)}.`,
    });

    if (startsFirst) {
      rooms++;
      s++;
      yield t.note(7, {
        target: startArr,
        i: Math.min(s, startArr.length - 1),
        vars: { rooms, s },
        note: `A meeting begins — ${rooms} room${rooms === 1 ? '' : 's'} now in use.`,
      });
    } else {
      rooms--;
      e++;
      yield t.note(10, {
        target: endArr,
        i: Math.min(e, endArr.length - 1),
        vars: { rooms, e },
        note: `A meeting ends and frees its room — ${rooms} still in use.`,
      });
    }

    if (rooms > most) {
      most = rooms;
      yield t.found(13, {
        target: startArr,
        vars: { most },
        note: `New peak: ${most} room${most === 1 ? '' : 's'} at once.`,
      });
    }
  }

  yield t.note(15, {
    vars: { s: undefined, e: undefined, rooms: undefined, result: most },
    note: `${most} room${most === 1 ? '' : 's'} needed.`,
  });
}

export const meetingRoomsII: AlgorithmDef = {
  id: 'meeting-rooms-ii',
  name: 'Meeting Rooms II',
  category: 'Intervals',
  code,
  inputFields: [
    { key: 'intervals', label: 'meetings', kind: 'text', placeholder: '0-30, 5-10, 15-20' },
  ],
  defaultInput: { intervals: '0-30, 5-10, 15-20' },
  run,
};
