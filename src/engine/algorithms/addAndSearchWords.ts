import { Tracer, type TracedGraph } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `addWord(word) {
  let node = root;
  for (const ch of word) {
    if (!node.children[ch]) node.children[ch] = new Node();
    node = node.children[ch];
  }
  node.end = true;
}

search(word) {
  return dfs(root, 0);
}

function dfs(node, i) {
  if (i === word.length) return node.end;
  if (word[i] !== '.') {
    const next = node.children[word[i]];
    return next ? dfs(next, i + 1) : false;
  }
  for (const child of Object.values(node.children))
    if (dfs(child, i + 1)) return true;
  return false;
}`;

interface Trie {
  children: Map<number, Map<string, number>>;
  ends: Set<number>;
}

function* search(
  t: Tracer,
  g: TracedGraph,
  trie: Trie,
  word: string,
  node: number,
  i: number,
): Generator<AlgoEvent, boolean> {
  if (i === word.length) {
    const isEnd = trie.ends.has(node);
    yield t.compare(16, {
      i: node,
      vars: { i },
      note: isEnd
        ? 'Reached the end of the pattern on a node that ends a word.'
        : 'Reached the end of the pattern, but no word finishes here.',
    });
    return isEnd;
  }

  const ch = word[i];
  const kids = trie.children.get(node)!;

  if (ch !== '.') {
    const next = kids.get(ch);
    if (next === undefined) {
      yield t.compare(18, {
        i: node,
        vars: { i },
        note: `No '${ch}' branch from here — this path fails.`,
      });
      return false;
    }
    yield t.read(19, { i: next, vars: { i }, note: `Follow '${ch}'.` });
    return yield* search(t, g, trie, word, next, i + 1);
  }

  yield t.note(21, {
    i: node,
    indices: [...kids.values()],
    vars: { i },
    note: `A dot matches anything, so every branch from here has to be tried — ${kids.size} of them.`,
  });

  for (const child of kids.values()) {
    yield t.read(22, {
      i: child,
      note: `Try '${g.value(child)}' for the dot at position ${i}.`,
    });
    if (yield* search(t, g, trie, word, child, i + 1)) return true;
    yield t.note(22, {
      i: child,
      note: `'${g.value(child)}' did not work out — back up and try the next branch.`,
    });
  }

  return false;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const words = (input.words as string[]) ?? [];
  const query = String(input.query ?? '');
  if (words.join('').length > 40) throw new Error('Keep the total letters under 40.');

  const t = new Tracer();
  const g = t.graph('trie', 'trie', true, 'tree', []);
  const root = g.add('·');
  const trie: Trie = { children: new Map([[root, new Map()]]), ends: new Set() };

  yield t.note(1, {
    note: 'Same trie as before, but a dot in the query forks the search across every branch.',
  });

  for (const word of words) {
    let node = root;
    for (const ch of word) {
      const kids = trie.children.get(node)!;
      let next = kids.get(ch);
      if (next === undefined) {
        next = g.add(ch);
        trie.children.set(next, new Map());
        kids.set(ch, next);
        yield t.connect(4, g, node, next, { note: `Add '${ch}' on the way to "${word}".` });
      } else {
        yield t.read(5, { i: next, note: `"${word}" shares the '${ch}' branch.` });
      }
      node = next;
    }
    trie.ends.add(node);
    g.setValue(node, `${String(g.value(node)).replace('*', '')}*`);
    yield t.emit('write', 7, { i: node, note: `"${word}" ends here.` });
  }

  yield t.note(13, { note: `Trie built. Now search for "${query}".` });

  const found = yield* search(t, g, trie, query, root, 0);

  yield t.note(13, {
    vars: { i: undefined, result: found },
    note: found ? `"${query}" matches a stored word.` : `Nothing stored matches "${query}".`,
  });
}

export const addAndSearchWords: AlgorithmDef = {
  id: 'add-and-search-words',
  name: 'Design Add And Search Words Data Structure',
  category: 'Tries',
  code,
  inputFields: [
    { key: 'words', label: 'add', kind: 'words', placeholder: 'bad, dad, mad' },
    { key: 'query', label: 'search (. = any)', kind: 'text', placeholder: 'b..' },
  ],
  defaultInput: { words: ['bad', 'dad', 'mad'], query: 'b..' },
  run,
};
