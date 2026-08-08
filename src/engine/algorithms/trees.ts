import type { TracedTree } from '../tracer';

/**
 * Parses the level-order-with-holes notation used on LeetCode:
 * `3, 9, 20, null, null, 15, 7`. `null`, `n` and `-` all mean "no node".
 */
export function parseLevelOrder(raw: string): (number | null)[] {
  const tokens = String(raw).split(/[\s,]+/).filter(Boolean);
  return tokens.map((tok) => {
    if (tok === 'null' || tok === 'n' || tok === '-') return null;
    const v = Number(tok);
    if (Number.isNaN(v)) throw new Error(`"${tok}" is not a number or null.`);
    return v;
  });
}

/**
 * Builds a tree from level-order values and registers it as a root.
 * Returns the root index, or null for an empty tree.
 */
export function buildTree(tree: TracedTree, values: (number | null)[]): number | null {
  if (values.length === 0 || values[0] === null) return null;

  const root = tree.add(values[0]);
  const queue = [root];
  let qi = 0;
  let k = 1;

  while (k < values.length && qi < queue.length) {
    const parent = queue[qi++];
    if (k < values.length) {
      const v = values[k++];
      if (v !== null) {
        const child = tree.add(v);
        tree.setLeft(parent, child);
        queue.push(child);
      }
    }
    if (k < values.length) {
      const v = values[k++];
      if (v !== null) {
        const child = tree.add(v);
        tree.setRight(parent, child);
        queue.push(child);
      }
    }
  }

  tree.addRoot(root);
  return root;
}

/** Every node reachable from `root`, in pre-order. */
export function subtreeNodes(tree: TracedTree, root: number | null): number[] {
  const out: number[] = [];
  const walk = (idx: number | null) => {
    if (idx === null) return;
    out.push(idx);
    walk(tree.left(idx));
    walk(tree.right(idx));
  };
  walk(root);
  return out;
}
