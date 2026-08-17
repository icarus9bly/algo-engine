import type { AlgoEvent, GraphStructure } from '../engine/types';
import { pointersFor } from './pointers';
import {
  BOW,
  R,
  bowRanks,
  circleLayout,
  edgePath,
  treeLayout,
  type Point,
} from './graphLayout';

interface Props {
  structure: GraphStructure;
  event: AlgoEvent | null;
  active: boolean;
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
  const highlightedEdges = new Set<number>();
  if (active && event) {
    if (event.i !== undefined) highlighted.add(event.i);
    if (event.j !== undefined) highlighted.add(event.j);
    for (const idx of event.indices ?? []) highlighted.add(idx);
    for (const e of event.edgeIndices ?? []) highlightedEdges.add(e);
  }

  const settled = new Set(structure.settled);
  const settledEdges = new Set(structure.settledEdges);
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

  const ranks = bowRanks(structure);

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

          {structure.edges.map((edge, idx) => {
            const a = points[edge.from];
            const b = points[edge.to];
            if (!a || !b) return null;

            const role = highlightedEdges.has(idx)
              ? event!.type
              : settledEdges.has(idx)
                ? 'settled'
                : 'idle';

            const { rank, of } = ranks.get(idx) ?? { rank: 0, of: 1 };
            const bow = of === 1 ? 0 : (rank - (of - 1) / 2) * BOW;
            const { d, lx, ly } = edgePath(a, b, edge.from === edge.to, bow);

            const label = edge.weight === undefined ? null : String(edge.weight);
            const boxW = label ? label.length * 7 + 8 : 0;

            return (
              <g key={idx}>
                <path
                  className={`edge edge--${role}`}
                  d={d}
                  fill="none"
                  markerEnd={structure.directed ? 'url(#g-arrow)' : undefined}
                />
                {label !== null && (
                  <>
                    <rect
                      className="edge__weight-bg"
                      x={lx - boxW / 2}
                      y={ly - 8}
                      width={boxW}
                      height={16}
                      rx={3}
                    />
                    <text className={`edge__weight edge__weight--${role}`} x={lx} y={ly + 4}>
                      {label}
                    </text>
                  </>
                )}
              </g>
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
