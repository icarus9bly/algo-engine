import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseNumberGrid } from './grids';

const code = `function rotate(matrix) {
  let l = 0, r = matrix.length - 1;
  while (l < r) {
    for (let k = 0; k < r - l; k++) {
      const top = l, bottom = r;
      const tmp = matrix[top][l + k];
      matrix[top][l + k] = matrix[bottom - k][l];
      matrix[bottom - k][l] = matrix[bottom][r - k];
      matrix[bottom][r - k] = matrix[top + k][r];
      matrix[top + k][r] = tmp;
    }
    l++;
    r--;
  }
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseNumberGrid(String(input.matrix ?? ''));
  checkSize(cells.length, cells[0]?.length ?? 0);
  if (cells.length !== (cells[0]?.length ?? 0)) {
    throw new Error('Rotation in place needs a square matrix.');
  }

  const t = new Tracer();
  const g = t.grid('matrix', cells, 'matrix');

  yield t.note(1, {
    note: 'Rotate 90° clockwise in place by cycling four cells at a time, ring by ring.',
  });

  let l = 0;
  let r = g.rows - 1;

  while (l < r) {
    const ring: number[] = [];
    for (let k = l; k <= r; k++) {
      ring.push(g.at(l, k), g.at(r, k), g.at(k, l), g.at(k, r));
    }
    yield t.note(3, {
      indices: [...new Set(ring)],
      vars: { l, r },
      note: `Work the ring from ${l} to ${r}.`,
    });

    for (let k = 0; k < r - l; k++) {
      const top = l;
      const bottom = r;
      const corners = [
        g.at(top, l + k),
        g.at(bottom - k, l),
        g.at(bottom, r - k),
        g.at(top + k, r),
      ];
      yield t.compare(5, {
        indices: corners,
        vars: { k },
        note: 'These four cells trade places in one cycle.',
      });

      const tmp = g.num(top, l + k);
      yield t.writeCell(7, g, top, l + k, g.num(bottom - k, l), {
        note: `Bottom-left ${g.num(bottom - k, l)} moves to the top row.`,
      });
      yield t.writeCell(8, g, bottom - k, l, g.num(bottom, r - k), {
        note: `Bottom-right ${g.num(bottom, r - k)} moves to the left column.`,
      });
      yield t.writeCell(9, g, bottom, r - k, g.num(top + k, r), {
        note: `Top-right ${g.num(top + k, r)} moves to the bottom row.`,
      });
      yield t.writeCell(10, g, top + k, r, tmp, {
        note: `And the saved top-left ${tmp} lands on the right column.`,
      });
    }

    l++;
    r--;
    yield t.note(12, {
      vars: { l, r },
      note: l < r ? 'Move inward to the next ring.' : 'No rings left.',
    });
  }

  yield t.settle(15, g, g.allIndices(), {
    vars: { l: undefined, r: undefined, k: undefined },
    note: 'Rotated 90° clockwise, using no extra matrix.',
  });
}

export const rotateImage: AlgorithmDef = {
  id: 'rotate-image',
  name: 'Rotate Image',
  category: 'Math & Geometry',
  code,
  inputFields: [
    { key: 'matrix', label: 'matrix (rows via ;)', kind: 'text', placeholder: '1,2,3; 4,5,6; 7,8,9' },
  ],
  defaultInput: { matrix: '1,2,3; 4,5,6; 7,8,9' },
  run,
};
