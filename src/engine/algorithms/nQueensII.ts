import { Tracer, type TracedGrid } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function totalNQueens(n) {
  let count = 0;
  const board = blank(n);
  const cols = new Set(), diag = new Set(), anti = new Set();
  function dfs(r) {
    if (r === n) { count++; return; }
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
  return count;
}`;

interface State {
  cols: Set<number>;
  diag: Set<number>;
  anti: Set<number>;
  count: number;
}

const shown = (s: Set<number>) => [...s].sort((a, b) => a - b).join(',') || '—';

/** Names the first rule that rules a square out, or null when it is safe. */
function conflict(g: State, r: number, c: number): string | null {
  if (g.cols.has(c)) return `column ${c} is taken`;
  if (g.diag.has(r - c)) return `the ↘ diagonal r−c = ${r - c} is covered`;
  if (g.anti.has(r + c)) return `the ↙ diagonal r+c = ${r + c} is covered`;
  return null;
}

function* dfs(
  t: Tracer,
  board: TracedGrid,
  g: State,
  n: number,
  r: number,
): Generator<AlgoEvent> {
  if (r === n) {
    g.count++;
    yield t.found(6, {
      target: board,
      indices: board.allIndices().filter((idx) => board.cells[idx] === 'Q'),
      vars: { r, count: g.count },
      note: `A safe arrangement — that makes ${g.count}. Only the tally is kept; the board itself is not recorded.`,
    });
    return;
  }

  for (let c = 0; c < n; c++) {
    const why = conflict(g, r, c);
    if (why) {
      yield t.compare(8, {
        target: board,
        i: board.at(r, c),
        vars: { r, c },
        note: `Row ${r}, column ${c} is out — ${why}.`,
      });
      continue;
    }

    g.cols.add(c);
    g.diag.add(r - c);
    g.anti.add(r + c);
    yield t.writeCell(10, board, r, c, 'Q', {
      vars: { r, c, cols: shown(g.cols), diag: shown(g.diag), anti: shown(g.anti) },
      note: `Place a queen at row ${r}, column ${c}, claiming its column and both diagonals.`,
    });

    yield* dfs(t, board, g, n, r + 1);

    g.cols.delete(c);
    g.diag.delete(r - c);
    g.anti.delete(r + c);
    yield t.writeCell(12, board, r, c, '.', {
      vars: { r, c, cols: shown(g.cols), diag: shown(g.diag), anti: shown(g.anti) },
      note: `Lift the queen from (${r},${c}) and free its lines again.`,
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
    'board — shown to make the search visible, though the answer is only a count',
  );

  yield t.note(1, {
    target: board,
    note: 'The same search as N Queens, with one difference: reaching the last row increments a counter instead of saving a board.',
  });
  yield t.note(4, {
    target: board,
    note: 'A column and two diagonals are all a square can be attacked along, so three sets decide safety in constant time.',
  });

  const g: State = { cols: new Set(), diag: new Set(), anti: new Set(), count: 0 };
  yield* dfs(t, board, g, n, 0);

  yield t.note(17, {
    target: board,
    vars: { r: undefined, c: undefined, result: g.count },
    note: g.count === 0
      ? `No arrangement of ${n} queens on a ${n}×${n} board avoids every attack.`
      : `${g.count} distinct solution${g.count === 1 ? '' : 's'} for ${n} queens.`,
  });
}

export const nQueensII: AlgorithmDef = {
  id: 'n-queens-ii',
  name: 'N Queens II',
  category: 'Backtracking',
  code,
  inputFields: [{ key: 'n', label: 'n', kind: 'number', placeholder: '4' }],
  defaultInput: { n: 4 },
  run,
};
