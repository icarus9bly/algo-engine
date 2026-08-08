import { Tracer, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function maxPathSum(root) {
  let best = -Infinity;
  function gain(node) {
    if (node === null) return 0;
    const left = Math.max(gain(node.left), 0);
    const right = Math.max(gain(node.right), 0);
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  }
  gain(root);
  return best;
}`;

const POINTERS = ['node'];

interface Best {
  value: number;
  at: number | null;
}

function* gain(
  t: Tracer,
  tree: TracedTree,
  node: number | null,
  best: Best,
): Generator<AlgoEvent, number> {
  if (node === null) return 0;

  yield t.read(4, { i: node, vars: { node }, note: `What can ${tree.value(node)} contribute upward?` });

  const rawLeft = yield* gain(t, tree, tree.left(node), best);
  const left = Math.max(rawLeft, 0);
  if (tree.left(node) !== null) {
    yield t.note(5, {
      i: node,
      j: tree.left(node)!,
      vars: { left },
      note: rawLeft < 0
        ? `The left branch is worth ${rawLeft} — worse than nothing, so ignore it.`
        : `The left branch adds ${left}.`,
    });
  }

  const rawRight = yield* gain(t, tree, tree.right(node), best);
  const right = Math.max(rawRight, 0);
  if (tree.right(node) !== null) {
    yield t.note(6, {
      i: node,
      j: tree.right(node)!,
      vars: { right },
      note: rawRight < 0
        ? `The right branch is worth ${rawRight} — drop it.`
        : `The right branch adds ${right}.`,
    });
  }

  const through = tree.num(node) + left + right;
  if (through > best.value) {
    best.value = through;
    best.at = node;
    yield t.found(7, {
      i: node,
      vars: { best: through },
      note: `A path turning at ${tree.value(node)} is worth ${through} — the best so far.`,
    });
  } else {
    yield t.compare(7, {
      i: node,
      vars: { through },
      note: `Turning here is worth ${through}, which does not beat ${best.value}.`,
    });
  }

  const upward = tree.num(node) + Math.max(left, right);
  yield t.note(8, {
    i: node,
    vars: { upward },
    note: `Upward, only one side can be used: ${tree.value(node)} + ${Math.max(left, right)} = ${upward}.`,
  });
  return upward;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));

  const t = new Tracer();
  const tree = t.tree('tree', 'tree', POINTERS);
  const root = buildTree(tree, values);

  yield t.note(1, {
    note: 'A path may turn at one node, but what it hands to its parent can only use one side.',
  });

  if (root === null) {
    yield t.note(11, { vars: { result: 0 }, note: 'Empty tree.' });
    return;
  }

  const best: Best = { value: -Infinity, at: null };
  yield* gain(t, tree, root, best);

  yield t.settle(11, tree, best.at === null ? [] : [best.at], {
    vars: { node: undefined, left: undefined, right: undefined, upward: undefined, through: undefined, result: best.value },
    note: `Maximum path sum: ${best.value}.`,
  });
}

export const binaryTreeMaxPathSum: AlgorithmDef = {
  id: 'binary-tree-max-path-sum',
  name: 'Binary Tree Maximum Path Sum',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'tree (level order)', kind: 'text', placeholder: '-10, 9, 20, null, null, 15, 7' },
  ],
  defaultInput: { tree: '-10, 9, 20, null, null, 15, 7' },
  run,
};
