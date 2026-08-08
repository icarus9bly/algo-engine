import { Tracer, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function isSameTree(p, q) {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  if (p.val !== q.val) return false;
  return isSameTree(p.left, q.left)
      && isSameTree(p.right, q.right);
}`;

const POINTERS = ['p', 'q'];

function* same(
  t: Tracer,
  tree: TracedTree,
  p: number | null,
  q: number | null,
): Generator<AlgoEvent, boolean> {
  if (p === null && q === null) {
    yield t.note(2, { note: 'Both branches ended together.' });
    return true;
  }

  if (p === null || q === null) {
    yield t.compare(3, {
      i: (p ?? q)!,
      vars: { p: p ?? undefined, q: q ?? undefined },
      note: 'One branch ended and the other did not — the shapes differ.',
    });
    return false;
  }

  yield t.compare(4, {
    i: p,
    j: q,
    vars: { p, q },
    note: `${tree.value(p)} vs ${tree.value(q)} — ${tree.value(p) === tree.value(q) ? 'equal' : 'different'}.`,
  });

  if (tree.value(p) !== tree.value(q)) return false;

  if (!(yield* same(t, tree, tree.left(p), tree.left(q)))) return false;
  return yield* same(t, tree, tree.right(p), tree.right(q));
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const t = new Tracer();
  // One structure, two roots: the trees sit side by side and share a coordinate
  // space, so the compared pair highlights together.
  const tree = t.tree('trees', 'p and q', POINTERS);
  const p = buildTree(tree, parseLevelOrder(String(input.p ?? '')));
  const q = buildTree(tree, parseLevelOrder(String(input.q ?? '')));

  yield t.note(1, { note: 'Walk both trees in lockstep; any difference in shape or value ends it.' });

  const result = yield* same(t, tree, p, q);

  yield t.note(6, {
    vars: { p: undefined, q: undefined, result },
    note: result ? 'Identical in shape and values.' : 'The trees differ.',
  });
}

export const sameTree: AlgorithmDef = {
  id: 'same-tree',
  name: 'Same Tree',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'p', label: 'p (level order)', kind: 'text', placeholder: '1, 2, 3' },
    { key: 'q', label: 'q (level order)', kind: 'text', placeholder: '1, 2, 3' },
  ],
  defaultInput: { p: '1, 2, 3', q: '1, 2, 3' },
  run,
};
