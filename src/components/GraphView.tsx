import type { AlgoEvent, GraphStructure } from '../engine/types';
import { pointersFor } from './pointers';

interface Props {
  structure: GraphStructure;
  event: AlgoEvent | null;
  active: boolean;
}

const R = 17;
const PAD = 26;
const COL_W = 46;
const ROW_H = 56;

interface Point {
  x: number;
  y: number;
}

/** Evenly spaced on a circle — stable across frames and needs no physics. */
function circleLayout(count: number): { points: Point[]; size: number } {
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
function treeLayout(structure: GraphStructure): { points: Point[]; width: number; height: number } {
  const points: Point[] = structure.nodes.map(() => ({ x: PAD, y: PAD }));
  const seen = new Set<number>();
  let col = 0;
  let maxDepth = 0;

  const place = (idx: number, depth: number): number => {
    seen.add(idx);
    maxDepth = Math.max(maxDepth, depth);
    const kids = structure.nodes[idx].edges.filter((k) => !seen.has(k));

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

export function GraphView({ structure, event, active }: Props) {
  const { nodes } = structure;

  if (nodes.length === 0) {
    return (
      <div className="graph-block">
        <div className="array__label">{structure.label}</div>
        <p className="empty">empty graph</p>
      </div>
    );
  }

  const highlighted = new Set<number>();
  if (active && event) {
    if (event.i !== undefined) highlighted.add(event.i);
    if (event.j !== undefined) highlighted.add(event.j);
    for (const idx of event.indices ?? []) highlighted.add(idx);
  }

  const settled = new Set(structure.settled);
  const pointers = event
    ? pointersFor(event.vars, nodes.length, structure.pointerNames)
    : new Map<number, string[]>();

  let points: Point[];
  let width: number;
  let height: number;

  if (structure.layout === 'tree') {
    const laid = treeLayout(structure);
    points = laid.points;
    width = laid.width;
    height = laid.height;
  } else {
    const laid = circleLayout(nodes.length);
    points = laid.points;
    width = laid.size;
    height = laid.size;
  }

  // Deduplicate mirrored edges so an undirected pair draws one line.
  const drawn = new Set<string>();
  const edges: { from: number; to: number }[] = [];
  nodes.forEach((node, from) => {
    for (const to of node.edges) {
      const key = structure.directed ? `${from}>${to}` : [from, to].sort().join('-');
      if (drawn.has(key)) continue;
      drawn.add(key);
      edges.push({ from, to });
    }
  });

  return (
    <div className="graph-block">
      <div className="array__label">{structure.label}</div>
      <div className="list__scroll">
        <svg width={width} height={height} className="list__svg" role="img">
          <defs>
            <marker
              id="g-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" />
            </marker>
          </defs>

          {edges.map(({ from, to }) => {
            const a = points[from];
            const b = points[to];
            if (!a || !b) return null;
            // Stop the line at the node boundary so arrowheads stay visible.
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            return (
              <line
                key={`${from}-${to}`}
                className="edge"
                x1={a.x + ux * R}
                y1={a.y + uy * R}
                x2={b.x - ux * (R + 3)}
                y2={b.y - uy * (R + 3)}
                markerEnd={structure.directed ? 'url(#g-arrow)' : undefined}
              />
            );
          })}

          {nodes.map((node, idx) => {
            const p = points[idx];
            if (!p) return null;
            const role = highlighted.has(idx)
              ? event!.type
              : settled.has(idx)
                ? 'settled'
                : 'idle';
            return (
              <g key={idx}>
                <circle className={`node node--${role}`} cx={p.x} cy={p.y} r={R} />
                <text className="node__value" x={p.x} y={p.y + 4}>
                  {String(node.value)}
                </text>
                {(pointers.get(idx) ?? []).map((name, n) => (
                  <text
                    key={name}
                    className="node__pointer"
                    x={p.x}
                    y={p.y - R - 4 - n * 11}
                  >
                    {name}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
