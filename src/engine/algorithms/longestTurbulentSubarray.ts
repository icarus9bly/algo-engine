import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxTurbulenceSize(arr) {
  let best = 1, up = 1, down = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[i - 1]) { up = down + 1; down = 1; }
    else if (arr[i] < arr[i - 1]) { down = up + 1; up = 1; }
    else { up = 1; down = 1; }
    best = Math.max(best, up, down);
  }
  return best;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const arr = input.arr as number[];
  if (arr.length === 0) throw new Error('Give at least one value.');

  const t = new Tracer();
  const a = t.array('arr', arr, 'arr', ['i'], 'bars');

  yield t.note(1, {
    note: 'A turbulent run alternates up, down, up. Track the best run ending on a rise and the best ending on a fall.',
  });

  let best = 1;
  let up = 1;
  let down = 1;
  yield t.note(2, { i: 0, vars: { best, up, down }, note: 'A single element is turbulent by itself.' });

  for (let i = 1; i < a.length; i++) {
    const prev = a.num(i - 1);
    const here = a.num(i);

    if (here > prev) {
      up = down + 1;
      down = 1;
      yield t.compare(4, {
        i,
        j: i - 1,
        vars: { i, up, down },
        note: `${here} > ${prev} — a rise extends any run that ended on a fall, so up becomes ${up}.`,
      });
    } else if (here < prev) {
      down = up + 1;
      up = 1;
      yield t.compare(5, {
        i,
        j: i - 1,
        vars: { i, up, down },
        note: `${here} < ${prev} — a fall extends any run that ended on a rise, so down becomes ${down}.`,
      });
    } else {
      up = 1;
      down = 1;
      yield t.compare(6, {
        i,
        j: i - 1,
        vars: { i, up, down },
        note: `${here} equals ${prev} — flat breaks turbulence, so both reset.`,
      });
    }

    const longest = Math.max(up, down);
    if (longest > best) {
      best = longest;
      yield t.found(7, {
        indices: Array.from({ length: best }, (_, d) => i - best + 1 + d).filter((x) => x >= 0),
        vars: { best },
        note: `Longest turbulent run so far: ${best}.`,
      });
    } else {
      yield t.note(7, { i, vars: { best }, note: `Still ${best}.` });
    }
  }

  yield t.note(9, {
    vars: { i: undefined, up: undefined, down: undefined, result: best },
    note: `Longest turbulent subarray: ${best}.`,
  });
}

export const longestTurbulentSubarray: AlgorithmDef = {
  id: 'longest-turbulent-subarray',
  name: 'Longest Turbulent Subarray',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'arr', label: 'arr', kind: 'numbers', placeholder: '9,4,2,10,7,8,8,1,9' },
  ],
  defaultInput: { arr: [9, 4, 2, 10, 7, 8, 8, 1, 9] },
  run,
};
