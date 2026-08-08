import { Tracer, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function isValidBST(root) {
  return check(root, -Infinity, Infinity);
}

function check(node, lo, hi) {
  if (node === null) return true;
  if (node.val <= lo || node.val >= hi) return false;
  return check(node.left, lo, node.val)
      && check(node.right, node.val, hi);
}`;

const POINTERS = ['node'];

function show(v: number): string {
  if (v === Infinity) return '∞';
  if (v === -Infinity) return '−∞';
  return String(v);
}

function* check(
  t: Tracer,
  tree: TracedTree,
  node: number | null,
  lo: number,
  hi: number,
): Generator<AlgoEvent, boolean> {
  if (node === null) {
    yield t.note(6, { note: 'An empty branch is always valid.' });
    return true;
  }

  const v = tree.num(node);
  yield t.compare(7, {
    i: node,
    vars: { node, lo: show(lo), hi: show(hi) },
    note: `${v} must sit strictly between ${show(lo)} and ${show(hi)}.`,
  });

  if (v <= lo || v >= hi) {
    yield t.note(7, {
      i: node,
      note: `${v} violates its range — every ancestor constrains it, not just the parent.`,
    });
    return false;
  }

  if (!(yield* check(t, tree, tree.left(node), lo, v))) return false;
  return yield* check(t, tree, tree.right(node), v, hi);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));

  const t = new Tracer();
  const tree = t.tree('tree', 'tree', POINTERS);
  const root = buildTree(tree, values);

  yield t.note(1, {
    note: 'Checking each node against its parent is not enough — carry a range down from every ancestor.',
  });

  const result = yield* check(t, tree, root, -Infinity, Infinity);

  yield t.note(9, {
    vars: { node: undefined, lo: undefined, hi: undefined, result },
    note: result ? 'Every node respects its range — valid BST.' : 'Not a valid BST.',
  });
}

export const validateBST: AlgorithmDef = {
  id: 'validate-bst',
  name: 'Validate Binary Search Tree',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'tree (level order)', kind: 'text', placeholder: '5, 1, 4, null, null, 3, 6' },
  ],
  defaultInput: { tree: '5, 1, 4, null, null, 3, 6' },
  run,
};
