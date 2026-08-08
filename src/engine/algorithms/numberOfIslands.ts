import { Tracer, type TracedGrid } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseGrid } from './grids';

const code = `function numIslands(grid) {
  let count = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] === '1') {
        count++;
        flood(grid, r, c);
      }
    }
  }
  return count;
}

function flood(grid, r, c) {
  if (!inBounds(r, c) || grid[r][c] !== '1') return;
  grid[r][c] = '0';
  flood(grid, r + 1, c);
  flood(grid, r - 1, c);
  flood(grid, r, c + 1);
  flood(grid, r, c - 1);
}`;

function* flood(
  t: Tracer,
  g: TracedGrid,
  r: number,
  c: number,
): Generator<AlgoEvent> {
  if (!g.inBounds(r, c)) {
    yield t.note(15, { note: `(${r},${c}) is off the grid.` });
    return;
  }

  if (g.value(r, c) !== '1') {
    yield t.compare(15, {
      i: g.at(r, c),
      note: `(${r},${c}) is water or already claimed — stop here.`,
    });
    return;
  }

  yield t.writeCell(16, g, r, c, '0', {
    vars: { r, c },
    note: `Claim (${r},${c}) for this island by sinking it.`,
  });

  yield* flood(t, g, r + 1, c);
  yield* flood(t, g, r - 1, c);
  yield* flood(t, g, r, c + 1);
  yield* flood(t, g, r, c - 1);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseGrid(String(input.grid ?? ''));
  checkSize(cells.length, cells[0]?.length ?? 0, 48);

  const t = new Tracer();
  const g = t.grid('grid', cells, "grid — '1' is land");

  yield t.note(1, {
    note: 'Each time an unclaimed piece of land turns up, count one island and sink everything connected to it.',
  });

  let count = 0;
  yield t.note(2, { vars: { count }, note: 'No islands found yet.' });

  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const isLand = g.value(r, c) === '1';
      yield t.read(5, {
        i: g.at(r, c),
        vars: { r, c },
        note: isLand
          ? `(${r},${c}) is land nobody has claimed.`
          : `(${r},${c}) is water or already sunk.`,
      });

      if (isLand) {
        count++;
        yield t.found(6, {
          i: g.at(r, c),
          vars: { count },
          note: `Island number ${count} starts here.`,
        });
        yield* flood(t, g, r, c);
      }
    }
  }

  yield t.note(11, {
    vars: { r: undefined, c: undefined, count, result: count },
    note: `${count} island${count === 1 ? '' : 's'}. The grid is now all water — sinking is what stops the count double-counting.`,
  });
}

export const numberOfIslands: AlgorithmDef = {
  id: 'number-of-islands',
  name: 'Number of Islands',
  category: 'Graphs',
  code,
  inputFields: [
    { key: 'grid', label: 'grid (rows via ;)', kind: 'text', placeholder: '11000; 11000; 00100; 00011' },
  ],
  defaultInput: { grid: '11000; 11000; 00100; 00011' },
  run,
};
