import { Tracer, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder, subtreeNodes } from './trees';

const code = `function isSubtree(root, sub) {
  if (sub === null) return true;
  if (root === null) return false;
  if (isSame(root, sub)) return true;
  return isSubtree(root.left, sub)
      || isSubtree(root.right, sub);
}

function isSame(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.val !== b.val) return false;
  return isSame(a.left, b.left) && isSame(a.right, b.right);
}`;

const POINTERS = ['node', 'a', 'b'];

function* same(
  t: Tracer,
  tree: TracedTree,
  a: number | null,
  b: number | null,
): Generator<AlgoEvent, boolean> {
  if (a === null && b === null) return true;
  if (a === null || b === null) {
    yield t.compare(11, {
      i: (a ?? b)!,
      note: 'One side ran out before the other.',
    });
    return false;
  }

  yield t.compare(12, {
    i: a,
    j: b,
    vars: { a, b },
    note: `${tree.value(a)} vs ${tree.value(b)}.`,
  });

  if (tree.value(a) !== tree.value(b)) return false;
  if (!(yield* same(t, tree, tree.left(a), tree.left(b)))) return false;
  return yield* same(t, tree, tree.right(a), tree.right(b));
}

function* search(
  t: Tracer,
  tree: TracedTree,
  node: number | null,
  sub: number | null,
): Generator<AlgoEvent, boolean> {
  if (sub === null) return true;
  if (node === null) {
    yield t.note(3, { note: 'Ran off the end of this branch.' });
    return false;
  }

  yield t.read(4, {
    i: node,
    vars: { node },
    note: `Try matching the pattern against ${tree.value(node)}.`,
  });

  if (yield* same(t, tree, node, sub)) {
    yield t.found(4, {
      indices: subtreeNodes(tree, node),
      vars: { a: undefined, b: undefined },
      note: `The subtree rooted at ${tree.value(node)} matches.`,
    });
    return true;
  }

  yield t.note(5, {
    i: node,
    vars: { a: undefined, b: undefined },
    note: `No match at ${tree.value(node)} — try its children.`,
  });

  if (yield* search(t, tree, tree.left(node), sub)) return true;
  return yield* search(t, tree, tree.right(node), sub);
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const t = new Tracer();
  const tree = t.tree('trees', 'root and subRoot', POINTERS);
  const root = buildTree(tree, parseLevelOrder(String(input.root ?? '')));
  const sub = buildTree(tree, parseLevelOrder(String(input.sub ?? '')));

  yield t.note(1, { note: 'At every node of the big tree, test whether the pattern matches from there.' });

  const result = yield* search(t, tree, root, sub);

  yield t.note(6, {
    vars: { node: undefined, a: undefined, b: undefined, result },
    note: result ? 'Found as a subtree.' : 'Not present as a subtree.',
  });
}

export const subtreeOfAnotherTree: AlgorithmDef = {
  id: 'subtree-of-another-tree',
  name: 'Subtree of Another Tree',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'root', label: 'root', kind: 'text', placeholder: '3, 4, 5, 1, 2' },
    { key: 'sub', label: 'subRoot', kind: 'text', placeholder: '4, 1, 2' },
  ],
  defaultInput: { root: '3, 4, 5, 1, 2', sub: '4, 1, 2' },
  run,
};
