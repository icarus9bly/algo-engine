import { Tracer, type TracedArray, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function build(preorder, inorder) {
  if (preorder.length === 0) return null;
  const root = new Node(preorder[0]);
  const mid = inorder.indexOf(preorder[0]);
  root.left = build(preorder.slice(1, mid + 1),
                    inorder.slice(0, mid));
  root.right = build(preorder.slice(mid + 1),
                     inorder.slice(mid + 1));
  return root;
}`;

function* build(
  t: Tracer,
  tree: TracedTree,
  pre: TracedArray,
  ino: TracedArray,
  preLo: number,
  preHi: number,
  inLo: number,
  inHi: number,
): Generator<AlgoEvent, number | null> {
  if (preLo > preHi) {
    yield t.note(2, { note: 'Empty slice — no node here.' });
    return null;
  }

  const value = pre.num(preLo);
  yield t.read(3, {
    target: pre,
    i: preLo,
    note: `Pre-order always names the root first: ${value}.`,
  });

  const node = tree.add(value);
  yield t.emit('write', 3, {
    target: tree,
    i: node,
    note: `Create ${value}.`,
  });

  let mid = inLo;
  while (mid <= inHi && ino.num(mid) !== value) mid++;
  yield t.compare(4, {
    target: ino,
    i: mid,
    indices: Array.from({ length: inHi - inLo + 1 }, (_, d) => inLo + d),
    vars: { mid },
    note: `In-order puts ${value} at ${mid}: everything left of it is its left subtree, everything right its right.`,
  });

  const leftSize = mid - inLo;

  const left = yield* build(t, tree, pre, ino, preLo + 1, preLo + leftSize, inLo, mid - 1);
  if (left !== null) {
    yield t.setChild(5, tree, node, 'left', left, {
      note: `Attach ${tree.value(left)} as the left child of ${value}.`,
    });
  }

  const right = yield* build(t, tree, pre, ino, preLo + leftSize + 1, preHi, mid + 1, inHi);
  if (right !== null) {
    yield t.setChild(7, tree, node, 'right', right, {
      note: `Attach ${tree.value(right)} as the right child of ${value}.`,
    });
  }

  return node;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const preorder = input.preorder as number[];
  const inorder = input.inorder as number[];
  if (preorder.length !== inorder.length) {
    throw new Error('preorder and inorder must have the same length.');
  }
  if (new Set(preorder).size !== preorder.length) {
    throw new Error('Values must be distinct.');
  }
  if ([...preorder].sort().join() !== [...inorder].sort().join()) {
    throw new Error('Both traversals must contain the same values.');
  }

  const t = new Tracer();
  const pre = t.array('preorder', preorder, 'preorder', []);
  const ino = t.array('inorder', inorder, 'inorder', ['mid']);
  const tree = t.tree('tree', 'reconstructed tree', []);

  yield t.note(1, {
    note: 'Pre-order gives the root; in-order says how many nodes fall on each side of it.',
  });

  const root = yield* build(t, tree, pre, ino, 0, preorder.length - 1, 0, inorder.length - 1);
  if (root !== null) tree.addRoot(root);

  yield t.settle(9, tree, tree.nodes.map((_, d) => d), {
    vars: { mid: undefined },
    note: 'Tree rebuilt from the two traversals.',
  });
}

export const constructTreeFromTraversals: AlgorithmDef = {
  id: 'construct-tree-from-traversals',
  name: 'Construct Binary Tree From Preorder And Inorder Traversal',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'preorder', label: 'preorder', kind: 'numbers', placeholder: '3, 9, 20, 15, 7' },
    { key: 'inorder', label: 'inorder', kind: 'numbers', placeholder: '9, 3, 15, 20, 7' },
  ],
  defaultInput: { preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] },
  run,
};
