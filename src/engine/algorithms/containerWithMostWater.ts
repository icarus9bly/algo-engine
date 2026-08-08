import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    const area = (r - l) * Math.min(height[l], height[r]);
    best = Math.max(best, area);
    if (height[l] < height[r]) l++;
    else r--;
  }
  return best;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const height = input.height as number[];

  const t = new Tracer();
  const a = t.array('height', height, 'height');

  yield t.note(1, { note: 'Widest container first, then trade width for height only when it can pay off.' });

  let l = 0;
  let r = a.length - 1;
  let best = 0;
  yield t.note(2, { vars: { l, r, best }, note: 'Start at the widest possible pair.' });

  while (l < r) {
    const area = (r - l) * Math.min(a.num(l), a.num(r));
    yield t.compare(4, {
      i: l,
      j: r,
      vars: { l, r, area },
      note: `width ${r - l} × height ${Math.min(a.num(l), a.num(r))} = ${area}.`,
    });

    if (area > best) {
      best = area;
      yield t.found(5, { i: l, j: r, vars: { best }, note: `New best area: ${best}.` });
    }

    if (a.num(l) < a.num(r)) {
      yield t.read(6, {
        i: l,
        note: `The left wall (${a.num(l)}) is the shorter one — only moving it can help.`,
      });
      l++;
      yield t.note(6, { vars: { l } });
    } else {
      yield t.read(7, {
        i: r,
        note: `The right wall (${a.num(r)}) is no taller — move it in.`,
      });
      r--;
      yield t.note(7, { vars: { r } });
    }
  }

  yield t.note(9, {
    vars: { l: undefined, r: undefined, area: undefined, best },
    note: `Largest container: ${best}.`,
  });
}

export const containerWithMostWater: AlgorithmDef = {
  id: 'container-with-most-water',
  name: 'Container With Most Water',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'height', label: 'height', kind: 'numbers', placeholder: '1, 8, 6, 2, 5, 4, 8, 3, 7' },
  ],
  defaultInput: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
  run,
};
