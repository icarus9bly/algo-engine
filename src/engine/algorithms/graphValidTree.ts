import { Tracer, type TracedGraph } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildGraph, parseEdges } from './graphs';

const code = `function validTree(n, edges) {
  if (edges.length !== n - 1) return false;
  const seen = new Set();
  dfs(0, -1);
  return seen.size === n;
}

function dfs(node, parent) {
  if (seen.has(node)) return;
  seen.add(node);
  for (const next of graph[node])
    if (next !== parent) dfs(next, node);
}`;

function* dfs(
  t: Tracer,
  g: TracedGraph,
  seen: Set<number>,
  node: number,
  parent: number,
): Generator<AlgoEvent> {
  seen.add(node);
  yield t.emit('read', 10, {
    target: g,
    i: node,
    vars: { node, seen: [...seen] },
    note: `Reached node ${node}.`,
  });

  for (const next of g.neighbours(node)) {
    if (next === parent) {
      yield t.compare(13, {
        target: g,
        i: node,
        j: next,
        note: `Node ${next} is where we came from — that is not a cycle.`,
      });
      continue;
    }
    if (seen.has(next)) {
      yield t.compare(13, {
        target: g,
        i: node,
        j: next,
        note: `Node ${next} was already reached by another route — that is a cycle.`,
      });
      continue;
    }
    yield t.read(13, {
      target: g,
      i: node,
      j: next,
      note: `Walk the edge ${node}–${next}.`,
    });
    yield* dfs(t, g, seen, next, node);
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  const edges = parseEdges(String(input.edges ?? ''));

  const t = new Tracer();
  const g = t.graph('graph', 'graph', false, 'circle', ['node']);
  buildGraph(g, n, edges);

  yield t.note(1, {
    note: 'A tree is exactly a connected graph with n − 1 edges: too few and it is split, too many and it loops.',
  });

  if (edges.length !== n - 1) {
    yield t.note(2, {
      vars: { edges: edges.length, needed: n - 1, result: false },
      note: `${edges.length} edge${edges.length === 1 ? '' : 's'} for ${n} nodes, but a tree needs exactly ${n - 1}.`,
    });
    return;
  }

  yield t.note(2, {
    vars: { edges: edges.length, needed: n - 1 },
    note: `${edges.length} edges for ${n} nodes is the right count — now check it is all one piece.`,
  });

  const seen = new Set<number>();
  if (n > 0) yield* dfs(t, g, seen, 0, -1);

  const connected = seen.size === n;
  yield t.settle(4, g, connected ? g.nodes.map((_, d) => d) : [...seen], {
    vars: { node: undefined, result: connected },
    note: connected
      ? 'One walk reached every node, so it is connected and acyclic — a valid tree.'
      : `Only ${seen.size} of ${n} nodes were reachable, so the graph is in pieces.`,
  });
}

export const graphValidTree: AlgorithmDef = {
  id: 'graph-valid-tree',
  name: 'Graph Valid Tree',
  category: 'Graphs',
  code,
  inputFields: [
    { key: 'n', label: 'n', kind: 'number', placeholder: '5' },
    { key: 'edges', label: 'edges', kind: 'text', placeholder: '0-1, 0-2, 0-3, 1-4' },
  ],
  defaultInput: { n: 5, edges: '0-1, 0-2, 0-3, 1-4' },
  run,
};
