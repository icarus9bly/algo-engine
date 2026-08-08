import { Tracer, type TracedArray, type TracedGraph } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildGraph, parseEdges } from './graphs';

const code = `function countComponents(n, edges) {
  const graph = buildAdjacency(n, edges);
  const seen = new Set();
  let count = 0;
  for (let i = 0; i < n; i++) {
    if (!seen.has(i)) {
      count++;
      dfs(i);
    }
  }
  return count;
}

function dfs(node) {
  seen.add(node);
  for (const next of graph[node])
    if (!seen.has(next)) dfs(next);
}`;

function* dfs(
  t: Tracer,
  g: TracedGraph,
  seenArr: TracedArray,
  seen: Set<number>,
  node: number,
): Generator<AlgoEvent> {
  seen.add(node);
  yield t.push(15, seenArr, node, {
    note: `Node ${node} belongs to the component being explored.`,
  });

  for (const next of g.edges(node)) {
    if (seen.has(next)) {
      yield t.compare(17, {
        target: g,
        i: node,
        j: next,
        note: `Node ${next} is already claimed — skip it.`,
      });
      continue;
    }
    yield t.read(17, {
      target: g,
      i: node,
      j: next,
      note: `Follow the edge ${node}–${next}.`,
    });
    yield* dfs(t, g, seenArr, seen, next);
  }
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  const edges = parseEdges(String(input.edges ?? ''));

  const t = new Tracer();
  const g = t.graph('graph', 'graph', false, 'circle', ['i']);
  buildGraph(g, n, edges);
  const seenArr = t.array('seen', [], 'visited', []);

  yield t.note(1, {
    note: 'Every unvisited node starts a new component; one traversal claims everything reachable from it.',
  });

  const seen = new Set<number>();
  let count = 0;
  yield t.note(4, { vars: { count }, note: 'No components counted yet.' });

  for (let i = 0; i < n; i++) {
    if (seen.has(i)) {
      yield t.compare(5, {
        target: g,
        i,
        vars: { i },
        note: `Node ${i} was already claimed by an earlier component.`,
      });
      continue;
    }

    count++;
    yield t.found(7, {
      target: g,
      i,
      vars: { i, count },
      note: `Node ${i} is unclaimed, so component ${count} starts here.`,
    });
    yield* dfs(t, g, seenArr, seen, i);
  }

  yield t.settle(11, g, g.nodes.map((_, d) => d), {
    vars: { i: undefined, count, result: count },
    note: `${count} connected component${count === 1 ? '' : 's'}.`,
  });
}

export const numberOfConnectedComponents: AlgorithmDef = {
  id: 'number-of-connected-components',
  name: 'Number of Connected Components',
  category: 'Graphs',
  code,
  inputFields: [
    { key: 'n', label: 'n', kind: 'number', placeholder: '5' },
    { key: 'edges', label: 'edges', kind: 'text', placeholder: '0-1, 1-2, 3-4' },
  ],
  defaultInput: { n: 5, edges: '0-1, 1-2, 3-4' },
  run,
};
