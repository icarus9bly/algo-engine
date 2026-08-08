import type { AlgoEvent, Structure } from '../engine/types';
import { ArrayView } from './ArrayView';
import { LinkedListView } from './LinkedListView';
import { TreeView } from './TreeView';

interface Props {
  structures: Structure[];
  event: AlgoEvent | null;
}

/**
 * The data panel. Owns the panel chrome and dispatches each structure to the
 * renderer for its `kind` — adding linked lists or trees means adding one case
 * here plus one small component, and nothing else changes.
 */
export function StructureView({ structures, event }: Props) {
  const activeId = event?.structureId ?? structures[0]?.id;

  return (
    <section className="panel panel--data">
      <header className="panel__head">
        <h2>data</h2>
        {event && <span className={`badge badge--${event.type}`}>{event.type}</span>}
      </header>

      {structures.length === 0 ? (
        <p className="empty">No data in this run.</p>
      ) : (
        <div className="structures">
          {structures.map((structure) => {
            const active = structure.id === activeId;
            switch (structure.kind) {
              case 'array':
                return (
                  <ArrayView
                    key={structure.id}
                    structure={structure}
                    event={event}
                    active={active}
                  />
                );
              case 'tree':
                return (
                  <TreeView
                    key={structure.id}
                    structure={structure}
                    event={event}
                    active={active}
                  />
                );
              case 'list':
                return (
                  <LinkedListView
                    key={structure.id}
                    structure={structure}
                    event={event}
                    active={active}
                  />
                );
              default: {
                // Adding a `kind` without a renderer fails the build here.
                const unhandled: never = structure;
                void unhandled;
                return null;
              }
            }
          })}
        </div>
      )}
    </section>
  );
}
