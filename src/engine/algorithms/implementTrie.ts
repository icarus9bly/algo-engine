import { Tracer, type TracedGraph } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `insert(word) {
  let node = root;
  for (const ch of word) {
    if (!node.children[ch]) node.children[ch] = new Node();
    node = node.children[ch];
  }
  node.end = true;
}

search(word) {
  const node = walk(word);
  return node !== null && node.end;
}

startsWith(prefix) {
  return walk(prefix) !== null;
}`;

/** A node's label is its incoming letter; `*` marks the end of a word. */
function label(ch: string, end: boolean): string {
  return end ? `${ch}*` : ch;
}

interface Trie {
  children: Map<number, Map<string, number>>;
  ends: Set<number>;
}

function* insert(
  t: Tracer,
  g: TracedGraph,
  trie: Trie,
  word: string,
): Generator<AlgoEvent> {
  let node = 0;
  yield t.note(2, { i: node, vars: { word }, note: `Insert "${word}", starting at the root.` });

  for (const ch of word) {
    const kids = trie.children.get(node)!;
    const existing = kids.get(ch);

    if (existing === undefined) {
      const created = g.add(ch);
      trie.children.set(created, new Map());
      kids.set(ch, created);
      yield t.connect(4, g, node, created, {
        note: `No '${ch}' branch here yet — create one.`,
      });
      node = created;
    } else {
      node = existing;
      yield t.read(5, {
        i: node,
        note: `A '${ch}' branch already exists — walk down it and share the prefix.`,
      });
    }
  }

  trie.ends.add(node);
  g.setValue(node, label(String(g.value(node)).replace('*', ''), true));
  yield t.emit('write', 7, {
    i: node,
    note: `Mark this node as the end of "${word}". The star is what distinguishes a stored word from a passing prefix.`,
  });
}

function* walk(
  t: Tracer,
  trie: Trie,
  word: string,
  line: number,
): Generator<AlgoEvent, number | null> {
  let node = 0;
  for (const ch of word) {
    const next = trie.children.get(node)!.get(ch);
    if (next === undefined) {
      yield t.compare(line, {
        i: node,
        note: `No '${ch}' branch from here — "${word}" is not in the trie.`,
      });
      return null;
    }
    node = next;
    yield t.read(line, { i: node, note: `Follow '${ch}'.` });
  }
  return node;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const words = (input.words as string[]) ?? [];
  const query = String(input.query ?? '');
  if (words.join('').length > 40) throw new Error('Keep the total letters under 40.');

  const t = new Tracer();
  const g = t.graph('trie', 'trie — a node is labelled by its incoming letter', true, 'tree', ['node']);
  const root = g.add('·');
  const trie: Trie = { children: new Map([[root, new Map()]]), ends: new Set() };

  yield t.note(1, {
    note: 'Words sharing a prefix share the path that spells it — that is the whole point of a trie.',
  });

  for (const word of words) {
    yield* insert(t, g, trie, word);
  }

  yield t.note(10, {
    vars: { word: undefined },
    note: `Trie built from ${words.length} word${words.length === 1 ? '' : 's'}. Now query "${query}".`,
  });

  const at = yield* walk(t, trie, query, 11);
  const isWord = at !== null && trie.ends.has(at);

  if (at === null) {
    yield t.note(12, {
      vars: { search: false, startsWith: false },
      note: `"${query}" is neither stored nor a prefix of anything stored.`,
    });
    return;
  }

  yield t.found(12, {
    i: at,
    vars: { search: isWord, startsWith: true },
    note: isWord
      ? `"${query}" was stored as a whole word — the node carries an end marker.`
      : `"${query}" is a prefix of stored words, but was never stored itself.`,
  });
}

export const implementTrie: AlgorithmDef = {
  id: 'implement-trie',
  name: 'Implement Trie Prefix Tree',
  category: 'Tries',
  code,
  inputFields: [
    { key: 'words', label: 'insert', kind: 'words', placeholder: 'apple, app, apply' },
    { key: 'query', label: 'query', kind: 'text', placeholder: 'app' },
  ],
  defaultInput: { words: ['apple', 'app', 'apply'], query: 'app' },
  run,
};
