import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseNumberGrid } from './grids';

const code = `function minPathSum(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (r === 0 && c === 0) dp[r][c] = grid[r][c];
      else if (r === 0) dp[r][c] = dp[r][c - 1] + grid[r][c];
      else if (c === 0) dp[r][c] = dp[r - 1][c] + grid[r][c];
      else dp[r][c] = Math.min(dp[r - 1][c], dp[r][c - 1]) + grid[r][c];
    }
  }
  return dp[m - 1][n - 1];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseNumberGrid(String(input.grid ?? ''));
  const m = cells.length;
  const n = cells[0]?.length ?? 0;
  checkSize(m, n, 36);

  const t = new Tracer();
  const board = t.grid('board', cells, 'board — the cost of stepping on each cell');
  const dp = t.grid(
    'dp',
    Array.from({ length: m }, () => new Array(n).fill(0)),
    'dp — cheapest total from the start to this cell',
  );

  yield t.note(1, {
    target: board,
    note: 'Only right and down moves are allowed, so a cell is entered from above or from the left.',
  });

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const cost = board.num(r, c);
      yield t.read(5, {
        target: board,
        i: board.at(r, c),
        vars: { r, c, cost },
        note: `Stepping on (${r},${c}) costs ${cost}.`,
      });

      if (r === 0 && c === 0) {
        yield t.writeCell(6, dp, 0, 0, cost, {
          note: `The start has no journey behind it, so it costs just its own ${cost}.`,
        });
        continue;
      }

      if (r === 0) {
        const left = dp.num(r, c - 1);
        yield t.writeCell(7, dp, r, c, left + cost, {
          note: `The top row can only be walked left to right: ${left} + ${cost} = ${left + cost}.`,
        });
        continue;
      }

      if (c === 0) {
        const up = dp.num(r - 1, c);
        yield t.writeCell(8, dp, r, c, up + cost, {
          note: `The first column can only be walked top to bottom: ${up} + ${cost} = ${up + cost}.`,
        });
        continue;
      }

      const up = dp.num(r - 1, c);
      const left = dp.num(r, c - 1);
      const best = Math.min(up, left);
      yield t.compare(9, {
        target: dp,
        i: dp.at(r - 1, c),
        j: dp.at(r, c - 1),
        note:
          `Arriving from above costs ${up}, from the left ${left} — ` +
          `take the cheaper ${best}.`,
      });
      yield t.writeCell(9, dp, r, c, best + cost, {
        note: `(${r},${c}) = ${best} + ${cost} = ${best + cost}.`,
      });
    }
  }

  const result = dp.num(m - 1, n - 1);
  yield t.settle(12, dp, [dp.at(m - 1, n - 1)], {
    vars: { r: undefined, c: undefined, cost: undefined, result },
    note: `The cheapest path to the bottom-right corner totals ${result}.`,
  });
}

export const minimumPathSum: AlgorithmDef = {
  id: 'minimum-path-sum',
  name: 'Minimum Path Sum',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [{ key: 'grid', label: 'grid', kind: 'text', placeholder: '1,3,1; 1,5,1; 4,2,1' }],
  defaultInput: { grid: '1,3,1; 1,5,1; 4,2,1' },
  run,
};
