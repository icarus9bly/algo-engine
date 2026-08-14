import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseNumberGrid } from './grids';

const code = `function uniquePathsWithObstacles(grid) {
  const m = grid.length, n = grid[0].length;
  const dp = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 1) { dp[r][c] = 0; continue; }
      if (r === 0 && c === 0) { dp[r][c] = 1; continue; }
      const up = r > 0 ? dp[r - 1][c] : 0;
      const left = c > 0 ? dp[r][c - 1] : 0;
      dp[r][c] = up + left;
    }
  }
  return dp[m - 1][n - 1];
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseNumberGrid(String(input.grid ?? ''));
  const m = cells.length;
  const n = cells[0]?.length ?? 0;
  checkSize(m, n, 36);
  if (cells.some((row) => row.some((v) => v !== 0 && v !== 1))) {
    throw new Error('Every cell must be 0 (open) or 1 (obstacle).');
  }

  const t = new Tracer();
  const board = t.grid('board', cells, 'board — 1 is an obstacle');
  const dp = t.grid(
    'dp',
    Array.from({ length: m }, () => new Array(n).fill(0)),
    'dp — paths from the start to this cell',
  );

  yield t.note(1, {
    target: board,
    note: 'Only right and down moves are allowed, so a cell is reached from above or from the left.',
  });
  yield t.note(3, {
    target: dp,
    indices: dp.allIndices(),
    note: 'Every cell starts at 0 paths. Unlike the obstacle-free version, no row or column is free.',
  });

  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (board.num(r, c) === 1) {
        yield t.writeCell(6, dp, r, c, 0, {
          vars: { r, c },
          note: `(${r},${c}) is blocked — no path can stand here, so it stays at 0.`,
        });
        continue;
      }

      if (r === 0 && c === 0) {
        yield t.writeCell(7, dp, 0, 0, 1, {
          vars: { r, c },
          note: 'The start is reached by exactly one path: the empty one.',
        });
        continue;
      }

      const up = r > 0 ? dp.num(r - 1, c) : 0;
      const left = c > 0 ? dp.num(r, c - 1) : 0;
      yield t.compare(8, {
        target: dp,
        i: r > 0 ? dp.at(r - 1, c) : undefined,
        j: c > 0 ? dp.at(r, c - 1) : undefined,
        vars: { r, c },
        note:
          `${up} path${up === 1 ? '' : 's'} arrive from above, ` +
          `${left} from the left${r === 0 || c === 0 ? ' (off the board counts as 0)' : ''}.`,
      });
      yield t.writeCell(10, dp, r, c, up + left, {
        note: `(${r},${c}) = ${up} + ${left} = ${up + left}.`,
      });
    }
  }

  const result = dp.num(m - 1, n - 1);
  yield t.settle(13, dp, [dp.at(m - 1, n - 1)], {
    vars: { r: undefined, c: undefined, result },
    note:
      result === 0
        ? 'The obstacles seal the goal off — no path reaches it.'
        : `${result} distinct path${result === 1 ? '' : 's'} reach the bottom-right corner.`,
  });
}

export const uniquePathsII: AlgorithmDef = {
  id: 'unique-paths-ii',
  name: 'Unique Paths II',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [
    { key: 'grid', label: 'grid (1 = obstacle)', kind: 'text', placeholder: '0,0,0; 0,1,0; 0,0,0' },
  ],
  defaultInput: { grid: '0,0,0; 0,1,0; 0,0,0' },
  run,
};
