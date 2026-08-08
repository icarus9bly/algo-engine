import { Tracer, type TracedGraph } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildGraph, parseEdges } from './graphs';

const code = `function cloneGraph(node) {
  const copies = new Map();
  function dfs(node) {
    if (copies.has(node)) return copies.get(node);
    const copy = new Node(node.val);
    copies.set(node, copy);
    for (const nb of node.neighbors)
      copy.neighbors.push(dfs(nb));
    return copy;
  }
  return node ? dfs(node) : null;
}`;

function* dfs(
  t: Tracer,
  src: TracedGraph,
  dst: TracedGraph,
  copies: Map<number, number>,
  node: number,
): Generator<AlgoEvent, number> {
  const existing = copies.get(node);
  if (existing !== undefined) {
    yield t.compare(4, {
      target: dst,
      i: existing,
      note: `Node ${src.value(node)} has already been copied — reuse it rather than copying twice.`,
    });
    return existing;
  }

  const copy = dst.add(src.value(node));
  copies.set(node, copy);
  yield t.emit('write', 6, {
    target: dst,
    i: copy,
    vars: { node, copies: copies.size },
    note: `Create a copy of node ${src.value(node)}.`,
  });

  for (const nb of src.edges(node)) {
    yield t.read(8, {
      target: src,
      i: node,
      j: nb,
      note: `Original node ${src.value(node)} links to ${src.value(nb)}.`,
    });
    const copiedNb = yield* dfs(t, src, dst, copies, nb);
    yield t.connect(9, dst, copy, copiedNb, {
      note: `Link the copies of ${src.value(node)} and ${src.value(nb)}.`,
    });
  }

  return copy;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  const edges = parseEdges(String(input.edges ?? ''));

  const t = new Tracer();
  const src = t.graph('original', 'original', false, 'circle', ['node']);
  buildGraph(src, n, edges);
  const dst = t.graph('clone', 'clone', false, 'circle', []);

  yield t.note(1, {
    note: 'The map from original to copy is what stops a cyclic graph from cloning forever.',
  });

  if (n === 0) {
    yield t.note(11, { note: 'Nothing to clone.' });
    return;
  }

  const copies = new Map<number, number>();
  yield* dfs(t, src, dst, copies, 0);

  yield t.settle(11, dst, dst.nodes.map((_, d) => d), {
    vars: { node: undefined, copies: copies.size },
    note: `Cloned all ${copies.size} nodes with their edges, sharing nothing with the original.`,
  });
}

export const cloneGraph: AlgorithmDef = {
  id: 'clone-graph',
  name: 'Clone Graph',
  category: 'Graphs',
  code,
  inputFields: [
    { key: 'n', label: 'n', kind: 'number', placeholder: '4' },
    { key: 'edges', label: 'edges', kind: 'text', placeholder: '0-1, 1-2, 2-3, 3-0' },
  ],
  defaultInput: { n: 4, edges: '0-1, 1-2, 2-3, 3-0' },
  run,
};
