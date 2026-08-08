import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildTree, parseLevelOrder } from './trees';

const code = `function levelOrder(root) {
  const res = [], queue = root !== null ? [root] : [];
  while (queue.length > 0) {
    const level = [];
    for (let n = queue.length; n > 0; n--) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left !== null) queue.push(node.left);
      if (node.right !== null) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}`;

const POINTERS = ['node'];

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const values = parseLevelOrder(String(input.tree ?? ''));
  if (values.length > 31) throw new Error('Keep the tree to 31 nodes or fewer.');

  const t = new Tracer();
  const tree = t.tree('tree', 'tree', POINTERS);
  const queue = t.array('queue', [], 'queue (front on the left)', []);
  const root = buildTree(tree, values);

  yield t.note(1, {
    note: 'Breadth-first: the queue always holds exactly the nodes of the row being visited.',
  });

  // Node indices tracked alongside the queue cells, which hold display values.
  const pending: number[] = [];
  if (root !== null) {
    pending.push(root);
    yield t.push(2, queue, String(tree.value(root)), {
      note: 'Seed the queue with the root.',
    });
  }

  const res: string[] = [];
  let depth = 0;

  while (pending.length > 0) {
    const width = pending.length;
    const level: string[] = [];
    yield t.note(4, {
      target: tree,
      indices: [...pending],
      vars: { depth, width },
      note: `Row ${depth} has ${width} node${width === 1 ? '' : 's'} — everything currently queued.`,
    });

    for (let n = width; n > 0; n--) {
      const node = pending.shift()!;
      yield t.read(6, {
        target: tree,
        i: node,
        vars: { node },
        note: `Take ${tree.value(node)} off the front.`,
      });
      yield t.shift(6, queue, {
        note: `${tree.value(node)} leaves the queue; everything behind it shifts forward.`,
      });

      level.push(String(tree.value(node)));

      const left = tree.left(node);
      if (left !== null) {
        pending.push(left);
        yield t.push(8, queue, String(tree.value(left)), {
          note: `Queue its left child, ${tree.value(left)}, for the next row.`,
        });
      }

      const right = tree.right(node);
      if (right !== null) {
        pending.push(right);
        yield t.push(9, queue, String(tree.value(right)), {
          note: `Queue its right child, ${tree.value(right)}.`,
        });
      }
    }

    res.push(`[${level.join(', ')}]`);
    yield t.note(11, {
      target: tree,
      vars: { res: [...res], node: undefined },
      note: `Row ${depth} complete: ${level.join(', ')}.`,
    });
    depth++;
  }

  yield t.note(13, {
    vars: { depth: undefined, width: undefined, res: [...res] },
    note: `${res.length} row${res.length === 1 ? '' : 's'}.`,
  });
}

export const levelOrderTraversal: AlgorithmDef = {
  id: 'level-order-traversal',
  name: 'Binary Tree Level Order Traversal',
  category: 'Trees',
  code,
  inputFields: [
    { key: 'tree', label: 'tree (level order)', kind: 'text', placeholder: '3, 9, 20, null, null, 15, 7' },
  ],
  defaultInput: { tree: '3, 9, 20, null, null, 15, 7' },
  run,
};
