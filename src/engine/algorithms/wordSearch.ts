import { Tracer, type TracedGrid } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseGrid } from './grids';

const code = `function exist(board, word) {
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board[0].length; c++)
      if (dfs(r, c, 0)) return true;
  return false;
}

function dfs(r, c, i) {
  if (i === word.length) return true;
  if (!inBounds(r, c)) return false;
  if (board[r][c] !== word[i]) return false;
  const tmp = board[r][c];
  board[r][c] = '#';
  const found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1)
             || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
  board[r][c] = tmp;
  return found;
}`;

function* dfs(
  t: Tracer,
  g: TracedGrid,
  word: string,
  r: number,
  c: number,
  i: number,
): Generator<AlgoEvent, boolean> {
  if (i === word.length) {
    yield t.note(9, { vars: { i }, note: `Every letter of "${word}" has been matched.` });
    return true;
  }

  if (!g.inBounds(r, c)) {
    yield t.note(10, { vars: { r, c }, note: `(${r},${c}) is off the board.` });
    return false;
  }

  const here = String(g.value(r, c));
  const wanted = word[i];
  yield t.compare(11, {
    i: g.at(r, c),
    vars: { r, c, i, wanted },
    note: here === wanted
      ? `'${here}' matches letter ${i} of the word.`
      : here === '#'
        ? 'Already used on this path — a cell cannot be reused.'
        : `'${here}' is not the '${wanted}' we need.`,
  });

  if (here !== wanted) return false;

  yield t.writeCell(13, g, r, c, '#', {
    note: `Mark (${r},${c}) as in use while exploring from it.`,
  });

  let found = false;
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
    if (yield* dfs(t, g, word, r + dr, c + dc, i + 1)) {
      found = true;
      break;
    }
  }

  yield t.writeCell(16, g, r, c, here, {
    note: found
      ? `Keep ${here} — this path worked.`
      : `Restore ${here}; that branch failed, so free the cell for other paths.`,
  });

  return found;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseGrid(String(input.board ?? ''));
  checkSize(cells.length, cells[0]?.length ?? 0, 36);
  const word = String(input.word ?? '');
  if (word.length === 0) throw new Error('Give a word to search for.');

  const t = new Tracer();
  const g = t.grid('board', cells, 'board');

  yield t.note(1, {
    note: 'Try every starting cell; from each, walk the word one letter at a time and undo the marks on the way back.',
  });

  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      yield t.read(4, {
        i: g.at(r, c),
        vars: { r, c },
        note: `Try starting at (${r},${c}).`,
      });

      if (yield* dfs(t, g, word, r, c, 0)) {
        yield t.found(4, {
          i: g.at(r, c),
          vars: { result: true },
          note: `"${word}" can be spelled starting from (${r},${c}).`,
        });
        return;
      }
    }
  }

  yield t.note(5, {
    vars: { r: undefined, c: undefined, i: undefined, wanted: undefined, result: false },
    note: `"${word}" cannot be spelled anywhere on the board.`,
  });
}

export const wordSearch: AlgorithmDef = {
  id: 'word-search',
  name: 'Word Search',
  category: 'Backtracking',
  code,
  inputFields: [
    { key: 'board', label: 'board (rows via ;)', kind: 'text', placeholder: 'ABCE; SFCS; ADEE' },
    { key: 'word', label: 'word', kind: 'text', placeholder: 'ABCCED' },
  ],
  defaultInput: { board: 'ABCE; SFCS; ADEE', word: 'ABCCED' },
  run,
};
