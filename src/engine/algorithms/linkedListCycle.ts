import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function hasCycle(head) {
  let slow = head, fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`;

const POINTERS = ['head', 'slow', 'fast'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = input.values as number[];
  const pos = input.pos as number;
  if (!Number.isInteger(pos) || pos < -1 || pos >= Math.max(values.length, 1)) {
    throw new Error('pos must be -1 (no cycle) or a valid index.');
  }

  const t = new Tracer();
  const list = t.list('list', 'list', POINTERS);
  const head = list.chain(values);

  if (head !== null && pos >= 0) {
    list.setNext(list.length - 1, pos);
  }

  yield t.note(1, {
    note: pos >= 0
      ? `The tail links back to index ${pos}, so the list loops forever.`
      : 'A tortoise and a hare: if the track loops, the faster one laps the slower one.',
  });

  if (head === null) {
    yield t.note(7, { vars: { result: false }, note: 'Empty list — no cycle.' });
    return;
  }

  let slow: number | null = head;
  let fast: number | null = head;
  yield t.note(2, { i: head, vars: { head, slow, fast }, note: 'Both start at the head.' });

  while (fast !== null && list.next(fast) !== null) {
    slow = list.next(slow!)!;
    yield t.read(4, { i: slow, vars: { slow }, note: `slow advances one to ${list.value(slow)}.` });

    fast = list.next(list.next(fast)!)!;
    yield t.read(5, {
      i: fast,
      vars: { fast },
      note: `fast advances two to ${list.value(fast)}.`,
    });

    if (slow === fast) {
      yield t.found(6, {
        i: slow,
        vars: { result: true },
        note: 'They landed on the same node — the list must loop.',
      });
      return;
    }

    yield t.compare(6, {
      i: slow,
      j: fast,
      note: 'Different nodes, so keep going.',
    });
  }

  yield t.note(8, {
    vars: { slow: undefined, fast: undefined, result: false },
    note: 'fast reached the end, so the list terminates — no cycle.',
  });
}

export const linkedListCycle: AlgorithmDef = {
  id: 'linked-list-cycle',
  name: 'Linked List Cycle',
  category: 'Linked List',
  code,
  inputFields: [
    { key: 'values', label: 'values', kind: 'numbers', placeholder: '3, 2, 0, -4' },
    { key: 'pos', label: 'cycle at', kind: 'number', placeholder: '1' },
  ],
  defaultInput: { values: [3, 2, 0, -4], pos: 1 },
  run,
};
