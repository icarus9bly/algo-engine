import { Tracer, type TracedGrid } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function solveNQueens(n) {
  const res = [], board = blank(n);
  const cols = new Set(), diag = new Set(), anti = new Set();
  function dfs(r) {
    if (r === n) { res.push(render(board)); return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || diag.has(r - c) || anti.has(r + c)) continue;
      cols.add(c); diag.add(r - c); anti.add(r + c);
      board[r][c] = 'Q';
      dfs(r + 1);
      board[r][c] = '.';
      cols.delete(c); diag.delete(r - c); anti.delete(r + c);
    }
  }
  dfs(0);
  return res;
}`;

interface Guards {
  cols: Set<number>;
  diag: Set<number>;
  anti: Set<number>;
}

const shown = (s: Set<number>) => [...s].sort((a, b) => a - b).join(',') || '—';

/** Names the first rule that rules a square out, or null when it is safe. */
function conflict(g: Guards, r: number, c: number): string | null {
  if (g.cols.has(c)) return `a queen already owns column ${c}`;
  if (g.diag.has(r - c)) return `a queen already covers the ↘ diagonal r−c = ${r - c}`;
  if (g.anti.has(r + c)) return `a queen already covers the ↙ diagonal r+c = ${r + c}`;
  return null;
}

function* dfs(
  t: Tracer,
  board: TracedGrid,
  g: Guards,
  res: string[],
  n: number,
  r: number,
): Generator<AlgoEvent> {
  if (r === n) {
    const rows: string[] = [];
    for (let rr = 0; rr < n; rr++) {
      rows.push(board.cells.slice(rr * n, (rr + 1) * n).join(''));
    }
    res.push(rows.join('/'));
    yield t.found(5, {
      target: board,
      indices: board.allIndices().filter((idx) => board.cells[idx] === 'Q'),
      vars: { r, res: [...res] },
      note: `All ${n} queens are placed with none attacking another: ${rows.join(' / ')}.`,
    });
    return;
  }

  for (let c = 0; c < n; c++) {
    const why = conflict(g, r, c);
    if (why) {
      yield t.compare(7, {
        target: board,
        i: board.at(r, c),
        vars: { r, c },
        note: `Row ${r}, column ${c} is out: ${why}.`,
      });
      continue;
    }

    g.cols.add(c);
    g.diag.add(r - c);
    g.anti.add(r + c);
    yield t.writeCell(9, board, r, c, 'Q', {
      vars: { r, c, cols: shown(g.cols), diag: shown(g.diag), anti: shown(g.anti) },
      note:
        `Place a queen at row ${r}, column ${c}. One column and two diagonals are now spoken for, which is all ` +
        `a later row needs to check — no square is ever scanned.`,
    });

    yield* dfs(t, board, g, res, n, r + 1);

    g.cols.delete(c);
    g.diag.delete(r - c);
    g.anti.delete(r + c);
    yield t.writeCell(11, board, r, c, '.', {
      vars: { r, c, cols: shown(g.cols), diag: shown(g.diag), anti: shown(g.anti) },
      note: `Every arrangement with a queen at (${r},${c}) is explored — lift it and free its lines again.`,
    });
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = Number(input.n);
  if (!Number.isInteger(n) || n < 1) throw new Error('n must be a positive integer.');
  if (n > 6) throw new Error('Keep n at 6 or below so the search stays watchable.');

  const t = new Tracer();
  const board = t.grid(
    'board',
    Array.from({ length: n }, () => new Array(n).fill('.')),
    'board — one queen per row',
  );

  yield t.note(1, {
    target: board,
    note: 'Exactly one queen goes in each row, so the search only ever asks which column — never whether to place one.',
  });
  yield t.note(3, {
    target: board,
    note: 'Three sets remember the taken column and the two diagonals, so a square is checked in constant time.',
  });

  const g: Guards = { cols: new Set(), diag: new Set(), anti: new Set() };
  const res: string[] = [];
  yield* dfs(t, board, g, res, n, 0);

  yield t.note(16, {
    target: board,
    vars: { r: undefined, c: undefined, res: [...res], result: res.length },
    note: res.length === 0
      ? `No arrangement of ${n} queens on a ${n}×${n} board avoids every attack.`
      : `${res.length} solution${res.length === 1 ? '' : 's'} for ${n} queens.`,
  });
}

export const nQueens: AlgorithmDef = {
  id: 'n-queens',
  name: 'N Queens',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '4' }],
  defaultInput: { n: 4 },
  run,
};
