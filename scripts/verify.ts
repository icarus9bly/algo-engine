import { algorithms } from '../src/engine/registry';
import type { AlgoEvent, Structure } from '../src/engine/types';

type Vars = Record<string, unknown>;
type Check = (vars: Vars, structures: Structure[], events: AlgoEvent[]) => unknown;

interface Case {
  id: string;
  input: Record<string, unknown>;
  expect: unknown;
  got: Check;
}

const arr = (structures: Structure[], id: string) => {
  const s = structures.find((st) => st.id === id);
  return s && s.kind === 'array' ? s.values : [];
};

/** Positions a structure has, whatever its kind — used for bounds checking. */
const sizeOf = (s: Structure) => {
  if (s.kind === 'array') return s.values.length;
  if (s.kind === 'grid') return s.cells.length;
  return s.nodes.length;
};

/** Node values of a graph, in creation order. */
const graphOf = (structures: Structure[], id: string): string => {
  const s = structures.find((st) => st.id === id);
  if (!s || s.kind !== 'graph') return '';
  return s.nodes.map((n) => `${n.value}:${[...n.edges].sort((a, b) => a - b).join('')}`).join(' ');
};

/** A grid rendered as `row; row; row`, matching the input notation. */
const gridOf = (structures: Structure[], id: string): string => {
  const s = structures.find((st) => st.id === id);
  if (!s || s.kind !== 'grid') return '';
  const rows: string[] = [];
  for (let r = 0; r < s.rows; r++) {
    rows.push(s.cells.slice(r * s.cols, (r + 1) * s.cols).join(','));
  }
  return rows.join('; ');
};

/**
 * Level-order rendering of a tree, with `null` for holes — the same notation
 * the inputs use, so expectations read like LeetCode.
 */
const levels = (structures: Structure[], id: string, rootAt = 0): string => {
  const s = structures.find((st) => st.id === id);
  if (!s || s.kind !== 'tree') return '';
  const root = s.roots[rootAt];
  if (root === undefined) return '';

  const out: string[] = [];
  let queue: (number | null)[] = [root];
  const guard = new Set<number>();

  while (queue.some((n) => n !== null)) {
    const next: (number | null)[] = [];
    for (const idx of queue) {
      if (idx === null) {
        out.push('null');
        continue;
      }
      if (guard.has(idx)) return `${out.join(',')}<cycle>`;
      guard.add(idx);
      out.push(String(s.nodes[idx].value));
      next.push(s.nodes[idx].left, s.nodes[idx].right);
    }
    queue = next;
  }

  // Drop the trailing nulls that pad the last level.
  while (out.length > 0 && out[out.length - 1] === 'null') out.pop();
  return out.join(',');
};

/**
 * Walks a list from `head` and returns its values. Bails out if it revisits a
 * node, so a cycle is reported rather than hanging the verifier.
 */
const walk = (structures: Structure[], id: string, head: number | null): string => {
  const s = structures.find((st) => st.id === id);
  if (!s || s.kind !== 'list' || head === null) return '';
  const seen = new Set<number>();
  const out: string[] = [];
  for (let at: number | null = head; at !== null; at = s.nodes[at].next) {
    if (seen.has(at)) return `${out.join(',')}<cycle>`;
    seen.add(at);
    out.push(String(s.nodes[at].value));
  }
  return out.join(',');
};

/** The value of a pointer variable in the final event, or null. */
const ptr = (vars: Vars, name: string): number | null =>
  typeof vars[name] === 'number' ? (vars[name] as number) : null;

const cases: Case[] = [
  // Arrays & Hashing
  { id: 'top-k-frequent', input: { nums: [1, 1, 1, 2, 2, 3], k: 2 }, expect: '1,2', got: (v) => String(v.res) },
  { id: 'top-k-frequent', input: { nums: [7], k: 1 }, expect: '7', got: (v) => String(v.res) },
  { id: 'top-k-frequent', input: { nums: [], k: 1 }, expect: '', got: (v) => String(v.res) },
  { id: 'encode-decode-strings', input: { strs: ['neet', 'code', 'love', 'you'] }, expect: 'neet,code,love,you', got: (_v, s) => arr(s, 'decoded').join(',') },
  { id: 'encode-decode-strings', input: { strs: ['a'] }, expect: 'a', got: (_v, s) => arr(s, 'decoded').join(',') },
  { id: 'encode-decode-strings', input: { strs: [] }, expect: '', got: (_v, s) => arr(s, 'decoded').join(',') },
  { id: 'product-except-self', input: { nums: [1, 2, 3, 4] }, expect: '24,12,8,6', got: (_v, s) => arr(s, 'res').join(',') },
  { id: 'product-except-self', input: { nums: [-1, 1, 0, -3, 3] }, expect: '0,0,9,0,0', got: (_v, s) => arr(s, 'res').join(',') },
  { id: 'longest-consecutive', input: { nums: [100, 4, 200, 1, 3, 2] }, expect: 4, got: (v) => v.best },
  { id: 'longest-consecutive', input: { nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] }, expect: 9, got: (v) => v.best },
  { id: 'longest-consecutive', input: { nums: [] }, expect: 0, got: (v) => v.best },
  // Two Pointers
  { id: 'container-with-most-water', input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expect: 49, got: (v) => v.best },
  { id: 'container-with-most-water', input: { height: [1, 1] }, expect: 1, got: (v) => v.best },
  // Sliding Window
  { id: 'best-time-to-buy-sell-stock', input: { prices: [7, 1, 5, 3, 6, 4] }, expect: 5, got: (v) => v.best },
  { id: 'best-time-to-buy-sell-stock', input: { prices: [7, 6, 4, 3, 1] }, expect: 0, got: (v) => v.best },
  { id: 'longest-substring-without-repeating', input: { s: 'abcabcbb' }, expect: 3, got: (v) => v.best },
  { id: 'longest-substring-without-repeating', input: { s: 'bbbbb' }, expect: 1, got: (v) => v.best },
  { id: 'longest-substring-without-repeating', input: { s: 'pwwkew' }, expect: 3, got: (v) => v.best },
  { id: 'longest-substring-without-repeating', input: { s: '' }, expect: 0, got: (v) => v.best },
  { id: 'longest-repeating-character-replacement', input: { s: 'AABABBA', k: 1 }, expect: 4, got: (v) => v.best },
  { id: 'longest-repeating-character-replacement', input: { s: 'ABAB', k: 2 }, expect: 4, got: (v) => v.best },
  { id: 'minimum-window-substring', input: { s: 'ADOBECODEBANC', t: 'ABC' }, expect: 'BANC', got: (v) => v.best },
  { id: 'minimum-window-substring', input: { s: 'a', t: 'aa' }, expect: '', got: (v) => v.best },
  { id: 'minimum-window-substring', input: { s: 'a', t: 'a' }, expect: 'a', got: (v) => v.best },
  // Stack
  { id: 'valid-parentheses', input: { s: '([{}])' }, expect: true, got: (v) => v.result },
  { id: 'valid-parentheses', input: { s: '(]' }, expect: false, got: (v) => v.result },
  { id: 'valid-parentheses', input: { s: '(' }, expect: false, got: (v) => v.result },
  { id: 'valid-parentheses', input: { s: ')' }, expect: false, got: (v) => v.result },
  // Binary Search
  { id: 'find-min-rotated', input: { nums: [4, 5, 6, 7, 0, 1, 2] }, expect: 0, got: (v) => v.result },
  { id: 'find-min-rotated', input: { nums: [11, 13, 15, 17] }, expect: 11, got: (v) => v.result },
  { id: 'find-min-rotated', input: { nums: [2, 1] }, expect: 1, got: (v) => v.result },
  { id: 'search-rotated', input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }, expect: 4, got: (v) => v.result },
  { id: 'search-rotated', input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 }, expect: -1, got: (v) => v.result },
  { id: 'search-rotated', input: { nums: [1], target: 1 }, expect: 0, got: (v) => v.result },
  // 1-D Dynamic Programming
  { id: 'climbing-stairs', input: { n: 5 }, expect: 8, got: (v) => v.result },
  { id: 'climbing-stairs', input: { n: 1 }, expect: 1, got: (v) => v.result },
  { id: 'climbing-stairs', input: { n: 0 }, expect: 1, got: (v) => v.result },
  { id: 'house-robber', input: { nums: [2, 7, 9, 3, 1] }, expect: 12, got: (v) => v.result },
  { id: 'house-robber', input: { nums: [1, 2, 3, 1] }, expect: 4, got: (v) => v.result },
  { id: 'house-robber', input: { nums: [5] }, expect: 5, got: (v) => v.result },
  { id: 'house-robber', input: { nums: [] }, expect: 0, got: (v) => v.result },
  { id: 'house-robber-ii', input: { nums: [2, 3, 2] }, expect: 3, got: (v) => v.result },
  { id: 'house-robber-ii', input: { nums: [1, 2, 3, 1] }, expect: 4, got: (v) => v.result },
  { id: 'house-robber-ii', input: { nums: [1, 2, 3] }, expect: 3, got: (v) => v.result },
  { id: 'house-robber-ii', input: { nums: [7] }, expect: 7, got: (v) => v.result },
  { id: 'longest-palindromic-substring', input: { s: 'babad' }, expect: 'bab', got: (v) => v.best },
  { id: 'longest-palindromic-substring', input: { s: 'cbbd' }, expect: 'bb', got: (v) => v.best },
  { id: 'longest-palindromic-substring', input: { s: 'a' }, expect: 'a', got: (v) => v.best },
  { id: 'palindromic-substrings', input: { s: 'aaa' }, expect: 6, got: (v) => v.count },
  { id: 'palindromic-substrings', input: { s: 'abc' }, expect: 3, got: (v) => v.count },
  { id: 'decode-ways', input: { s: '226' }, expect: 3, got: (v) => v.result },
  { id: 'decode-ways', input: { s: '06' }, expect: 0, got: (v) => v.result },
  { id: 'decode-ways', input: { s: '12' }, expect: 2, got: (v) => v.result },
  { id: 'decode-ways', input: { s: '27' }, expect: 1, got: (v) => v.result },
  { id: 'coin-change', input: { coins: [1, 3, 4], amount: 6 }, expect: 2, got: (v) => v.result },
  { id: 'coin-change', input: { coins: [2], amount: 3 }, expect: -1, got: (v) => v.result },
  { id: 'coin-change', input: { coins: [1], amount: 0 }, expect: 0, got: (v) => v.result },
  { id: 'max-product-subarray', input: { nums: [2, 3, -2, 4] }, expect: 6, got: (v) => v.result },
  { id: 'max-product-subarray', input: { nums: [-2, 0, -1] }, expect: 0, got: (v) => v.result },
  { id: 'max-product-subarray', input: { nums: [-2, 3, -4] }, expect: 24, got: (v) => v.result },
  { id: 'word-break', input: { s: 'leetcode', words: ['leet', 'code'] }, expect: true, got: (v) => v.result },
  { id: 'word-break', input: { s: 'catsandog', words: ['cats', 'dog', 'sand', 'and', 'cat'] }, expect: false, got: (v) => v.result },
  { id: 'word-break', input: { s: 'applepenapple', words: ['apple', 'pen'] }, expect: true, got: (v) => v.result },
  { id: 'longest-increasing-subsequence', input: { nums: [10, 9, 2, 5, 3, 7, 101, 18] }, expect: 4, got: (v) => v.result },
  { id: 'longest-increasing-subsequence', input: { nums: [7, 7, 7] }, expect: 1, got: (v) => v.result },
  { id: 'longest-increasing-subsequence', input: { nums: [] }, expect: 0, got: (v) => v.result },
  // Greedy
  { id: 'maximum-subarray', input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expect: 6, got: (v) => v.result },
  { id: 'maximum-subarray', input: { nums: [-3, -1, -2] }, expect: -1, got: (v) => v.result },
  { id: 'maximum-subarray', input: { nums: [1] }, expect: 1, got: (v) => v.result },
  { id: 'jump-game', input: { nums: [2, 3, 1, 1, 4] }, expect: true, got: (v) => v.result },
  { id: 'jump-game', input: { nums: [3, 2, 1, 0, 4] }, expect: false, got: (v) => v.result },
  { id: 'jump-game', input: { nums: [0] }, expect: true, got: (v) => v.result },
  // Bit Manipulation
  { id: 'number-of-one-bits', input: { n: 11 }, expect: 3, got: (v) => v.result },
  { id: 'number-of-one-bits', input: { n: 0 }, expect: 0, got: (v) => v.result },
  { id: 'number-of-one-bits', input: { n: 2147483647 }, expect: 31, got: (v) => v.result },
  { id: 'counting-bits', input: { n: 8 }, expect: '0,1,1,2,1,2,2,3,1', got: (v) => v.result },
  { id: 'counting-bits', input: { n: 0 }, expect: '0', got: (v) => v.result },
  { id: 'reverse-bits', input: { n: 43261596 }, expect: 964176192, got: (v) => v.result },
  { id: 'reverse-bits', input: { n: 0 }, expect: 0, got: (v) => v.result },
  { id: 'reverse-bits', input: { n: 1 }, expect: 2147483648, got: (v) => v.result },
  { id: 'missing-number', input: { nums: [3, 0, 1] }, expect: 2, got: (v) => v.result },
  { id: 'missing-number', input: { nums: [0, 1] }, expect: 2, got: (v) => v.result },
  { id: 'missing-number', input: { nums: [9, 6, 4, 2, 3, 5, 7, 0, 1] }, expect: 8, got: (v) => v.result },
  { id: 'sum-of-two-integers', input: { a: 11, b: 5 }, expect: 16, got: (v) => v.result },
  { id: 'sum-of-two-integers', input: { a: 0, b: 0 }, expect: 0, got: (v) => v.result },
  { id: 'sum-of-two-integers', input: { a: 1023, b: 1 }, expect: 1024, got: (v) => v.result },
  // Linked List — checked by walking the final list from its head pointer
  { id: 'reverse-linked-list', input: { values: [1, 2, 3, 4, 5] }, expect: '5,4,3,2,1', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'reverse-linked-list', input: { values: [1] }, expect: '1', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'reverse-linked-list', input: { values: [] }, expect: '', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-two-sorted-lists', input: { list1: [1, 2, 4], list2: [1, 3, 4] }, expect: '1,1,2,3,4,4', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-two-sorted-lists', input: { list1: [], list2: [0] }, expect: '0', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-two-sorted-lists', input: { list1: [], list2: [] }, expect: '', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-two-sorted-lists', input: { list1: [5, 6], list2: [1, 2] }, expect: '1,2,5,6', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'linked-list-cycle', input: { values: [3, 2, 0, -4], pos: 1 }, expect: true, got: (v) => v.result },
  { id: 'linked-list-cycle', input: { values: [1, 2], pos: 0 }, expect: true, got: (v) => v.result },
  { id: 'linked-list-cycle', input: { values: [1, 2, 3], pos: -1 }, expect: false, got: (v) => v.result },
  { id: 'linked-list-cycle', input: { values: [1], pos: -1 }, expect: false, got: (v) => v.result },
  { id: 'linked-list-cycle', input: { values: [1], pos: 0 }, expect: true, got: (v) => v.result },
  { id: 'reorder-list', input: { values: [1, 2, 3, 4] }, expect: '1,4,2,3', got: (_v, s) => walk(s, 'list', 0) },
  { id: 'reorder-list', input: { values: [1, 2, 3, 4, 5] }, expect: '1,5,2,4,3', got: (_v, s) => walk(s, 'list', 0) },
  { id: 'reorder-list', input: { values: [1, 2] }, expect: '1,2', got: (_v, s) => walk(s, 'list', 0) },
  { id: 'reorder-list', input: { values: [1] }, expect: '1', got: (_v, s) => walk(s, 'list', 0) },
  { id: 'remove-nth-from-end', input: { values: [1, 2, 3, 4, 5], n: 2 }, expect: '1,2,3,5', got: (_v, s) => walk(s, 'list', 0) },
  { id: 'remove-nth-from-end', input: { values: [1, 2], n: 1 }, expect: '1', got: (_v, s) => walk(s, 'list', 0) },
  { id: 'remove-nth-from-end', input: { values: [1, 2], n: 2 }, expect: '2', got: (_v, s) => walk(s, 'list', 1) },
  { id: 'remove-nth-from-end', input: { values: [1], n: 1 }, expect: '', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-k-sorted-lists', input: { lists: '1,4,5 | 1,3,4 | 2,6' }, expect: '1,1,2,3,4,4,5,6', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-k-sorted-lists', input: { lists: '2 | 1' }, expect: '1,2', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-k-sorted-lists', input: { lists: '1,2,3' }, expect: '1,2,3', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  { id: 'merge-k-sorted-lists', input: { lists: '3,7 | 1,2 | 9 | 4,5' }, expect: '1,2,3,4,5,7,9', got: (v, s) => walk(s, 'list', ptr(v, 'head')) },
  // Trees
  { id: 'invert-binary-tree', input: { tree: '4, 2, 7, 1, 3, 6, 9' }, expect: '4,7,2,9,6,3,1', got: (_v, s) => levels(s, 'tree') },
  { id: 'invert-binary-tree', input: { tree: '2, 1, 3' }, expect: '2,3,1', got: (_v, s) => levels(s, 'tree') },
  { id: 'invert-binary-tree', input: { tree: '' }, expect: '', got: (_v, s) => levels(s, 'tree') },
  { id: 'max-depth-binary-tree', input: { tree: '3, 9, 20, null, null, 15, 7' }, expect: 3, got: (v) => v.result },
  { id: 'max-depth-binary-tree', input: { tree: '1, null, 2' }, expect: 2, got: (v) => v.result },
  { id: 'max-depth-binary-tree', input: { tree: '' }, expect: 0, got: (v) => v.result },
  { id: 'same-tree', input: { p: '1, 2, 3', q: '1, 2, 3' }, expect: true, got: (v) => v.result },
  { id: 'same-tree', input: { p: '1, 2', q: '1, null, 2' }, expect: false, got: (v) => v.result },
  { id: 'same-tree', input: { p: '1, 2, 1', q: '1, 1, 2' }, expect: false, got: (v) => v.result },
  { id: 'same-tree', input: { p: '', q: '' }, expect: true, got: (v) => v.result },
  { id: 'subtree-of-another-tree', input: { root: '3, 4, 5, 1, 2', sub: '4, 1, 2' }, expect: true, got: (v) => v.result },
  { id: 'subtree-of-another-tree', input: { root: '3, 4, 5, 1, 2, null, null, null, null, 0', sub: '4, 1, 2' }, expect: false, got: (v) => v.result },
  { id: 'subtree-of-another-tree', input: { root: '1, 1', sub: '1' }, expect: true, got: (v) => v.result },
  { id: 'lca-of-bst', input: { tree: '6, 2, 8, 0, 4, 7, 9', p: 2, q: 8 }, expect: 6, got: (v) => v.result },
  { id: 'lca-of-bst', input: { tree: '6, 2, 8, 0, 4, 7, 9', p: 2, q: 4 }, expect: 2, got: (v) => v.result },
  { id: 'lca-of-bst', input: { tree: '2, 1', p: 1, q: 2 }, expect: 2, got: (v) => v.result },
  { id: 'level-order-traversal', input: { tree: '3, 9, 20, null, null, 15, 7' }, expect: '[3],[9, 20],[15, 7]', got: (v) => (v.res as string[]).join(',') },
  { id: 'level-order-traversal', input: { tree: '1' }, expect: '[1]', got: (v) => (v.res as string[]).join(',') },
  { id: 'level-order-traversal', input: { tree: '' }, expect: '', got: (v) => (v.res as string[]).join(',') },
  { id: 'validate-bst', input: { tree: '2, 1, 3' }, expect: true, got: (v) => v.result },
  { id: 'validate-bst', input: { tree: '5, 1, 4, null, null, 3, 6' }, expect: false, got: (v) => v.result },
  { id: 'validate-bst', input: { tree: '5, 4, 6, null, null, 3, 7' }, expect: false, got: (v) => v.result },
  { id: 'validate-bst', input: { tree: '' }, expect: true, got: (v) => v.result },
  { id: 'kth-smallest-bst', input: { tree: '5, 3, 6, 2, 4, null, null, 1', k: 3 }, expect: 3, got: (v) => v.result },
  { id: 'kth-smallest-bst', input: { tree: '3, 1, 4, null, 2', k: 1 }, expect: 1, got: (v) => v.result },
  { id: 'kth-smallest-bst', input: { tree: '2, 1', k: 5 }, expect: -1, got: (v) => v.result },
  { id: 'construct-tree-from-traversals', input: { preorder: [3, 9, 20, 15, 7], inorder: [9, 3, 15, 20, 7] }, expect: '3,9,20,null,null,15,7', got: (_v, s) => levels(s, 'tree') },
  { id: 'construct-tree-from-traversals', input: { preorder: [-1], inorder: [-1] }, expect: '-1', got: (_v, s) => levels(s, 'tree') },
  { id: 'construct-tree-from-traversals', input: { preorder: [1, 2], inorder: [2, 1] }, expect: '1,2', got: (_v, s) => levels(s, 'tree') },
  { id: 'binary-tree-max-path-sum', input: { tree: '-10, 9, 20, null, null, 15, 7' }, expect: 42, got: (v) => v.result },
  { id: 'binary-tree-max-path-sum', input: { tree: '1, 2, 3' }, expect: 6, got: (v) => v.result },
  { id: 'binary-tree-max-path-sum', input: { tree: '-3' }, expect: -3, got: (v) => v.result },
  { id: 'binary-tree-max-path-sum', input: { tree: '2, -1' }, expect: 2, got: (v) => v.result },
  { id: 'serialize-deserialize-tree', input: { tree: '1, 2, 3, null, null, 4, 5' }, expect: '1,2,3,null,null,4,5', got: (_v, s) => levels(s, 'rebuilt') },
  { id: 'serialize-deserialize-tree', input: { tree: '1, 2, 3, null, null, 4, 5' }, expect: '1,2,N,N,3,4,N,N,5,N,N', got: (v) => v.encoded },
  { id: 'serialize-deserialize-tree', input: { tree: '1' }, expect: '1', got: (_v, s) => levels(s, 'rebuilt') },
  // Heap / Priority Queue
  { id: 'find-median-from-data-stream', input: { nums: [5, 15, 1, 3] }, expect: '5,10,5,4', got: (v) => (v.medians as number[]).join(',') },
  { id: 'find-median-from-data-stream', input: { nums: [1, 2, 3, 4, 5, 6, 7] }, expect: '1,1.5,2,2.5,3,3.5,4', got: (v) => (v.medians as number[]).join(',') },
  { id: 'find-median-from-data-stream', input: { nums: [7, 6, 5, 4, 3, 2, 1] }, expect: '7,6.5,6,5.5,5,4.5,4', got: (v) => (v.medians as number[]).join(',') },
  { id: 'find-median-from-data-stream', input: { nums: [2] }, expect: '2', got: (v) => (v.medians as number[]).join(',') },
  // Math & Geometry
  { id: 'rotate-image', input: { matrix: '1,2,3; 4,5,6; 7,8,9' }, expect: '7,4,1; 8,5,2; 9,6,3', got: (_v, s) => gridOf(s, 'matrix') },
  { id: 'rotate-image', input: { matrix: '1,2; 3,4' }, expect: '3,1; 4,2', got: (_v, s) => gridOf(s, 'matrix') },
  { id: 'rotate-image', input: { matrix: '5' }, expect: '5', got: (_v, s) => gridOf(s, 'matrix') },
  { id: 'rotate-image', input: { matrix: '5,1,9,11; 2,4,8,10; 13,3,6,7; 15,14,12,16' }, expect: '15,13,2,5; 14,3,4,1; 12,6,8,9; 16,7,10,11', got: (_v, s) => gridOf(s, 'matrix') },
  { id: 'spiral-matrix', input: { matrix: '1,2,3,4; 5,6,7,8; 9,10,11,12' }, expect: '1,2,3,4,8,12,11,10,9,5,6,7', got: (_v, s) => arr(s, 'res').join(',') },
  { id: 'spiral-matrix', input: { matrix: '1,2,3; 4,5,6; 7,8,9' }, expect: '1,2,3,6,9,8,7,4,5', got: (_v, s) => arr(s, 'res').join(',') },
  { id: 'spiral-matrix', input: { matrix: '7' }, expect: '7', got: (_v, s) => arr(s, 'res').join(',') },
  { id: 'spiral-matrix', input: { matrix: '1; 2; 3' }, expect: '1,2,3', got: (_v, s) => arr(s, 'res').join(',') },
  { id: 'set-matrix-zeroes', input: { matrix: '1,1,1; 1,0,1; 1,1,1' }, expect: '1,0,1; 0,0,0; 1,0,1', got: (_v, s) => gridOf(s, 'matrix') },
  { id: 'set-matrix-zeroes', input: { matrix: '0,1,2,0; 3,4,5,2; 1,3,1,5' }, expect: '0,0,0,0; 0,4,5,0; 0,3,1,0', got: (_v, s) => gridOf(s, 'matrix') },
  { id: 'set-matrix-zeroes', input: { matrix: '1,2,3; 4,5,6' }, expect: '1,2,3; 4,5,6', got: (_v, s) => gridOf(s, 'matrix') },
  // 2-D Dynamic Programming
  { id: 'unique-paths', input: { m: 3, n: 7 }, expect: 28, got: (v) => v.result },
  { id: 'unique-paths', input: { m: 3, n: 2 }, expect: 3, got: (v) => v.result },
  { id: 'unique-paths', input: { m: 1, n: 1 }, expect: 1, got: (v) => v.result },
  { id: 'longest-common-subsequence', input: { a: 'abcde', b: 'ace' }, expect: 3, got: (v) => v.result },
  { id: 'longest-common-subsequence', input: { a: 'abc', b: 'abc' }, expect: 3, got: (v) => v.result },
  { id: 'longest-common-subsequence', input: { a: 'abc', b: 'def' }, expect: 0, got: (v) => v.result },
  { id: 'longest-common-subsequence', input: { a: '', b: 'abc' }, expect: 0, got: (v) => v.result },
  // Backtracking
  { id: 'word-search', input: { board: 'ABCE; SFCS; ADEE', word: 'ABCCED' }, expect: true, got: (v) => v.result },
  { id: 'word-search', input: { board: 'ABCE; SFCS; ADEE', word: 'SEE' }, expect: true, got: (v) => v.result },
  { id: 'word-search', input: { board: 'ABCE; SFCS; ADEE', word: 'ABCB' }, expect: false, got: (v) => v.result },
  { id: 'word-search', input: { board: 'AB; CD', word: 'ABDC' }, expect: true, got: (v) => v.result },
  // Graphs (grid-based)
  { id: 'number-of-islands', input: { grid: '11000; 11000; 00100; 00011' }, expect: 3, got: (v) => v.result },
  { id: 'number-of-islands', input: { grid: '11110; 11010; 11000; 00000' }, expect: 1, got: (v) => v.result },
  { id: 'number-of-islands', input: { grid: '000; 000' }, expect: 0, got: (v) => v.result },
  { id: 'number-of-islands', input: { grid: '101; 010; 101' }, expect: 5, got: (v) => v.result },
  { id: 'pacific-atlantic', input: { heights: '1,2,3; 8,9,4; 7,6,5' }, expect: '(0,2) (1,0) (1,1) (1,2) (2,0) (2,1) (2,2)', got: (v) => (v.result as string[]).join(' ') },
  { id: 'pacific-atlantic', input: { heights: '1' }, expect: '(0,0)', got: (v) => (v.result as string[]).join(' ') },
  { id: 'pacific-atlantic', input: { heights: '3,3; 3,3' }, expect: '(0,0) (0,1) (1,0) (1,1)', got: (v) => (v.result as string[]).join(' ') },
  // Graphs
  { id: 'number-of-connected-components', input: { n: 5, edges: '0-1, 1-2, 3-4' }, expect: 2, got: (v) => v.result },
  { id: 'number-of-connected-components', input: { n: 5, edges: '0-1, 1-2, 2-3, 3-4' }, expect: 1, got: (v) => v.result },
  { id: 'number-of-connected-components', input: { n: 4, edges: '' }, expect: 4, got: (v) => v.result },
  { id: 'graph-valid-tree', input: { n: 5, edges: '0-1, 0-2, 0-3, 1-4' }, expect: true, got: (v) => v.result },
  { id: 'graph-valid-tree', input: { n: 5, edges: '0-1, 1-2, 2-3, 1-3, 1-4' }, expect: false, got: (v) => v.result },
  { id: 'graph-valid-tree', input: { n: 4, edges: '0-1, 2-3' }, expect: false, got: (v) => v.result },
  { id: 'graph-valid-tree', input: { n: 1, edges: '' }, expect: true, got: (v) => v.result },
  { id: 'course-schedule', input: { n: 4, prerequisites: '1>0, 2>1, 3>2' }, expect: true, got: (v) => v.result },
  { id: 'course-schedule', input: { n: 2, prerequisites: '1>0, 0>1' }, expect: false, got: (v) => v.result },
  { id: 'course-schedule', input: { n: 3, prerequisites: '' }, expect: true, got: (v) => v.result },
  { id: 'clone-graph', input: { n: 4, edges: '0-1, 1-2, 2-3, 3-0' }, expect: '0:13 1:02 2:13 3:02', got: (_v, s) => graphOf(s, 'clone') },
  { id: 'clone-graph', input: { n: 1, edges: '' }, expect: '0:', got: (_v, s) => graphOf(s, 'clone') },
  { id: 'clone-graph', input: { n: 2, edges: '0-1' }, expect: '0:1 1:0', got: (_v, s) => graphOf(s, 'clone') },
  // Advanced Graphs
  { id: 'alien-dictionary', input: { words: ['wrt', 'wrf', 'er', 'ett', 'rftt'] }, expect: 'wertf', got: (v) => v.result },
  { id: 'alien-dictionary', input: { words: ['z', 'x'] }, expect: 'zx', got: (v) => v.result },
  { id: 'alien-dictionary', input: { words: ['z', 'x', 'z'] }, expect: '', got: (v) => v.result },
  { id: 'alien-dictionary', input: { words: ['abc', 'ab'] }, expect: '', got: (v) => v.result },
  // Tries
  { id: 'implement-trie', input: { words: ['apple', 'app', 'apply'], query: 'app' }, expect: true, got: (v) => v.search },
  { id: 'implement-trie', input: { words: ['apple'], query: 'app' }, expect: false, got: (v) => v.search },
  { id: 'implement-trie', input: { words: ['apple'], query: 'app' }, expect: true, got: (v) => v.startsWith },
  { id: 'implement-trie', input: { words: ['apple'], query: 'bat' }, expect: false, got: (v) => v.startsWith },
  { id: 'add-and-search-words', input: { words: ['bad', 'dad', 'mad'], query: 'b..' }, expect: true, got: (v) => v.result },
  { id: 'add-and-search-words', input: { words: ['bad', 'dad', 'mad'], query: '.ad' }, expect: true, got: (v) => v.result },
  { id: 'add-and-search-words', input: { words: ['bad'], query: 'pad' }, expect: false, got: (v) => v.result },
  { id: 'add-and-search-words', input: { words: ['bad'], query: 'ba' }, expect: false, got: (v) => v.result },
  { id: 'word-search-ii', input: { board: 'oaan; etae; ihkr', words: ['oath', 'eat', 'rain'] }, expect: 'oath,eat', got: (v) => (v.result as string[]).join(',') },
  { id: 'word-search-ii', input: { board: 'ab; cd', words: ['abcb'] }, expect: '', got: (v) => (v.result as string[]).join(',') },
  // Intervals
  { id: 'insert-interval', input: { intervals: '1-3, 6-9', newInterval: '2-5' }, expect: '1–5 6–9', got: (_v, s) => arr(s, 'res').join(' ') },
  { id: 'insert-interval', input: { intervals: '1-2, 3-5, 6-7, 8-10, 12-16', newInterval: '4-8' }, expect: '1–2 3–10 12–16', got: (_v, s) => arr(s, 'res').join(' ') },
  { id: 'insert-interval', input: { intervals: '', newInterval: '5-7' }, expect: '5–7', got: (_v, s) => arr(s, 'res').join(' ') },
  { id: 'merge-intervals', input: { intervals: '1-3, 2-6, 8-10, 15-18' }, expect: '1–6 8–10 15–18', got: (_v, s) => arr(s, 'res').join(' ') },
  { id: 'merge-intervals', input: { intervals: '1-4, 4-5' }, expect: '1–5', got: (_v, s) => arr(s, 'res').join(' ') },
  { id: 'merge-intervals', input: { intervals: '5-6, 1-2' }, expect: '1–2 5–6', got: (_v, s) => arr(s, 'res').join(' ') },
  { id: 'non-overlapping-intervals', input: { intervals: '1-2, 2-3, 3-4, 1-3' }, expect: 1, got: (v) => v.result },
  { id: 'non-overlapping-intervals', input: { intervals: '1-2, 1-2, 1-2' }, expect: 2, got: (v) => v.result },
  { id: 'non-overlapping-intervals', input: { intervals: '1-2, 2-3' }, expect: 0, got: (v) => v.result },
  { id: 'meeting-rooms', input: { intervals: '0-30, 5-10, 15-20' }, expect: false, got: (v) => v.result },
  { id: 'meeting-rooms', input: { intervals: '7-10, 2-4' }, expect: true, got: (v) => v.result },
  { id: 'meeting-rooms-ii', input: { intervals: '0-30, 5-10, 15-20' }, expect: 2, got: (v) => v.result },
  { id: 'meeting-rooms-ii', input: { intervals: '7-10, 2-4' }, expect: 1, got: (v) => v.result },
  { id: 'meeting-rooms-ii', input: { intervals: '1-5, 2-6, 3-7' }, expect: 3, got: (v) => v.result },
  // Backtracking
  { id: 'combination-sum', input: { candidates: [2, 3, 6, 7], target: 7 }, expect: '[2,2,3] [7]', got: (v) => (v.res as string[]).join(' ') },
  { id: 'combination-sum', input: { candidates: [2, 3, 5], target: 8 }, expect: '[2,2,2,2] [2,3,3] [3,5]', got: (v) => (v.res as string[]).join(' ') },
  { id: 'combination-sum', input: { candidates: [2], target: 1 }, expect: '', got: (v) => (v.res as string[]).join(' ') },
];

let failures = 0;

for (const c of cases) {
  const algo = algorithms.find((a) => a.id === c.id);
  if (!algo) {
    console.log(`MISSING ALGORITHM ${c.id}`);
    failures++;
    continue;
  }

  const events: AlgoEvent[] = [];
  let err = '';
  try {
    for (const e of algo.run(c.input)) {
      events.push(e);
      if (events.length > 20000) { err = 'RUNAWAY'; break; }
    }
  } catch (e) {
    err = `THREW ${e instanceof Error ? e.message : String(e)}`;
  }

  const last = events[events.length - 1];
  const lineCount = algo.code.split('\n').length;
  const badLine = events.find((e) => e.line !== undefined && (e.line < 1 || e.line > lineCount));
  const badIdx = events.find((e) => {
    const st = e.structures.find((s) => s.id === (e.structureId ?? e.structures[0]?.id));
    if (!st) return false;
    const idxs = [e.i, e.j, ...(e.indices ?? [])].filter((n): n is number => n !== undefined);
    return idxs.some((n) => n < 0 || n >= sizeOf(st));
  });

  const actual = last ? c.got(last.vars as Vars, last.structures, events) : undefined;
  const ok = !err && !badLine && !badIdx && String(actual) === String(c.expect);
  if (!ok) failures++;

  console.log(
    [
      ok ? 'ok   ' : 'FAIL ',
      c.id.padEnd(38),
      String(events.length).padStart(4) + 'ev ',
      err ? `${err} ` : '',
      badLine ? `BAD-LINE:${badLine.line} ` : '',
      badIdx ? `BAD-INDEX:${JSON.stringify([badIdx.i, badIdx.j, badIdx.indices])} ` : '',
      ok ? '' : `expected ${JSON.stringify(c.expect)} got ${JSON.stringify(actual)} `,
      `in ${JSON.stringify(c.input)}`,
    ].join(''),
  );
}

console.log(`\n${cases.length - failures}/${cases.length} passed`);
