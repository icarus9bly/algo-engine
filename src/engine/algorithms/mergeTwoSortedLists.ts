import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function mergeTwoLists(l1, l2) {
  let head = null, tail = null;
  while (l1 !== null && l2 !== null) {
    let pick;
    if (l1.val <= l2.val) { pick = l1; l1 = l1.next; }
    else { pick = l2; l2 = l2.next; }
    if (tail === null) head = pick;
    else tail.next = pick;
    tail = pick;
  }
  tail.next = l1 !== null ? l1 : l2;
  return head;
}`;

const POINTERS = ['l1', 'l2', 'head', 'tail', 'pick'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const a = input.list1 as number[];
  const b = input.list2 as number[];

  const t = new Tracer();
  // Both chains live in one structure: merging rewires existing nodes rather
  // than copying them, so the arrows have to be able to cross between chains.
  const list = t.list('list', 'list 1 then list 2', POINTERS);
  let l1 = list.chain(a);
  let l2 = list.chain(b);

  yield t.note(1, {
    note: 'Both chains share one set of nodes — merging only rewires arrows, it never copies.',
  });
  yield t.note(2, {
    vars: { l1: l1 ?? undefined, l2: l2 ?? undefined },
    note: 'One cursor per list; the merged list is built by relinking, not copying.',
  });

  let head: number | null = null;
  let tail: number | null = null;

  while (l1 !== null && l2 !== null) {
    const takeFirst = list.num(l1) <= list.num(l2);
    yield t.compare(5, {
      i: l1,
      j: l2,
      note: `${list.value(l1)} vs ${list.value(l2)} — take ${takeFirst ? 'the first' : 'the second'}.`,
    });

    const pick = takeFirst ? l1 : l2;
    if (takeFirst) l1 = list.next(l1);
    else l2 = list.next(l2);

    if (tail === null) {
      head = pick;
      yield t.note(8, {
        i: pick,
        vars: { head, pick, l1: l1 ?? undefined, l2: l2 ?? undefined },
        note: `${list.value(pick)} is the smallest overall, so it heads the merged list.`,
      });
    } else {
      yield t.link(9, list, tail, pick, {
        vars: { pick, l1: l1 ?? undefined, l2: l2 ?? undefined },
        note: `Append ${list.value(pick)} after ${list.value(tail)}.`,
      });
    }

    tail = pick;
    yield t.note(10, {
      i: tail,
      vars: { tail },
      note: `${list.value(tail)} is now the tail of the merged list.`,
    });
  }

  const rest = l1 !== null ? l1 : l2;
  if (tail === null) {
    head = rest;
    yield t.note(12, {
      i: rest ?? undefined,
      vars: { head: head ?? undefined },
      note: 'One list was empty, so the answer is just the other one.',
    });
  } else {
    yield t.link(12, list, tail, rest, {
      note: rest === null
        ? 'Both lists ran out at the same time.'
        : `Everything left in the other list is already sorted — attach it whole.`,
    });
  }

  const order: number[] = [];
  for (let at = head; at !== null; at = list.next(at)) order.push(at);
  yield t.settle(13, list, order, {
    vars: { l1: undefined, l2: undefined, pick: undefined, tail: undefined, head: head ?? undefined },
    note: `Merged: ${order.map((n) => list.value(n)).join(' → ')}.`,
  });
}

export const mergeTwoSortedLists: AlgorithmDef = {
  id: 'merge-two-sorted-lists',
  name: 'Merge Two Sorted Lists',
  category: 'Linked List',
  code,
  inputFields: [
    { key: 'list1', label: 'list 1', kind: 'numbers', placeholder: '1, 2, 4' },
    { key: 'list2', label: 'list 2', kind: 'numbers', placeholder: '1, 3, 4' },
  ],
  defaultInput: { list1: [1, 2, 4], list2: [1, 3, 4] },
  run,
};
