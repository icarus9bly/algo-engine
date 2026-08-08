import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function reorderList(head) {
  let slow = head, fast = head.next;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let second = slow.next;
  slow.next = null;
  let prev = null;
  while (second !== null) {
    const nxt = second.next;
    second.next = prev;
    prev = second;
    second = nxt;
  }
  let first = head;
  second = prev;
  while (second !== null) {
    const n1 = first.next, n2 = second.next;
    first.next = second;
    second.next = n1;
    first = n1;
    second = n2;
  }
}`;

const POINTERS = ['head', 'slow', 'fast', 'first', 'second', 'prev', 'nxt'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = input.values as number[];

  const t = new Tracer();
  const list = t.list('list', 'list', POINTERS);
  const head = list.chain(values);

  yield t.note(1, {
    note: 'Three phases: find the middle, reverse the back half, then weave the halves together.',
  });

  if (head === null || list.next(head) === null) {
    yield t.note(1, { note: 'Fewer than two nodes — already in order.' });
    return;
  }

  // Phase 1 — find the middle.
  let slow: number = head;
  let fast: number | null = list.next(head);
  yield t.note(2, {
    i: head,
    vars: { head, slow, fast: fast ?? undefined },
    note: 'Two pointers at different speeds will find the middle in one pass.',
  });

  while (fast !== null && list.next(fast) !== null) {
    slow = list.next(slow)!;
    fast = list.next(list.next(fast)!);
    yield t.read(5, {
      i: slow,
      j: fast ?? undefined,
      vars: { slow, fast: fast ?? undefined },
      note: 'fast moves twice as fast, so slow lands on the middle.',
    });
  }

  // Phase 2 — cut, then reverse the second half.
  let second: number | null = list.next(slow);
  yield t.note(7, {
    i: second ?? undefined,
    vars: { second: second ?? undefined },
    note: `The back half starts at ${second === null ? 'nothing' : list.value(second)}.`,
  });

  yield t.link(8, list, slow, null, { note: 'Cut the list in two.' });

  let prev: number | null = null;
  while (second !== null) {
    const nxt: number | null = list.next(second);
    yield t.read(11, {
      i: second,
      vars: { nxt: nxt ?? undefined },
      note: `Remember what follows ${list.value(second)} before overwriting its arrow.`,
    });
    yield t.link(12, list, second, prev, {
      note: `Flip ${list.value(second)} to point backwards.`,
    });
    prev = second;
    second = nxt;
    yield t.note(14, {
      i: prev,
      vars: { prev, second: second ?? undefined },
      note: `${list.value(prev)} is now the head of the reversed back half.`,
    });
  }

  // Phase 3 — weave.
  let first: number | null = head;
  second = prev;
  yield t.note(18, {
    i: first ?? undefined,
    j: second ?? undefined,
    vars: { first: first ?? undefined, second: second ?? undefined, prev: undefined, nxt: undefined },
    note: 'Now alternate one node from the front with one from the reversed back.',
  });

  while (second !== null) {
    const n1: number | null = first === null ? null : list.next(first);
    const n2: number | null = list.next(second);
    yield t.read(20, {
      i: first ?? undefined,
      j: second ?? undefined,
      note: 'Remember both continuations before overwriting the arrows.',
    });

    yield t.link(21, list, first!, second, {
      note: `${list.value(first!)} now points at ${list.value(second)}.`,
    });
    yield t.link(22, list, second, n1, {
      note: n1 === null
        ? `${list.value(second)} becomes the tail.`
        : `${list.value(second)} now points at ${list.value(n1)}.`,
    });

    first = n1;
    second = n2;
    yield t.note(24, {
      vars: { first: first ?? undefined, second: second ?? undefined },
      note: second === null
        ? 'The back half is exhausted — the weave is done.'
        : 'Both cursors advance to the next pair to interleave.',
    });
  }

  const order: number[] = [];
  for (let at: number | null = head; at !== null; at = list.next(at)) order.push(at);
  yield t.settle(25, list, order, {
    vars: { slow: undefined, fast: undefined, first: undefined, second: undefined },
    note: `Reordered: ${order.map((n) => list.value(n)).join(' → ')}.`,
  });
}

export const reorderList: AlgorithmDef = {
  id: 'reorder-list',
  name: 'Reorder List',
  category: 'Linked List',
  code,
  inputFields: [
    { key: 'values', label: 'values', kind: 'numbers', placeholder: '1, 2, 3, 4, 5' },
  ],
  defaultInput: { values: [1, 2, 3, 4] },
  run,
};
