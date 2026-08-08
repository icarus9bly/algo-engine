import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize } from './grids';

const code = `function uniquePaths(m, n) {
  const dp = Array.from({ length: m }, () => new Array(n).fill(1));
  for (let r = m - 2; r >= 0; r--) {
    for (let c = n - 2; c >= 0; c--) {
      dp[r][c] = dp[r + 1][c] + dp[r][c + 1];
    }
  }
  return dp[0][0];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const m = input.m as number;
  const n = input.n as number;
  if (!Number.isInteger(m) || !Number.isInteger(n) || m < 1 || n < 1) {
    throw new Error('m and n must be positive integers.');
  }
  checkSize(m, n, 49);

  const t = new Tracer();
  const dp = t.grid(
    'dp',
    Array.from({ length: m }, () => new Array(n).fill(1)),
    'dp — paths from this cell to the goal',
  );

  yield t.note(1, {
    note: 'Only right and down moves are allowed, so a cell equals the cell below plus the cell to its right.',
  });
  yield t.note(2, {
    indices: dp.allIndices(),
    note: 'The last row and last column each have exactly one path: straight along the edge.',
  });

  for (let r = m - 2; r >= 0; r--) {
    for (let c = n - 2; c >= 0; c--) {
      const below = dp.num(r + 1, c);
      const rightOf = dp.num(r, c + 1);
      yield t.compare(5, {
        i: dp.at(r + 1, c),
        j: dp.at(r, c + 1),
        vars: { r, c },
        note: `Below has ${below} paths, right has ${rightOf}.`,
      });
      yield t.writeCell(5, dp, r, c, below + rightOf, {
        note: `(${r},${c}) = ${below} + ${rightOf} = ${below + rightOf}.`,
      });
    }
  }

  const result = dp.num(0, 0);
  yield t.settle(8, dp, [dp.at(0, 0)], {
    vars: { r: undefined, c: undefined, result },
    note: `${result} distinct path${result === 1 ? '' : 's'} from the top-left corner.`,
  });
}

export const uniquePaths: AlgorithmDef = {
  id: 'unique-paths',
  name: 'Unique Paths',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'm', label: 'rows', kind: 'number', placeholder: '3' },
    { key: 'n', label: 'cols', kind: 'number', placeholder: '7' },
  ],
  defaultInput: { m: 3, n: 7 },
  run,
};
