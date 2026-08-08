import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseNumberGrid } from './grids';

const code = `function spiralOrder(matrix) {
  const res = [];
  let top = 0, bottom = matrix.length;
  let left = 0, right = matrix[0].length;
  while (left < right && top < bottom) {
    for (let c = left; c < right; c++) res.push(matrix[top][c]);
    top++;
    for (let r = top; r < bottom; r++) res.push(matrix[r][right - 1]);
    right--;
    if (!(left < right && top < bottom)) break;
    for (let c = right - 1; c >= left; c--) res.push(matrix[bottom - 1][c]);
    bottom--;
    for (let r = bottom - 1; r >= top; r--) res.push(matrix[r][left]);
    left++;
  }
  return res;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseNumberGrid(String(input.matrix ?? ''));
  checkSize(cells.length, cells[0]?.length ?? 0);

  const t = new Tracer();
  const g = t.grid('matrix', cells, 'matrix');
  const out = t.array('res', [], 'res', []);

  yield t.note(1, {
    note: 'Peel the matrix one edge at a time, shrinking the boundary after each pass.',
  });

  let top = 0;
  let bottom = g.rows;
  let left = 0;
  let right = g.cols;
  yield t.note(3, {
    vars: { top, bottom, left, right },
    note: 'Four boundaries mark the un-visited rectangle.',
  });

  while (left < right && top < bottom) {
    for (let c = left; c < right; c++) {
      yield t.read(6, { i: g.at(top, c), note: `Along the top: ${g.value(top, c)}.` });
      yield t.push(6, out, g.num(top, c), { note: `Collected ${g.value(top, c)}.` });
    }
    top++;
    yield t.note(7, { vars: { top }, note: 'The top row is done — pull the boundary down.' });

    for (let r = top; r < bottom; r++) {
      yield t.read(8, { i: g.at(r, right - 1), note: `Down the right: ${g.value(r, right - 1)}.` });
      yield t.push(8, out, g.num(r, right - 1), { note: `Collected ${g.value(r, right - 1)}.` });
    }
    right--;
    yield t.note(9, { vars: { right }, note: 'The right column is done — pull the boundary in.' });

    if (!(left < right && top < bottom)) {
      yield t.note(10, { note: 'The rectangle has closed up — stop before re-reading cells.' });
      break;
    }

    for (let c = right - 1; c >= left; c--) {
      yield t.read(11, { i: g.at(bottom - 1, c), note: `Back along the bottom: ${g.value(bottom - 1, c)}.` });
      yield t.push(11, out, g.num(bottom - 1, c), { note: `Collected ${g.value(bottom - 1, c)}.` });
    }
    bottom--;
    yield t.note(12, { vars: { bottom }, note: 'The bottom row is done — raise the boundary.' });

    for (let r = bottom - 1; r >= top; r--) {
      yield t.read(13, { i: g.at(r, left), note: `Up the left: ${g.value(r, left)}.` });
      yield t.push(13, out, g.num(r, left), { note: `Collected ${g.value(r, left)}.` });
    }
    left++;
    yield t.note(14, { vars: { left }, note: 'The left column is done — push the boundary right.' });
  }

  yield t.settle(16, out, out.values.map((_, d) => d), {
    vars: { top: undefined, bottom: undefined, left: undefined, right: undefined },
    note: `Spiral order: ${out.values.join(', ')}.`,
  });
}

export const spiralMatrix: AlgorithmDef = {
  id: 'spiral-matrix',
  name: 'Spiral Matrix',
  category: 'Math & Geometry',
  code,
  inputFields: [
    { key: 'matrix', label: 'matrix (rows via ;)', kind: 'text', placeholder: '1,2,3,4; 5,6,7,8; 9,10,11,12' },
  ],
  defaultInput: { matrix: '1,2,3,4; 5,6,7,8; 9,10,11,12' },
  run,
};
