import type { AlgoEvent, TreeStructure } from '../engine/types';
import { pointersFor } from './pointers';

interface Props {
  structure: TreeStructure;
  event: AlgoEvent | null;
  active: boolean;
}

const NODE_W = 42;
const NODE_H = 30;
const COL_W = 50;
const ROW_H = 60;
const PAD = 14;
/** Room above the top row for pointer labels, which can stack. */
const TOP = 28;
/** Blank columns inserted between two trees in the same structure. */
const TREE_GAP = 2;

interface Placed {
  col: number;
  depth: number;
}

/**
 * In-order position gives the column, recursion depth gives the row. That is
 * enough to keep a binary tree readable without a layout library, and it makes
 * a BST come out in sorted left-to-right order.
 */
function layout(structure: TreeStructure): Map<number, Placed> {
  const placed = new Map<number, Placed>();
  let col = 0;
  // A malformed tree must not hang the renderer.
  const seen = new Set<number>();

  const walk = (idx: number | null, depth: number): void => {
    if (idx === null || seen.has(idx)) return;
    seen.add(idx);
    const node = structure.nodes[idx];
    if (!node) return;
    walk(node.left, depth + 1);
    placed.set(idx, { col: col++, depth });
    walk(node.right, depth + 1);
  };

  for (const root of structure.roots) {
    walk(root, 0);
    col += TREE_GAP;
  }

  // Anything unreachable from a root (a detached node mid-rebuild) still gets
  // a slot, so it stays visible instead of silently vanishing.
  structure.nodes.forEach((_, idx) => {
    if (!placed.has(idx)) placed.set(idx, { col: col++, depth: 0 });
  });

  return placed;
}

export function TreeView({ structure, event, active }: Props) {
  const { nodes } = structure;

  if (nodes.length === 0) {
    return (
      <div className="tree">
        <div className="array__label">{structure.label}</div>
        <p className="empty">empty tree</p>
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

  const placed = layout(structure);
  const cols = Math.max(...[...placed.values()].map((p) => p.col)) + 1;
  const depths = Math.max(...[...placed.values()].map((p) => p.depth)) + 1;

  const cx = (idx: number) => PAD + (placed.get(idx)!.col + 0.5) * COL_W;
  const cy = (idx: number) => TOP + placed.get(idx)!.depth * ROW_H;

  const width = PAD * 2 + cols * COL_W;
  const height = TOP + (depths - 1) * ROW_H + NODE_H + PAD;

  return (
    <div className="tree">
      <div className="array__label">{structure.label}</div>
      <div className="list__scroll">
        <svg width={width} height={height} className="list__svg" role="img">
          {nodes.map((node, idx) =>
            (['left', 'right'] as const).map((side) => {
              const child = node[side];
              if (child === null || !placed.has(child)) return null;
              return (
                <line
                  key={`${idx}-${side}`}
                  className="edge"
                  x1={cx(idx)}
                  y1={cy(idx) + NODE_H}
                  x2={cx(child)}
                  y2={cy(child)}
                />
              );
            }),
          )}

          {nodes.map((node, idx) => {
            const role = highlighted.has(idx)
              ? event!.type
              : settled.has(idx)
                ? 'settled'
                : 'idle';
            return (
              <g key={idx}>
                <rect
                  className={`node node--${role}`}
                  x={cx(idx) - NODE_W / 2}
                  y={cy(idx)}
                  width={NODE_W}
                  height={NODE_H}
                  rx={7}
                />
                <text className="node__value" x={cx(idx)} y={cy(idx) + NODE_H / 2 + 4}>
                  {String(node.value)}
                </text>
                {(pointers.get(idx) ?? []).map((name, n) => (
                  <text
                    key={name}
                    className="node__pointer"
                    x={cx(idx)}
                    y={cy(idx) - 5 - n * 11}
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
