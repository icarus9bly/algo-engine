import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function removeNthFromEnd(head, n) {
  let right = head;
  for (let k = 0; k < n; k++) right = right.next;
  if (right === null) return head.next;
  let left = head;
  while (right.next !== null) {
    left = left.next;
    right = right.next;
  }
  left.next = left.next.next;
  return head;
}`;

const POINTERS = ['head', 'left', 'right'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = input.values as number[];
  const n = input.n as number;
  if (!Number.isInteger(n) || n < 1 || n > values.length) {
    throw new Error(`n must be between 1 and ${values.length}.`);
  }

  const t = new Tracer();
  const list = t.list('list', 'list', POINTERS);
  const head = list.chain(values);

  yield t.note(1, {
    note: `Open a gap of ${n} between two pointers, then walk both until the front one falls off the end.`,
  });

  let right: number | null = head;
  yield t.note(2, {
    i: head ?? undefined,
    vars: { head: head ?? undefined, right: right ?? undefined },
    note: 'Send one pointer ahead first; the gap between them does the counting.',
  });

  for (let k = 0; k < n; k++) {
    right = list.next(right!);
    yield t.read(3, {
      i: right ?? undefined,
      vars: { k, right: right ?? undefined },
      note: `right is now ${k + 1} node${k === 0 ? '' : 's'} ahead.`,
    });
  }

  if (right === null) {
    yield t.note(4, {
      i: head!,
      vars: { k: undefined, head: list.next(head!) ?? undefined },
      note: 'The gap covers the whole list, so the head itself is the one to drop.',
    });
    const kept: number[] = [];
    for (let at = list.next(head!); at !== null; at = list.next(at)) kept.push(at);
    yield t.settle(4, list, kept, {
      note: `Removed ${list.value(head!)} — the new head is ${kept.length ? list.value(kept[0]) : 'nothing'}.`,
    });
    return;
  }

  let left: number = head!;
  yield t.note(5, {
    i: left,
    vars: { left, k: undefined },
    note: `The gap is now ${n} wide; walk both pointers until the front one hits the tail.`,
  });

  while (list.next(right!) !== null) {
    left = list.next(left)!;
    right = list.next(right!)!;
    yield t.read(7, {
      i: left,
      j: right,
      vars: { left, right },
      note: 'Both pointers step forward, holding the gap.',
    });
  }

  const drop = list.next(left)!;
  yield t.compare(10, {
    i: drop,
    note: `right is at the tail, so left sits just before the node to remove — ${list.value(drop)}.`,
  });

  yield t.link(10, list, left, list.next(drop), {
    note: `Skip past ${list.value(drop)}.`,
  });

  const kept: number[] = [];
  for (let at = head; at !== null; at = list.next(at)) kept.push(at);
  yield t.settle(11, list, kept, {
    vars: { left: undefined, right: undefined },
    note: `Removed ${list.value(drop)}; it is now unreachable.`,
  });
}

export const removeNthFromEnd: AlgorithmDef = {
  id: 'remove-nth-from-end',
  name: 'Remove Nth Node From End of List',
  category: 'Linked List',
  code,
  inputFields: [
    { key: 'values', label: 'values', kind: 'numbers', placeholder: '1, 2, 3, 4, 5' },
    { key: 'n', label: 'n', kind: 'number', placeholder: '2' },
  ],
  defaultInput: { values: [1, 2, 3, 4, 5], n: 2 },
  run,
};
