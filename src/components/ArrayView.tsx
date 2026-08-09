import type { AlgoEvent, ArrayStructure, Cell } from '../engine/types';
import { pointersFor } from './pointers';

interface Props {
  structure: ArrayStructure;
  event: AlgoEvent | null;
  /** Whether this is the structure the event's positions refer to. */
  active: boolean;
}

/** Horizontal distance between element slots. */
const STEP = 54;
const CELL_W = 46;
const CELL_H = 46;
/** Tallest a bar can get; the largest magnitude in the array maps to this. */
const BAR_MAX_H = 132;
const BAR_MIN_H = 10;
/** Space under the row for the index label and pointer badges. */
const FOOT_H = 34;

/** `Infinity` is a normal DP seed value; spelling it out blows the cell open. */
function formatCell(value: Cell): string {
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '−∞';
  return String(value);
}

export function ArrayView({ structure, event, active }: Props) {
  const { values, ids, display } = structure;

  const highlighted = new Set<number>();
  if (active && event) {
    if (event.i !== undefined) highlighted.add(event.i);
    if (event.j !== undefined) highlighted.add(event.j);
    for (const idx of event.indices ?? []) highlighted.add(idx);
  }

  const settled = new Set(structure.settled);
  const numeric = values.every((v) => typeof v === 'number');
  // DP tables seed cells with Infinity; it must not swallow the bar scale.
  const finite = values.filter(
    (v) => typeof v === 'number' && Number.isFinite(v),
  ) as number[];
  const max = Math.max(1, ...finite.map(Math.abs));

  // Pointers are drawn by ownership, not by which structure the current event
  // targets: `i` still points into the string while we're pushing to a stack.
  const pointers = event
    ? pointersFor(event.vars, values.length, structure.pointerNames)
    : new Map<number, string[]>();

  const bars = display === 'bars' && numeric;
  const bodyH = bars ? BAR_MAX_H : CELL_H;

  return (
    <div className="array">
      <div className="array__label">{structure.label}</div>
      {values.length === 0 ? (
        <p className="empty">empty</p>
      ) : (
        <div
          className="array__track"
          style={{ height: bodyH + FOOT_H, width: values.length * STEP }}
        >
          {/* Rendered in identity order, which never changes, so React only
              ever updates a transform and never moves a node in the DOM.
              Moving a node mid-transition strands it at a stale position; the
              visual order comes entirely from translateX. */}
          {values
            .map((value, idx) => ({ value, idx, id: ids[idx] }))
            .sort((a, b) => a.id - b.id)
            .map(({ value, idx, id }) => {
            const hit = highlighted.has(idx);
            const role = hit ? event!.type : settled.has(idx) ? 'settled' : 'idle';
            const height = bars
              ? Math.max(
                  BAR_MIN_H,
                  (Math.abs(value as number) / max) * BAR_MAX_H,
                )
              : CELL_H;

            return (
              <div
                className="slot"
                key={id}
                style={{ transform: `translateX(${idx * STEP}px)`, height: bodyH + FOOT_H }}
              >
                <div className="slot__body" style={{ height: bodyH }}>
                  <div
                    className={`cell cell--${role}${bars ? ' cell--bar' : ''}`}
                    style={{ height, width: CELL_W }}
                  >
                    <span className="cell__value">{formatCell(value)}</span>
                  </div>
                </div>
                <div className="cell__index">{idx}</div>
                <div className="cell__pointers">
                  {(pointers.get(idx) ?? []).map((name) => (
                    <span className="pointer" key={name}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
            })}
        </div>
      )}
    </div>
  );
}
