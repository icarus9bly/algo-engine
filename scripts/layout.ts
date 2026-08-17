/**
 * Checks graph geometry, which `verify.ts` cannot see — it asserts events, and
 * a renderer bug produces perfectly valid events.
 *
 * Runs every algorithm's default input, finds each graph it produced, and
 * checks the model's invariants and the layout it feeds:
 *
 *   - node adjacency and the edge list agree in both directions
 *   - every node lands on a finite, unique position
 *   - a tree layout puts every parent strictly above its child
 *   - every edge gets a bow rank, unique within its endpoint pair
 *   - no edge path or weight label comes out NaN
 *
 * Run with: npx tsx scripts/layout.ts
 */
import { algorithms } from '../src/engine/registry';
import type { AlgoEvent, GraphStructure } from '../src/engine/types';
import { BOW, bowRanks, circleLayout, edgePath, treeLayout } from '../src/components/graphLayout';

let failures = 0;
let graphs = 0;

const fail = (id: string, label: string, msg: string) => {
  console.log(`FAIL ${id.padEnd(34)} [${label}] ${msg}`);
  failures++;
};

for (const algo of algorithms) {
  let last: AlgoEvent | undefined;
  try {
    for (const e of algo.run(algo.defaultInput)) last = e;
  } catch (e) {
    console.log(`SKIP ${algo.id.padEnd(34)} threw: ${e instanceof Error ? e.message : String(e)}`);
    continue;
  }
  if (!last) continue;

  for (const s of last.structures) {
    if (s.kind !== 'graph') continue;
    const g: GraphStructure = s;
    graphs++;

    // --- the model: adjacency and the edge list must agree ---
    g.nodes.forEach((n, i) => {
      for (const e of n.edges) {
        if (e < 0 || e >= g.edges.length) {
          fail(algo.id, g.label, `node ${i} references edge ${e}, but there are ${g.edges.length}`);
          continue;
        }
        const edge = g.edges[e];
        if (edge.from !== i && edge.to !== i) {
          fail(algo.id, g.label, `node ${i} lists edge ${e} (${edge.from}→${edge.to}), which does not touch it`);
        }
      }
    });

    g.edges.forEach((edge, e) => {
      if (!g.nodes[edge.from]?.edges.includes(e)) {
        fail(algo.id, g.label, `edge ${e} (${edge.from}→${edge.to}) is missing from node ${edge.from}`);
      }
      // An undirected edge belongs to both ends; a self-loop is listed once.
      if (!g.directed && edge.from !== edge.to && !g.nodes[edge.to]?.edges.includes(e)) {
        fail(algo.id, g.label, `undirected edge ${e} (${edge.from}→${edge.to}) is missing from node ${edge.to}`);
      }
    });

    // --- positions ---
    const laid = g.layout === 'tree' ? treeLayout(g) : circleLayout(g.nodes.length);
    const points = laid.points;

    if (points.length !== g.nodes.length) {
      fail(algo.id, g.label, `${points.length} positions for ${g.nodes.length} nodes`);
      continue;
    }

    const at = new Map<string, number>();
    points.forEach((p, i) => {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        fail(algo.id, g.label, `node ${i} sits at a non-finite (${p.x}, ${p.y})`);
        return;
      }
      const key = `${Math.round(p.x)},${Math.round(p.y)}`;
      const clash = at.get(key);
      if (clash !== undefined) fail(algo.id, g.label, `nodes ${clash} and ${i} overlap at ${key}`);
      else at.set(key, i);
    });

    // A tree layout that resolved its children wrongly stops going downward.
    if (g.layout === 'tree') {
      for (const edge of g.edges) {
        const parent = points[edge.from];
        const child = points[edge.to];
        if (parent && child && !(parent.y < child.y)) {
          fail(
            algo.id,
            g.label,
            `tree layout puts node ${edge.from} (y=${parent.y}) at or below its child ${edge.to} (y=${child.y})`,
          );
        }
      }
    }

    // --- edges ---
    const ranks = bowRanks(g);
    if (ranks.size !== g.edges.length) {
      fail(algo.id, g.label, `${ranks.size} bow ranks for ${g.edges.length} edges`);
    }

    const perPair = new Map<string, Set<number>>();
    g.edges.forEach((edge, e) => {
      const entry = ranks.get(e);
      if (!entry) {
        fail(algo.id, g.label, `edge ${e} has no bow rank`);
        return;
      }
      const key = `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`;
      const used = perPair.get(key) ?? new Set<number>();
      if (used.has(entry.rank)) {
        fail(algo.id, g.label, `two edges between ${key} share bow rank ${entry.rank}`);
      }
      used.add(entry.rank);
      perPair.set(key, used);

      const bow = entry.of === 1 ? 0 : (entry.rank - (entry.of - 1) / 2) * BOW;
      const { d, lx, ly } = edgePath(
        points[edge.from],
        points[edge.to],
        edge.from === edge.to,
        bow,
      );
      if (d.includes('NaN') || !Number.isFinite(lx) || !Number.isFinite(ly)) {
        fail(algo.id, g.label, `edge ${e} (${edge.from}→${edge.to}) produced "${d}"`);
      }
    });
  }
}

console.log(
  failures === 0
    ? `\n${graphs} graphs checked, all layouts sound`
    : `\n${failures} layout problem${failures === 1 ? '' : 's'} across ${graphs} graphs`,
);
