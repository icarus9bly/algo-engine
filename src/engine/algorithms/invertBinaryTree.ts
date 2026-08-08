import { Tracer, type TracedArray, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder, subtreeNodes } from './trees';

const code = `function invertTree(root) {
  if (root === null) return null;
  const tmp = root.left;
  root.left = root.right;
  root.right = tmp;
  invertTree(root.left);
  invertTree(root.right);
  return root;
}`;

const POINTERS = ['node'];

function* invert(
  t: Tracer,
  tree: TracedTree,
  stack: TracedArray,
  node: number | null,
): Generator<AlgoEvent> {
  if (node === null) {
    yield t.note(2, { note: 'Nothing here — return.' });
    return;
  }

  yield t.push(2, stack, String(tree.value(node)), {
    note: `Recurse into ${tree.value(node)}.`,
  });

  const left = tree.left(node);
  const right = tree.right(node);
  yield t.read(3, {
    target: tree,
    i: node,
    vars: { node },
    note: `Children of ${tree.value(node)}: ${left === null ? 'none' : tree.value(left)} and ${right === null ? 'none' : tree.value(right)}.`,
  });

  yield t.setChild(4, tree, node, 'left', right, {
    note: 'The right child becomes the left child.',
  });
  yield t.setChild(5, tree, node, 'right', left, {
    note: 'And the old left child becomes the right.',
  });

  yield* invert(t, tree, stack, tree.left(node));
  yield* invert(t, tree, stack, tree.right(node));

  yield t.read(8, { target: stack, i: stack.length - 1, note: `Done with ${tree.value(node)}.` });
  yield t.pop(8, stack, { note: `Return from ${tree.value(node)} to its parent.` });
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));
  if (values.length > 31) throw new Error('Keep the tree to 31 nodes or fewer.');

  const t = new Tracer();
  const tree = t.tree('tree', 'tree', POINTERS);
  const stack = t.array('stack', [], 'call stack', []);
  const root = buildTree(tree, values);

  yield t.note(1, { note: 'Swap the two children of every node, top down.' });

  yield* invert(t, tree, stack, root);

  yield t.settle(8, tree, subtreeNodes(tree, root), {
    vars: { node: undefined },
    note: 'Every node has had its children swapped — the tree is mirrored.',
  });
}

export const invertBinaryTree: AlgorithmDef = {
  id: 'invert-binary-tree',
  name: 'Invert Binary Tree',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'tree (level order)', kind: 'text', placeholder: '4, 2, 7, 1, 3, 6, 9' },
  ],
  defaultInput: { tree: '4, 2, 7, 1, 3, 6, 9' },
  run,
};
