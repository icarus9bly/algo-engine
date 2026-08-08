import type { TracedGraph } from '../tracer';

/**
 * Edge-list notation: `0-1, 1-2, 2-0` (or `0>1` for directed input, though the
 * separator is not significant — any of `-`, `>` or `:` works).
 */
export function parseEdges(raw: string): [number, number][] {
  return String(raw)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const parts = pair.split(/[->:]+/).filter(Boolean);
      if (parts.length !== 2) throw new Error(`"${pair}" is not a pair like 0-1.`);
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      if (Number.isNaN(a) || Number.isNaN(b)) {
        throw new Error(`"${pair}" must be two numbers.`);
      }
      return [a, b] as [number, number];
    });
}

/** Creates `n` nodes labelled 0..n-1 and wires the given edges. */
export function buildGraph(
  graph: TracedGraph,
  n: number,
  edges: [number, number][],
): void {
  if (!Number.isInteger(n) || n < 0) throw new Error('n must be a non-negative integer.');
  if (n > 12) throw new Error('Keep the graph to 12 nodes or fewer.');
  for (let i = 0; i < n; i++) graph.add(i);
  for (const [a, b] of edges) {
    if (a < 0 || b < 0 || a >= n || b >= n) {
      throw new Error(`Edge ${a}-${b} refers to a node outside 0..${n - 1}.`);
    }
    graph.connect(a, b);
  }
}
