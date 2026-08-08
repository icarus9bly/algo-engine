import { Tracer, type TracedGrid } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseNumberGrid } from './grids';

const code = `function pacificAtlantic(heights) {
  const pac = new Set(), atl = new Set();
  for (let c = 0; c < cols; c++) {
    dfs(0, c, pac, heights[0][c]);
    dfs(rows - 1, c, atl, heights[rows - 1][c]);
  }
  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pac, heights[r][0]);
    dfs(r, cols - 1, atl, heights[r][cols - 1]);
  }
  return cells present in both sets;
}

function dfs(r, c, seen, prev) {
  if (!inBounds(r, c) || seen.has(r, c)) return;
  if (heights[r][c] < prev) return;
  seen.add(r, c);
  for (const [dr, dc] of DIRS) dfs(r + dr, c + dc, seen, heights[r][c]);
}`;

type Ocean = 'P' | 'A';

/** Marks which oceans a cell drains to: '', 'P', 'A' or 'PA'. */
function mark(current: string, ocean: Ocean): string {
  if (current.includes(ocean)) return current;
  return current === '·' ? ocean : 'PA';
}

function* dfs(
  t: Tracer,
  g: TracedGrid,
  reach: TracedGrid,
  ocean: Ocean,
  r: number,
  c: number,
  prev: number,
): Generator<AlgoEvent> {
  if (!g.inBounds(r, c)) return;

  const current = String(reach.value(r, c));
  if (current.includes(ocean)) {
    yield t.compare(15, {
      target: reach,
      i: reach.at(r, c),
      note: `(${r},${c}) already drains to the ${ocean === 'P' ? 'Pacific' : 'Atlantic'}.`,
    });
    return;
  }

  if (g.num(r, c) < prev) {
    yield t.compare(16, {
      target: g,
      i: g.at(r, c),
      note: `Height ${g.num(r, c)} is below ${prev} — water cannot climb up to here.`,
    });
    return;
  }

  yield t.writeCell(17, reach, r, c, mark(current, ocean), {
    vars: { r, c },
    note: `Water at (${r},${c}) can reach the ${ocean === 'P' ? 'Pacific' : 'Atlantic'}.`,
  });

  const here = g.num(r, c);
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
    yield* dfs(t, g, reach, ocean, r + dr, c + dc, here);
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseNumberGrid(String(input.heights ?? ''));
  checkSize(cells.length, cells[0]?.length ?? 0, 30);

  const t = new Tracer();
  const g = t.grid('heights', cells, 'heights');
  const reach = t.grid(
    'reach',
    cells.map((row) => row.map(() => '·')),
    'reach — P, A or PA',
  );

  yield t.note(1, {
    note: 'Rather than tracing every cell downhill, start at each ocean edge and walk uphill — the reverse of the flow.',
  });

  for (let c = 0; c < g.cols; c++) {
    yield t.note(4, {
      target: g,
      i: g.at(0, c),
      note: `The top edge touches the Pacific at column ${c}.`,
    });
    yield* dfs(t, g, reach, 'P', 0, c, g.num(0, c));

    yield t.note(5, {
      target: g,
      i: g.at(g.rows - 1, c),
      note: `The bottom edge touches the Atlantic at column ${c}.`,
    });
    yield* dfs(t, g, reach, 'A', g.rows - 1, c, g.num(g.rows - 1, c));
  }

  for (let r = 0; r < g.rows; r++) {
    yield t.note(8, {
      target: g,
      i: g.at(r, 0),
      note: `The left edge touches the Pacific at row ${r}.`,
    });
    yield* dfs(t, g, reach, 'P', r, 0, g.num(r, 0));

    yield t.note(9, {
      target: g,
      i: g.at(r, g.cols - 1),
      note: `The right edge touches the Atlantic at row ${r}.`,
    });
    yield* dfs(t, g, reach, 'A', r, g.cols - 1, g.num(r, g.cols - 1));
  }

  const both: number[] = [];
  const coords: string[] = [];
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      if (reach.value(r, c) === 'PA') {
        both.push(reach.at(r, c));
        coords.push(`(${r},${c})`);
      }
    }
  }

  yield t.settle(11, reach, both, {
    vars: { r: undefined, c: undefined, result: coords },
    note: `${both.length} cell${both.length === 1 ? '' : 's'} drain to both oceans: ${coords.join(' ') || 'none'}.`,
  });
}

export const pacificAtlantic: AlgorithmDef = {
  id: 'pacific-atlantic',
  name: 'Pacific Atlantic Water Flow',
  category: 'Graphs',
  code,
  inputFields: [
    { key: 'heights', label: 'heights (rows via ;)', kind: 'text', placeholder: '1,2,3; 8,9,4; 7,6,5' },
  ],
  defaultInput: { heights: '1,2,3; 8,9,4; 7,6,5' },
  run,
};
