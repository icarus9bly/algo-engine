import { Tracer, type TracedArray, type TracedTree } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function serialize(root) {
  const out = [];
  (function dfs(node) {
    if (node === null) { out.push('N'); return; }
    out.push(node.val);
    dfs(node.left);
    dfs(node.right);
  })(root);
  return out.join(',');
}

function deserialize(data) {
  const vals = data.split(',');
  let i = 0;
  function dfs() {
    if (vals[i] === 'N') { i++; return null; }
    const node = new Node(Number(vals[i++]));
    node.left = dfs();
    node.right = dfs();
    return node;
  }
  return dfs();
}`;

function* encode(
  t: Tracer,
  tree: TracedTree,
  out: TracedArray,
  node: number | null,
): Generator<AlgoEvent> {
  if (node === null) {
    yield t.push(4, out, 'N', {
      note: 'Record the empty slot — the nulls are what make the encoding unambiguous.',
    });
    return;
  }

  yield t.read(5, {
    target: tree,
    i: node,
    vars: { node },
    note: `Visit ${tree.value(node)} — pre-order writes the node before its children.`,
  });
  yield t.push(5, out, String(tree.value(node)), { note: `Emit ${tree.value(node)}.` });
  yield* encode(t, tree, out, tree.left(node));
  yield* encode(t, tree, out, tree.right(node));
}

interface Cursor {
  i: number;
}

function* decode(
  t: Tracer,
  rebuilt: TracedTree,
  out: TracedArray,
  cur: Cursor,
): Generator<AlgoEvent, number | null> {
  const token = String(out.at(cur.i));

  if (token === 'N') {
    yield t.read(16, {
      target: out,
      i: cur.i,
      vars: { i: cur.i },
      note: 'An N closes off this branch.',
    });
    cur.i++;
    return null;
  }

  yield t.read(17, {
    target: out,
    i: cur.i,
    vars: { i: cur.i },
    note: `Rebuild node ${token}.`,
  });
  const node = rebuilt.add(Number(token));
  cur.i++;
  yield t.emit('write', 17, { target: rebuilt, i: node, note: `Created ${token}.` });

  const left = yield* decode(t, rebuilt, out, cur);
  if (left !== null) {
    yield t.setChild(18, rebuilt, node, 'left', left, {
      note: `Whatever the next tokens built becomes ${token}'s left child.`,
    });
  }

  const right = yield* decode(t, rebuilt, out, cur);
  if (right !== null) {
    yield t.setChild(19, rebuilt, node, 'right', right, {
      note: `And the tokens after that become ${token}'s right child.`,
    });
  }

  return node;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));
  if (values.length > 15) throw new Error('Keep the tree to 15 nodes or fewer.');

  const t = new Tracer();
  const tree = t.tree('tree', 'original tree', ['node']);
  const out = t.array('encoded', [], 'encoded', ['i']);
  const root = buildTree(tree, values);

  yield t.note(1, {
    note: 'Pre-order plus an explicit marker for every empty child is enough to rebuild the tree exactly.',
  });

  yield* encode(t, tree, out, root);
  yield t.note(9, {
    target: out,
    vars: { node: undefined, encoded: out.values.join(',') },
    note: `Serialized: ${out.values.join(',')}`,
  });

  const rebuilt = t.tree('rebuilt', 'rebuilt tree', []);
  yield t.note(12, { target: rebuilt, note: 'Now read the same sequence back.' });

  const cur: Cursor = { i: 0 };
  const newRoot = yield* decode(t, rebuilt, out, cur);
  if (newRoot !== null) rebuilt.addRoot(newRoot);

  yield t.settle(22, rebuilt, rebuilt.nodes.map((_, d) => d), {
    vars: { i: undefined },
    note: 'Rebuilt tree matches the original.',
  });
}

export const serializeDeserializeTree: AlgorithmDef = {
  id: 'serialize-deserialize-tree',
  name: 'Serialize And Deserialize Binary Tree',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'tree (level order)', kind: 'text', placeholder: '1, 2, 3, null, null, 4, 5' },
  ],
  defaultInput: { tree: '1, 2, 3, null, null, 4, 5' },
  run,
};
