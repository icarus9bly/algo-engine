import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function numRescueBoats(people, limit) {
  people.sort((a, b) => a - b);
  let l = 0, r = people.length - 1, boats = 0;
  while (l <= r) {
    if (people[l] + people[r] <= limit) l++;
    r--;
    boats++;
  }
  return boats;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const people = input.people as number[];
  const limit = input.limit as number;

  const t = new Tracer();
  const a = t.array('people', people, 'people', ['l', 'r'], 'bars');
  t.setVars({ limit });

  yield t.note(1, {
    note: 'Every boat holds at most two, so the heaviest person must sail — the only question is whether the lightest can join them.',
  });

  const sorted = [...a.values].sort((x, y) => (x as number) - (y as number));
  for (let k = 0; k < sorted.length; k++) a.set(k, sorted[k]);
  yield t.note(2, { note: 'Sort so the lightest and heaviest are at the ends.' });

  let l = 0;
  let r = a.length - 1;
  let boats = 0;
  yield t.note(3, { vars: { l, r, boats }, note: 'No boats used yet.' });

  while (l <= r) {
    const pairFits = a.num(l) + a.num(r) <= limit;
    yield t.compare(5, {
      i: l,
      j: r,
      vars: { l, r },
      note: `${a.num(l)} + ${a.num(r)} = ${a.num(l) + a.num(r)} ${pairFits ? '≤' : '>'} ${limit}.`,
    });

    if (pairFits) {
      yield t.note(5, {
        i: l,
        j: r,
        note: 'They fit together, so the lightest sails too.',
      });
      l++;
    } else {
      yield t.note(5, {
        i: r,
        note: 'Too heavy as a pair — the heaviest sails alone.',
      });
    }

    r--;
    boats++;
    yield t.note(7, { vars: { l, r, boats }, note: `${boats} boat${boats === 1 ? '' : 's'} used.` });
  }

  yield t.note(9, {
    vars: { l: undefined, r: undefined, result: boats },
    note: `${boats} boat${boats === 1 ? '' : 's'} needed.`,
  });
}

export const boatsToSavePeople: AlgorithmDef = {
  id: 'boats-to-save-people',
  name: 'Boats to Save People',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'people', label: 'people', kind: 'numbers', placeholder: '3, 2, 2, 1' },
    { key: 'limit', label: 'limit', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { people: [3, 2, 2, 1], limit: 3 },
  run,
};
