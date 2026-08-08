import { Tracer, type TracedList } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function mergeKLists(lists) {
  while (lists.length > 1) {
    const merged = [];
    for (let i = 0; i < lists.length; i += 2) {
      merged.push(mergeTwo(lists[i], lists[i + 1] ?? null));
    }
    lists = merged;
  }
  return lists[0] ?? null;
}

function mergeTwo(a, b) {
  let head = null, tail = null;
  while (a !== null && b !== null) {
    let pick;
    if (a.val <= b.val) { pick = a; a = a.next; }
    else { pick = b; b = b.next; }
    if (tail === null) head = pick;
    else tail.next = pick;
    tail = pick;
  }
  if (tail === null) return a !== null ? a : b;
  tail.next = a !== null ? a : b;
  return head;
}`;

const POINTERS = ['a', 'b', 'head', 'tail', 'pick'];

function parseLists(raw: string): number[][] {
  return raw
    .split('|')
    .map((chunk) => chunk.split(/[\s,]+/).filter(Boolean).map(Number))
    .filter((chunk) => chunk.length > 0 || raw.includes('|'));
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const raw = String(input.lists ?? '');
  const groups = parseLists(raw);
  if (groups.some((g) => g.some(Number.isNaN))) {
    throw new Error('Each list must be numbers; separate lists with |.');
  }
  if (groups.length > 6) throw new Error('Keep it to 6 lists or fewer.');

  const t = new Tracer();
  const list = t.list('list', 'all nodes, in input order', POINTERS);

  let heads: (number | null)[] = groups.map((g) => list.chain(g));

  yield t.note(1, {
    note: `${groups.length} sorted list${groups.length === 1 ? '' : 's'} sharing one set of nodes. Merge them in pairs, halving the count each round.`,
  });

  let round = 0;
  while (heads.length > 1) {
    round++;
    const merged: (number | null)[] = [];

    for (let i = 0; i < heads.length; i += 2) {
      const partner = i + 1 < heads.length ? heads[i + 1] : null;
      yield t.note(4, {
        vars: { round, pair: `${i / 2 + 1}` },
        note: partner === null
          ? 'Odd one out this round — it carries over untouched.'
          : `Merge list ${i + 1} with list ${i + 2}.`,
      });
      merged.push(yield* mergeTwo(t, list, heads[i], partner));
    }

    heads = merged;
    yield t.note(7, {
      vars: { round, remaining: heads.length, a: undefined, b: undefined, pick: undefined, tail: undefined },
      note: `${heads.length} list${heads.length === 1 ? '' : 's'} left.`,
    });
  }

  const head = heads[0] ?? null;
  const order: number[] = [];
  for (let at = head; at !== null; at = list.next(at)) order.push(at);
  yield t.settle(9, list, order, {
    vars: { round: undefined, remaining: undefined, pair: undefined, head: head ?? undefined },
    note: order.length === 0
      ? 'Nothing to merge.'
      : `Merged: ${order.map((n) => list.value(n)).join(' → ')}.`,
  });
}

/** The pairwise merge, yielding its own events into the outer trace. */
function* mergeTwo(
  t: Tracer,
  list: TracedList,
  first: number | null,
  second: number | null,
): Generator<AlgoEvent, number | null> {
  let a = first;
  let b = second;
  let head: number | null = null;
  let tail: number | null = null;

  yield t.note(13, { vars: { a: a ?? undefined, b: b ?? undefined, head: undefined, tail: undefined } });

  while (a !== null && b !== null) {
    const takeA = list.num(a) <= list.num(b);
    yield t.compare(16, {
      i: a,
      j: b,
      note: `${list.value(a)} vs ${list.value(b)} — take ${takeA ? list.value(a) : list.value(b)}.`,
    });

    const pick = takeA ? a : b;
    if (takeA) a = list.next(a);
    else b = list.next(b);

    if (tail === null) {
      head = pick;
      yield t.note(19, {
        i: pick,
        vars: { head, pick, a: a ?? undefined, b: b ?? undefined },
        note: `${list.value(pick)} heads this merge.`,
      });
    } else {
      yield t.link(20, list, tail, pick, {
        vars: { pick, a: a ?? undefined, b: b ?? undefined },
        note: `Append ${list.value(pick)}.`,
      });
    }

    tail = pick;
    yield t.note(21, { i: tail, vars: { tail } });
  }

  const rest = a !== null ? a : b;
  if (tail === null) {
    yield t.note(23, {
      i: rest ?? undefined,
      vars: { head: rest ?? undefined },
      note: 'One side was empty, so the other passes through unchanged.',
    });
    return rest;
  }

  yield t.link(24, list, tail, rest, {
    note: rest === null ? 'Both sides ran out.' : 'Attach the sorted remainder whole.',
  });
  return head;
}

export const mergeKSortedLists: AlgorithmDef = {
  id: 'merge-k-sorted-lists',
  name: 'Merge K Sorted Lists',
  category: 'Linked List',
  code,
  inputFields: [
    { key: 'lists', label: 'lists (| separated)', kind: 'text', placeholder: '1,4,5 | 1,3,4 | 2,6' },
  ],
  defaultInput: { lists: '1,4,5 | 1,3,4 | 2,6' },
  run,
};
