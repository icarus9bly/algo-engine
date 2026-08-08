import { Tracer, type TracedArray, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function maxDepth(root) {
  if (root === null) return 0;
  const left = maxDepth(root.left);
  const right = maxDepth(root.right);
  return 1 + Math.max(left, right);
}`;

const POINTERS = ['node'];

function* depth(
  t: Tracer,
  tree: TracedTree,
  stack: TracedArray,
  node: number | null,
): Generator<AlgoEvent, number> {
  if (node === null) {
    yield t.note(2, { note: 'An empty branch has depth 0.' });
    return 0;
  }

  yield t.push(3, stack, String(tree.value(node)), {
    note: `Measure the subtree under ${tree.value(node)}.`,
  });
  yield t.read(3, {
    target: tree,
    i: node,
    vars: { node },
    note: `Go down the left side of ${tree.value(node)} first.`,
  });

  const left = yield* depth(t, tree, stack, tree.left(node));
  yield t.note(3, {
    target: tree,
    i: node,
    vars: { node, left },
    note: `The left side of ${tree.value(node)} is ${left} deep.`,
  });

  const right = yield* depth(t, tree, stack, tree.right(node));
  yield t.note(4, {
    target: tree,
    i: node,
    vars: { node, right },
    note: `The right side of ${tree.value(node)} is ${right} deep.`,
  });

  const result = 1 + Math.max(left, right);
  yield t.read(5, {
    target: stack,
    i: stack.length - 1,
    vars: { node },
    note: `${tree.value(node)} sits above a deeper side of ${Math.max(left, right)}, so its depth is ${result}.`,
  });
  yield t.pop(5, stack, { note: `Return ${result} up to the caller.` });
  return result;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));
  if (values.length > 31) throw new Error('Keep the tree to 31 nodes or fewer.');

  const t = new Tracer();
  const tree = t.tree('tree', 'tree', POINTERS);
  const stack = t.array('stack', [], 'call stack', []);
  const root = buildTree(tree, values);

  yield t.note(1, { note: "A node's depth is one more than its deeper side." });

  const result = yield* depth(t, tree, stack, root);

  yield t.note(5, {
    vars: { node: undefined, left: undefined, right: undefined, result },
    note: `Maximum depth: ${result}.`,
  });
}

export const maxDepthBinaryTree: AlgorithmDef = {
  id: 'max-depth-binary-tree',
  name: 'Maximum Depth of Binary Tree',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'tree (level order)', kind: 'text', placeholder: '3, 9, 20, null, null, 15, 7' },
  ],
  defaultInput: { tree: '3, 9, 20, null, null, 15, 7' },
  run,
};
