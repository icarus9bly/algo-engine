import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function trap(height) {
  let l = 0, r = height.length - 1;
  let leftMax = height[l], rightMax = height[r], total = 0;
  while (l < r) {
    if (leftMax <= rightMax) {
      l++;
      leftMax = Math.max(leftMax, height[l]);
      total += leftMax - height[l];
    } else {
      r--;
      rightMax = Math.max(rightMax, height[r]);
      total += rightMax - height[r];
    }
  }
  return total;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const height = input.height as number[];

  const t = new Tracer();
  const a = t.array('height', height, 'height', ['l', 'r'], 'bars');

  yield t.note(1, {
    note: 'Water above a bar is set by the lower of the tallest walls on each side — so whichever side is shorter can be resolved right now.',
  });

  if (a.length === 0) {
    yield t.note(14, { vars: { result: 0 }, note: 'Nothing to hold water.' });
    return;
  }

  let l = 0;
  let r = a.length - 1;
  let leftMax = a.num(l);
  let rightMax = a.num(r);
  let total = 0;
  yield t.note(3, {
    indices: [l, r],
    vars: { l, r, leftMax, rightMax, total },
    note: 'Track the tallest wall seen from each end.',
  });

  while (l < r) {
    if (leftMax <= rightMax) {
      yield t.compare(5, {
        i: l,
        j: r,
        note: `The left wall (${leftMax}) is the shorter one, so the left side decides the water here.`,
      });
      l++;
      leftMax = Math.max(leftMax, a.num(l));
      const gained = leftMax - a.num(l);
      total += gained;
      yield t.read(8, {
        i: l,
        vars: { l, leftMax, total },
        note: gained > 0
          ? `Bar ${a.num(l)} sits ${gained} below the left wall of ${leftMax} — it holds ${gained}.`
          : `Bar ${a.num(l)} is the new left wall, so it holds nothing.`,
      });
    } else {
      yield t.compare(10, {
        i: l,
        j: r,
        note: `The right wall (${rightMax}) is the shorter one, so the right side decides the water here.`,
      });
      r--;
      rightMax = Math.max(rightMax, a.num(r));
      const gained = rightMax - a.num(r);
      total += gained;
      yield t.read(12, {
        i: r,
        vars: { r, rightMax, total },
        note: gained > 0
          ? `Bar ${a.num(r)} sits ${gained} below the right wall of ${rightMax} — it holds ${gained}.`
          : `Bar ${a.num(r)} is the new right wall, so it holds nothing.`,
      });
    }
  }

  yield t.note(15, {
    vars: { l: undefined, r: undefined, leftMax: undefined, rightMax: undefined, result: total },
    note: `${total} unit${total === 1 ? '' : 's'} of water trapped.`,
  });
}

export const trappingRainWater: AlgorithmDef = {
  id: 'trapping-rain-water',
  name: 'Trapping Rain Water',
  category: 'Two Pointers',
  code,
  inputFields: [
    { key: 'height', label: 'height', kind: 'numbers', placeholder: '0,1,0,2,1,0,1,3,2,1,2,1' },
  ],
  defaultInput: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
  run,
};
