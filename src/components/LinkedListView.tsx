import type { AlgoEvent, ListStructure } from '../engine/types';
import { pointersFor } from './pointers';

interface Props {
  structure: ListStructure;
  event: AlgoEvent | null;
  active: boolean;
}

const NODE_W = 56;
const NODE_H = 40;
const GAP = 34;
const PAD = 12;
/** Room above the boxes for pointer labels, which can stack. */
const TOP = 30;
/** Room below for index labels and the arcs of non-adjacent links. */
const INDEX_H = 15;
const ARC_H = 46;

const x = (idx: number) => PAD + idx * (NODE_W + GAP);
const centreX = (idx: number) => x(idx) + NODE_W / 2;

/**
 * Nodes sit at fixed positions and every arrow is drawn from a node's `next`.
 * That is what makes Reverse Linked List legible (the boxes hold still while
 * the arrows flip) and what lets a cycle show up as an arc running backwards.
 */
export function LinkedListView({ structure, event, active }: Props) {
  const { nodes } = structure;

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

  // The +24 leaves room for a trailing null stub, which hangs past the last node.
  const width = Math.max(PAD * 2, nodes.length * (NODE_W + GAP) - GAP + PAD * 2 + 24);
  const yTop = TOP;
  const yBottom = TOP + NODE_H;
  const height = TOP + NODE_H + INDEX_H + ARC_H;

  if (nodes.length === 0) {
    return (
      <div className="list">
        <div className="array__label">{structure.label}</div>
        <p className="empty">empty list</p>
      </div>
    );
  }

  return (
    <div className="list">
      <div className="array__label">{structure.label}</div>
      <div className="list__scroll">
        <svg width={width} height={height} className="list__svg" role="img">
          <defs>
            <marker
              id="ll-arrow"
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

          {nodes.map((node, idx) => {
            const role = highlighted.has(idx)
              ? event!.type
              : settled.has(idx)
                ? 'settled'
                : 'idle';

            const links = [];
            if (node.next === null) {
              // A short stub ending in a slash: this node terminates the list.
              const sx = x(idx) + NODE_W;
              links.push(
                <g key="null" className="link link--null">
                  <line x1={sx} y1={yTop + NODE_H / 2} x2={sx + 14} y2={yTop + NODE_H / 2} />
                  <line x1={sx + 10} y1={yTop + NODE_H / 2 - 7} x2={sx + 18} y2={yTop + NODE_H / 2 + 7} />
                </g>,
              );
            } else if (node.next === idx + 1) {
              links.push(
                <line
                  key="fwd"
                  className="link"
                  x1={x(idx) + NODE_W}
                  y1={yTop + NODE_H / 2}
                  x2={x(idx + 1) - 4}
                  y2={yTop + NODE_H / 2}
                  markerEnd="url(#ll-arrow)"
                />,
              );
            } else {
              // Anything non-adjacent (a reversal, a cycle, a spliced merge)
              // arcs underneath so it never overlaps the boxes.
              const from = centreX(idx);
              const to = centreX(node.next);
              const depth = Math.min(ARC_H - 8, 16 + Math.abs(node.next - idx) * 7);
              links.push(
                <path
                  key="arc"
                  className="link link--arc"
                  d={`M ${from} ${yBottom} Q ${(from + to) / 2} ${yBottom + depth * 2} ${to} ${yBottom + 4}`}
                  markerEnd="url(#ll-arrow)"
                  fill="none"
                />,
              );
            }

            return (
              <g key={idx}>
                {links}
                <rect
                  className={`node node--${role}`}
                  x={x(idx)}
                  y={yTop}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                />
                <text className="node__value" x={centreX(idx)} y={yTop + NODE_H / 2 + 5}>
                  {String(node.value)}
                </text>
                <text className="node__index" x={centreX(idx)} y={yBottom + 13}>
                  {idx}
                </text>
                {(pointers.get(idx) ?? []).map((name, n) => (
                  <text
                    key={name}
                    className="node__pointer"
                    x={centreX(idx)}
                    y={yTop - 6 - n * 12}
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
