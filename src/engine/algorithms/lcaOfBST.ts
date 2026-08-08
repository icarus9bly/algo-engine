import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function lowestCommonAncestor(root, p, q) {
  let curr = root;
  while (curr !== null) {
    if (p > curr.val && q > curr.val) curr = curr.right;
    else if (p < curr.val && q < curr.val) curr = curr.left;
    else return curr;
  }
  return null;
}`;

const POINTERS = ['curr'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));
  const p = input.p as number;
  const q = input.q as number;

  const t = new Tracer();
  const tree = t.tree('tree', 'BST', POINTERS);
  const root = buildTree(tree, values);
  t.setVars({ p, q });

  yield t.note(1, {
    note: `The split point is the first node with ${p} and ${q} on opposite sides — no recursion needed.`,
  });

  let curr = root;
  yield t.note(2, { i: curr ?? undefined, vars: { curr: curr ?? undefined } });

  while (curr !== null) {
    const v = tree.num(curr);

    if (p > v && q > v) {
      yield t.compare(4, { i: curr, note: `Both ${p} and ${q} are bigger than ${v} — go right.` });
      curr = tree.right(curr);
      yield t.note(4, { i: curr ?? undefined, vars: { curr: curr ?? undefined } });
    } else if (p < v && q < v) {
      yield t.compare(5, { i: curr, note: `Both ${p} and ${q} are smaller than ${v} — go left.` });
      curr = tree.left(curr);
      yield t.note(5, { i: curr ?? undefined, vars: { curr: curr ?? undefined } });
    } else {
      yield t.found(6, {
        i: curr,
        vars: { result: v },
        note: `${p} and ${q} sit on opposite sides of ${v} (or one is ${v}) — this is the split point.`,
      });
      return;
    }
  }

  yield t.note(8, { vars: { curr: undefined, result: null }, note: 'Ran off the tree.' });
}

export const lcaOfBST: AlgorithmDef = {
  id: 'lca-of-bst',
  name: 'Lowest Common Ancestor of a BST',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'BST (level order)', kind: 'text', placeholder: '6,2,8,0,4,7,9' },
    { key: 'p', label: 'p', kind: 'number', placeholder: '2' },
    { key: 'q', label: 'q', kind: 'number', placeholder: '8' },
  ],
  defaultInput: { tree: '6, 2, 8, 0, 4, 7, 9', p: 2, q: 8 },
  run,
};
