import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function reverseList(head) {
  let prev = null, curr = head;
  while (curr !== null) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`;

const POINTERS = ['head', 'prev', 'curr', 'next'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = input.values as number[];

  const t = new Tracer();
  const list = t.list('list', 'list', POINTERS);
  const head = list.chain(values);

  yield t.note(1, {
    note: 'Walk the list once, flipping each node\'s arrow to point at the node behind it.',
  });

  if (head === null) {
    yield t.note(9, { note: 'Empty list — nothing to reverse.' });
    return;
  }

  let prev: number | null = null;
  let curr: number | null = head;
  yield t.note(2, { i: curr, vars: { head, curr }, note: 'prev starts as null; curr starts at the head.' });

  while (curr !== null) {
    const next: number | null = list.next(curr);
    yield t.read(4, {
      i: curr,
      j: next ?? undefined,
      vars: { next: next ?? undefined },
      note: next === null
        ? 'Remember what comes next — nothing, this is the tail.'
        : `Remember what comes next before the arrow is overwritten.`,
    });

    yield t.link(5, list, curr, prev, {
      vars: { prev: prev ?? undefined },
      note: prev === null
        ? `Node ${list.value(curr)} becomes the new tail.`
        : `Point ${list.value(curr)} back at ${list.value(prev)}.`,
    });

    prev = curr;
    curr = next;
    yield t.note(7, {
      i: prev,
      vars: { prev, curr: curr ?? undefined },
      note: 'Shuffle both pointers forward.',
    });
  }

  yield t.settle(9, list, list.nodes.map((_, d) => d), {
    vars: { head: prev ?? undefined, curr: undefined, next: undefined },
    note: `Reversed — the head is now ${list.value(prev!)}.`,
  });
}

export const reverseLinkedList: AlgorithmDef = {
  id: 'reverse-linked-list',
  name: 'Reverse Linked List',
  category: 'Linked List',
  code,
  inputFields: [
    { key: 'values', label: 'values', kind: 'numbers', placeholder: '1, 2, 3, 4, 5' },
  ],
  defaultInput: { values: [1, 2, 3, 4, 5] },
  run,
};
