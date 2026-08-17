/**
 * Graph geometry, kept out of the JSX so it can be checked directly —
 * `scripts/layout.ts` runs it over every graph the registry can produce.
 *
 * Nodes hold *edge* positions, so anything that wants neighbours has to resolve
 * them through the edge list. `neighboursOf` is the only place that knows how.
 */
import type { GraphStructure } from '../engine/types';

export const R = 17;
export const PAD = 26;
export const COL_W = 46;
export const ROW_H = 56;
/** How far apart parallel edges between the same pair are bowed. */
export const BOW = 26;

export interface Point {
  x: number;
  y: number;
}

/** The node positions reachable from `idx` — each incident edge's other end. */
export function neighboursOf(structure: GraphStructure, idx: number): number[] {
  return structure.nodes[idx].edges.map((e) => {
    const edge = structure.edges[e];
    return edge.from === idx ? edge.to : edge.from;
  });
}

/** Evenly spaced on a circle — stable across frames and needs no physics. */
export function circleLayout(count: number): { points: Point[]; size: number } {
  const radius = Math.max(58, count * 13);
  const size = radius * 2 + PAD * 2;
  const centre = size / 2;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    // Start at the top so small graphs read clockwise from 12 o'clock.
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    points.push({ x: centre + radius * Math.cos(angle), y: centre + radius * Math.sin(angle) });
  }
  return { points, size };
}

/** Depth from node 0, with each parent centred over the children it reaches. */
export function treeLayout(
  structure: GraphStructure,
): { points: Point[]; width: number; height: number } {
  const points: Point[] = structure.nodes.map(() => ({ x: PAD, y: PAD }));
  const seen = new Set<number>();
  let col = 0;
  let maxDepth = 0;

  const place = (idx: number, depth: number): number => {
    seen.add(idx);
    maxDepth = Math.max(maxDepth, depth);
    // Parallel edges would otherwise place the same child twice.
    const kids = [...new Set(neighboursOf(structure, idx))].filter((k) => !seen.has(k));

    let centreCol: number;
    if (kids.length === 0) {
      centreCol = col++;
    } else {
      const kidCols = kids.map((k) => place(k, depth + 1));
      centreCol = (Math.min(...kidCols) + Math.max(...kidCols)) / 2;
    }

    points[idx] = { x: PAD + centreCol * COL_W + R, y: PAD + depth * ROW_H + R };
    return centreCol;
  };

  for (let i = 0; i < structure.nodes.length; i++) {
    if (!seen.has(i)) place(i, 0);
  }

  return {
    points,
    width: PAD * 2 + Math.max(1, col) * COL_W,
    height: PAD * 2 + (maxDepth + 1) * ROW_H,
  };
}

/**
 * Where each edge sits among those sharing its endpoints. Grouping ignores
 * direction, so a directed pair pointing both ways bows apart too rather than
 * one line hiding under the other.
 */
export function bowRanks(structure: GraphStructure): Map<number, { rank: number; of: number }> {
  const groups = new Map<string, number[]>();
  structure.edges.forEach((e, idx) => {
    const key = `${Math.min(e.from, e.to)}-${Math.max(e.from, e.to)}`;
    const list = groups.get(key);
    if (list) list.push(idx);
    else groups.set(key, [idx]);
  });

  const ranks = new Map<number, { rank: number; of: number }>();
  for (const list of groups.values()) {
    list.forEach((idx, rank) => ranks.set(idx, { rank, of: list.length }));
  }
  return ranks;
}

/**
 * The drawn path for one edge, plus where its weight label sits. A self-loop
 * arcs over its node; everything else is a quadratic bowed by `bow`, which is
 * zero for an edge that has its pair to itself.
 */
export function edgePath(
  a: Point,
  b: Point,
  selfLoop: boolean,
  bow: number,
): { d: string; lx: number; ly: number } {
  if (selfLoop) {
    const top = a.y - R;
    return { d: `M ${a.x - 7} ${top} A 13 13 0 1 1 ${a.x + 7} ${top}`, lx: a.x, ly: top - 20 };
  }

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  // Stop short of the node boundary so arrowheads stay visible.
  const x1 = a.x + ux * R;
  const y1 = a.y + uy * R;
  const x2 = b.x - ux * (R + 3);
  const y2 = b.y - uy * (R + 3);
  // Control point pushed along the perpendicular by the bow.
  const cx = (x1 + x2) / 2 - uy * bow;
  const cy = (y1 + y2) / 2 + ux * bow;

  return {
    d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
    // The quadratic's midpoint, which is not the chord's midpoint.
    lx: (x1 + 2 * cx + x2) / 4,
    ly: (y1 + 2 * cy + y2) / 4,
  };
}
