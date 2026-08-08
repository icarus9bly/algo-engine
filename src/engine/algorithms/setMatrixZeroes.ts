import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseNumberGrid } from './grids';

const code = `function setZeroes(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  let firstRowZero = false;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[0][c] = 0;
        if (r > 0) matrix[r][0] = 0;
        else firstRowZero = true;
      }
    }
  }
  for (let r = 1; r < rows; r++)
    for (let c = 1; c < cols; c++)
      if (matrix[0][c] === 0 || matrix[r][0] === 0) matrix[r][c] = 0;
  if (matrix[0][0] === 0)
    for (let r = 0; r < rows; r++) matrix[r][0] = 0;
  if (firstRowZero)
    for (let c = 0; c < cols; c++) matrix[0][c] = 0;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseNumberGrid(String(input.matrix ?? ''));
  checkSize(cells.length, cells[0]?.length ?? 0);

  const t = new Tracer();
  const g = t.grid('matrix', cells, 'matrix');

  yield t.note(1, {
    note: 'Use the first row and column as the bookkeeping, so no extra space is needed.',
  });

  let firstRowZero = false;
  yield t.note(3, { vars: { firstRowZero }, note: 'The first row needs its own flag, since cell (0,0) is shared.' });

  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      yield t.read(6, {
        i: g.at(r, c),
        vars: { r, c },
        note: `(${r},${c}) holds ${g.value(r, c)}.`,
      });

      if (g.num(r, c) === 0) {
        yield t.writeCell(7, g, 0, c, 0, {
          note: `Mark column ${c} in the top row.`,
        });
        if (r > 0) {
          yield t.writeCell(8, g, r, 0, 0, { note: `Mark row ${r} in the left column.` });
        } else {
          firstRowZero = true;
          yield t.note(9, {
            i: g.at(0, c),
            vars: { firstRowZero },
            note: 'The zero is in the first row itself — remember that separately.',
          });
        }
      }
    }
  }

  for (let r = 1; r < g.rows; r++) {
    for (let c = 1; c < g.cols; c++) {
      const marked = g.num(0, c) === 0 || g.num(r, 0) === 0;
      yield t.compare(15, {
        i: g.at(r, c),
        indices: [g.at(0, c), g.at(r, 0)],
        vars: { r, c },
        note: marked
          ? `Row ${r} or column ${c} is marked, so this cell clears.`
          : `Neither marker is set — (${r},${c}) survives.`,
      });
      if (marked) {
        yield t.writeCell(15, g, r, c, 0, { note: `Zero out (${r},${c}).` });
      }
    }
  }

  if (g.num(0, 0) === 0) {
    yield t.note(16, { i: g.at(0, 0), note: 'Cell (0,0) is marked, so the whole left column clears.' });
    for (let r = 0; r < g.rows; r++) {
      yield t.writeCell(17, g, r, 0, 0, { note: `Zero out (${r},0).` });
    }
  }

  if (firstRowZero) {
    yield t.note(18, { note: 'The saved flag says the first row had a zero of its own.' });
    for (let c = 0; c < g.cols; c++) {
      yield t.writeCell(19, g, 0, c, 0, { note: `Zero out (0,${c}).` });
    }
  }

  yield t.settle(20, g, g.allIndices(), {
    vars: { r: undefined, c: undefined, firstRowZero: undefined },
    note: 'Every row and column containing a zero has been cleared.',
  });
}

export const setMatrixZeroes: AlgorithmDef = {
  id: 'set-matrix-zeroes',
  name: 'Set Matrix Zeroes',
  category: 'Math & Geometry',
  code,
  inputFields: [
    { key: 'matrix', label: 'matrix (rows via ;)', kind: 'text', placeholder: '1,1,1; 1,0,1; 1,1,1' },
  ],
  defaultInput: { matrix: '1,1,1; 1,0,1; 1,1,1' },
  run,
};
