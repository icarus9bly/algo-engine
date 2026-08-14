import { Tracer, type TracedGrid } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseNumberGrid } from './grids';

const code = `function longestIncreasingPath(matrix) {
  const memo = blank(matrix);
  function dfs(r, c) {
    if (memo[r][c] > 0) return memo[r][c];
    let best = 1;
    for (const [nr, nc] of neighbours(r, c)) {
      if (matrix[nr][nc] <= matrix[r][c]) continue;
      best = Math.max(best, 1 + dfs(nr, nc));
    }
    memo[r][c] = best;
    return best;
  }
  let answer = 0;
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++)
      answer = Math.max(answer, dfs(r, c));
  return answer;
}`;

const STEPS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Walks uphill from one cell. The memo doubles as the "already solved" marker:
 * a cell is 0 until its answer is known, and every path length is at least 1.
 */
function* dfs(
  t: Tracer,
  matrix: TracedGrid,
  memo: TracedGrid,
  r: number,
  c: number,
): Generator<AlgoEvent, number> {
  const cached = memo.num(r, c);
  if (cached > 0) {
    yield t.read(4, {
      target: memo,
      i: memo.at(r, c),
      vars: { r, c },
      note: `(${r},${c}) was solved earlier — reuse ${cached} instead of walking it again.`,
    });
    return cached;
  }

  const here = matrix.num(r, c);
  yield t.read(5, {
    target: matrix,
    i: matrix.at(r, c),
    vars: { r, c },
    note: `Walk uphill from (${r},${c}), value ${here}. The cell on its own is already a path of length 1.`,
  });

  let best = 1;
  for (const [dr, dc] of STEPS) {
    const nr = r + dr;
    const nc = c + dc;
    if (!matrix.inBounds(nr, nc)) continue;

    const there = matrix.num(nr, nc);
    if (there <= here) {
      yield t.compare(7, {
        target: matrix,
        i: matrix.at(r, c),
        j: matrix.at(nr, nc),
        vars: { r, c },
        note: `${there} at (${nr},${nc}) is not above ${here} — the path cannot go that way.`,
      });
      continue;
    }

    yield t.compare(8, {
      target: matrix,
      i: matrix.at(r, c),
      j: matrix.at(nr, nc),
      vars: { r, c },
      note: `${there} at (${nr},${nc}) is higher than ${here} — the path can continue there.`,
    });

    const sub = yield* dfs(t, matrix, memo, nr, nc);
    best = Math.max(best, 1 + sub);
    yield t.note(8, {
      target: memo,
      i: memo.at(r, c),
      vars: { r, c },
      note: `Leaving through (${nr},${nc}) gives 1 + ${sub} = ${1 + sub}; the best from (${r},${c}) is now ${best}.`,
    });
  }

  yield t.writeCell(10, memo, r, c, best, {
    vars: { r, c },
    note: `(${r},${c}) is done: the longest increasing path starting here has length ${best}.`,
  });
  return best;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseNumberGrid(String(input.matrix ?? ''));
  const m = cells.length;
  const n = cells[0]?.length ?? 0;
  checkSize(m, n, 25);

  const t = new Tracer();
  const matrix = t.grid('matrix', cells, 'matrix — heights to climb');
  const memo = t.grid(
    'memo',
    Array.from({ length: m }, () => new Array(n).fill(0)),
    'memo — longest increasing path starting at this cell (0 = not solved yet)',
  );

  yield t.note(1, {
    target: matrix,
    note: 'A path may step to any of the four neighbours, but only to a strictly larger value.',
  });
  yield t.note(2, {
    target: memo,
    indices: memo.allIndices(),
    note: 'Each cell is solved once and remembered, which is what keeps the branching from exploding.',
  });

  let answer = 0;
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      const len = yield* dfs(t, matrix, memo, r, c);
      if (len > answer) {
        answer = len;
        yield t.found(16, {
          target: memo,
          i: memo.at(r, c),
          vars: { r, c, answer },
          note: `Starting at (${r},${c}) gives ${len} — the longest found so far.`,
        });
      }
    }
  }

  const winners = memo.allIndices().filter((i) => memo.cells[i] === answer);
  yield t.settle(17, memo, winners, {
    vars: { r: undefined, c: undefined, result: answer },
    note: `The longest increasing path has length ${answer}, starting from ${
      winners.length === 1 ? 'the marked cell' : `any of the ${winners.length} marked cells`
    }.`,
  });
}

export const longestIncreasingPath: AlgorithmDef = {
  id: 'longest-increasing-path-in-a-matrix',
  name: 'Longest Increasing Path In a Matrix',
  category: '2-D Dynamic Programming',
  code,
  inputFields: [{ key: 'matrix', label: 'matrix', kind: 'text', placeholder: '9,9,4; 6,6,8; 2,1,1' }],
  defaultInput: { matrix: '9,9,4; 6,6,8; 2,1,1' },
  run,
};
