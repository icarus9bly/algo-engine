import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function kthSmallest(root, k) {
  const stack = [];
  let curr = root, n = 0;
  while (curr !== null || stack.length > 0) {
    while (curr !== null) {
      stack.push(curr);
      curr = curr.left;
    }
    curr = stack.pop();
    if (++n === k) return curr.val;
    curr = curr.right;
  }
  return -1;
}`;

const POINTERS = ['curr'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));
  const k = input.k as number;

  const t = new Tracer();
  const tree = t.tree('tree', 'BST', POINTERS);
  const stack = t.array('stack', [], 'stack', []);
  const root = buildTree(tree, values);
  t.setVars({ k });

  yield t.note(1, {
    note: 'An in-order walk of a BST emits values in sorted order, so the kth one popped is the answer.',
  });

  const pending: number[] = [];
  let curr = root;
  let n = 0;
  yield t.note(3, {
    target: tree,
    i: curr ?? undefined,
    vars: { curr: curr ?? undefined, n },
    note: 'Start at the root with nothing counted yet.',
  });

  while (curr !== null || pending.length > 0) {
    while (curr !== null) {
      pending.push(curr);
      yield t.push(6, stack, String(tree.value(curr)), {
        note: `Park ${tree.value(curr)} and keep going left — smaller values live there.`,
      });
      curr = tree.left(curr);
      yield t.note(7, {
        target: tree,
        i: curr ?? undefined,
        vars: { curr: curr ?? undefined },
        note: curr === null ? 'No smaller values down this side.' : `Move down to ${tree.value(curr)}.`,
      });
    }

    curr = pending.pop()!;
    yield t.read(9, {
      target: tree,
      i: curr,
      vars: { curr },
      note: `Nothing smaller left — ${tree.value(curr)} is next in sorted order.`,
    });
    yield t.pop(9, stack, { note: `${tree.value(curr)} comes off the stack.` });

    n++;
    if (n === k) {
      yield t.found(10, {
        target: tree,
        i: curr,
        vars: { n, result: tree.num(curr) },
        note: `That is value number ${n} — the ${k}th smallest is ${tree.value(curr)}.`,
      });
      return;
    }

    yield t.note(10, {
      target: tree,
      i: curr,
      vars: { n },
      note: `${n} of ${k} visited.`,
    });

    curr = tree.right(curr);
    yield t.note(11, {
      target: tree,
      i: curr ?? undefined,
      vars: { curr: curr ?? undefined },
      note: 'Now everything to its right.',
    });
  }

  yield t.note(13, {
    vars: { curr: undefined, result: -1 },
    note: `The tree has fewer than ${k} nodes.`,
  });
}

export const kthSmallestBST: AlgorithmDef = {
  id: 'kth-smallest-bst',
  name: 'Kth Smallest Element In a Bst',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'BST (level order)', kind: 'text', placeholder: '5, 3, 6, 2, 4, null, null, 1' },
    { key: 'k', label: 'k', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { tree: '5, 3, 6, 2, 4, null, null, 1', k: 3 },
  run,
};
