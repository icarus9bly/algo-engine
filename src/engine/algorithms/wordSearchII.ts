import { Tracer, type TracedGraph, type TracedGrid } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { checkSize, parseGrid } from './grids';

const code = `function findWords(board, words) {
  const root = buildTrie(words);
  const found = new Set();
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      dfs(r, c, root, '');
  return [...found];
}

function dfs(r, c, node, path) {
  if (!inBounds(r, c)) return;
  const ch = board[r][c];
  const next = node.children[ch];
  if (ch === '#' || !next) return;
  path += ch;
  if (next.end) found.add(path);
  board[r][c] = '#';
  for (const [dr, dc] of DIRS) dfs(r + dr, c + dc, next, path);
  board[r][c] = ch;
}`;

interface Trie {
  children: Map<number, Map<string, number>>;
  ends: Set<number>;
}

function* dfs(
  t: Tracer,
  g: TracedGrid,
  graph: TracedGraph,
  trie: Trie,
  found: Set<string>,
  r: number,
  c: number,
  node: number,
  path: string,
): Generator<AlgoEvent> {
  if (!g.inBounds(r, c)) return;

  const ch = String(g.value(r, c));
  if (ch === '#') {
    yield t.compare(11, {
      target: g,
      i: g.at(r, c),
      note: `(${r},${c}) is already used on this path.`,
    });
    return;
  }

  const next = trie.children.get(node)!.get(ch);
  if (next === undefined) {
    yield t.compare(13, {
      target: g,
      i: g.at(r, c),
      note: `No word continues with '${ch}' after "${path}" — the trie prunes this branch immediately.`,
    });
    return;
  }

  const nextPath = path + ch;
  yield t.read(14, {
    target: graph,
    i: next,
    vars: { path: nextPath, r, c },
    note: `"${nextPath}" is still a live prefix.`,
  });

  if (trie.ends.has(next)) {
    found.add(nextPath);
    yield t.found(15, {
      target: g,
      i: g.at(r, c),
      vars: { found: [...found] },
      note: `"${nextPath}" is a complete word.`,
    });
  }

  yield t.writeCell(16, g, r, c, '#', { note: `Mark (${r},${c}) used while exploring onward.` });

  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
    yield* dfs(t, g, graph, trie, found, r + dr, c + dc, next, nextPath);
  }

  yield t.writeCell(18, g, r, c, ch, { note: `Restore '${ch}' at (${r},${c}) on the way back out.` });
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const cells = parseGrid(String(input.board ?? ''));
  checkSize(cells.length, cells[0]?.length ?? 0, 16);
  const words = (input.words as string[]) ?? [];
  if (words.join('').length > 24) throw new Error('Keep the total letters under 24.');

  const t = new Tracer();
  const g = t.grid('board', cells, 'board');
  const graph = t.graph('trie', 'trie of the words being looked for', true, 'tree', []);
  const root = graph.add('·');
  const trie: Trie = { children: new Map([[root, new Map()]]), ends: new Set() };

  yield t.note(1, {
    note: 'One trie of all the words lets a single walk of the board chase every word at once, and abandon dead prefixes early.',
  });

  for (const word of words) {
    let node = root;
    for (const ch of word) {
      const kids = trie.children.get(node)!;
      let nxt = kids.get(ch);
      if (nxt === undefined) {
        nxt = graph.add(ch);
        trie.children.set(nxt, new Map());
        kids.set(ch, nxt);
        yield t.connect(2, graph, node, nxt, { note: `Add '${ch}' for "${word}".` });
      }
      node = nxt;
    }
    trie.ends.add(node);
    graph.setValue(node, `${String(graph.value(node)).replace('*', '')}*`);
    yield t.emit('write', 2, { target: graph, i: node, note: `"${word}" ends here.` });
  }

  const found = new Set<string>();
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      yield t.read(5, {
        target: g,
        i: g.at(r, c),
        vars: { r, c },
        note: `Start a walk at (${r},${c}).`,
      });
      yield* dfs(t, g, graph, trie, found, r, c, root, '');
    }
  }

  yield t.note(7, {
    vars: { r: undefined, c: undefined, path: undefined, result: [...found] },
    note: found.size === 0
      ? 'None of the words appear on the board.'
      : `Found ${[...found].join(', ')}.`,
  });
}

export const wordSearchII: AlgorithmDef = {
  id: 'word-search-ii',
  name: 'Word Search II',
  category: 'Tries',
  code,
  inputFields: [
    { key: 'board', label: 'board (rows via ;)', kind: 'text', placeholder: 'oaan; etae; ihkr' },
    { key: 'words', label: 'words', kind: 'words', placeholder: 'oath, pea, eat, rain' },
  ],
  defaultInput: { board: 'oaan; etae; ihkr', words: ['oath', 'eat', 'rain'] },
  run,
};
