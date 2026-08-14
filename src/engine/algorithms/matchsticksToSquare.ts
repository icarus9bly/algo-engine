import { Tracer, type TracedArray } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function makesquare(sticks) {
  const total = sum(sticks);
  if (total % 4 !== 0) return false;
  const side = total / 4;
  sticks.sort((a, b) => b - a);
  if (sticks[0] > side) return false;
  const sides = [0, 0, 0, 0];
  function dfs(i) {
    if (i === sticks.length) return true;
    for (let s = 0; s < 4; s++) {
      if (sides[s] + sticks[i] > side) continue;
      if (s > 0 && sides[s] === sides[s - 1]) continue;
      sides[s] += sticks[i];
      if (dfs(i + 1)) return true;
      sides[s] -= sticks[i];
    }
    return false;
  }
  return dfs(0);
}`;

function* dfs(
  t: Tracer,
  sticks: TracedArray,
  sides: TracedArray,
  side: number,
  i: number,
): Generator<AlgoEvent, boolean> {
  if (i === sticks.length) {
    yield t.found(9, {
      target: sides,
      indices: [0, 1, 2, 3],
      vars: { i },
      note: `Every stick is placed and all four sides measure ${side} — that is a square.`,
    });
    return true;
  }

  const stick = sticks.num(i);

  for (let s = 0; s < 4; s++) {
    if (sides.num(s) + stick > side) {
      yield t.compare(11, {
        target: sides,
        i: s,
        vars: { i, s },
        note: `Side ${s} is at ${sides.num(s)}; adding ${stick} would overshoot ${side}.`,
      });
      continue;
    }

    if (s > 0 && sides.num(s) === sides.num(s - 1)) {
      yield t.compare(12, {
        target: sides,
        i: s,
        j: s - 1,
        vars: { i, s },
        note:
          `Side ${s} is the same length as side ${s - 1}, which already refused this stick. Trying it here would ` +
          `re-explore an identical position, so skip it.`,
      });
      continue;
    }

    yield t.write(13, sides, s, sides.num(s) + stick, {
      vars: { i, s },
      note: `Lay the ${stick} on side ${s}, bringing it to ${sides.num(s) + stick} of ${side}.`,
    });

    if (yield* dfs(t, sticks, sides, side, i + 1)) return true;

    yield t.write(15, sides, s, sides.num(s) - stick, {
      vars: { i, s },
      note: `That led nowhere — take the ${stick} back off side ${s}.`,
    });
  }

  yield t.note(17, {
    target: sticks,
    i,
    vars: { i },
    note: `The ${stick} fits on no side from here, so this arrangement fails.`,
  });
  return false;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = [...((input.sticks as number[]) ?? [])].sort((a, b) => b - a);
  if (values.length === 0) throw new Error('Give at least one matchstick.');
  if (values.length > 8) throw new Error('Keep it to 8 matchsticks or fewer so the search stays watchable.');
  if (values.some((v) => !Number.isInteger(v) || v <= 0)) {
    throw new Error('Every matchstick must be a positive integer.');
  }

  const t = new Tracer();
  const sticks = t.array('sticks', values, 'sticks — longest first', ['i']);
  const sides = t.array('sides', [0, 0, 0, 0], 'sides — the four sides being built', ['s']);

  const total = values.reduce((acc, v) => acc + v, 0);
  t.setVars({ total });

  yield t.note(2, {
    target: sticks,
    indices: values.map((_, d) => d),
    note: `The sticks measure ${total} in total.`,
  });

  if (total % 4 !== 0) {
    yield t.note(3, {
      target: sticks,
      vars: { result: false },
      note: `${total} does not divide into four equal sides, so no square is possible.`,
    });
    return;
  }

  const side = total / 4;
  t.setVars({ side });

  yield t.note(4, {
    target: sides,
    indices: [0, 1, 2, 3],
    note: `Each side must come to ${total} ÷ 4 = ${side}. Sticks cannot be broken, so every one lands on exactly one side.`,
  });
  yield t.note(5, {
    target: sticks,
    note: 'Longest first, because a stick that cannot be placed should fail as early as possible rather than after a long descent.',
  });

  if (values[0] > side) {
    yield t.note(6, {
      target: sticks,
      i: 0,
      vars: { result: false },
      note: `The longest stick is ${values[0]}, already longer than a side of ${side}.`,
    });
    return;
  }

  const result = yield* dfs(t, sticks, sides, side, 0);

  yield t.note(19, {
    target: sides,
    indices: [0, 1, 2, 3],
    vars: { i: undefined, s: undefined, result },
    note: result
      ? `The matchsticks form a square with sides of ${side}.`
      : 'No arrangement puts the sticks into four equal sides.',
  });
}

export const matchsticksToSquare: AlgorithmDef = {
  id: 'matchsticks-to-square',
  name: 'Matchsticks to Square',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'sticks', label: 'matchsticks', kind: 'numbers', placeholder: '1, 1, 2, 2, 2' }],
  defaultInput: { sticks: [1, 1, 2, 2, 2] },
  run,
};
