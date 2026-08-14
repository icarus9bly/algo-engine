# algo engine

A step-through visualization tool for the
[NeetCode 250](https://neetcode.io/practice). Pick an algorithm, edit its input,
and scrub through the run frame by frame with the source, the data and the
variables all in sync.

128 of the 250 are implemented, including all of the Blind 75. Six sections are
complete: Two Pointers, Sliding Window, 1-D and 2-D Dynamic Programming, Greedy
and Bit Manipulation.

```bash
npm install
npm run dev
```

## The idea

An algorithm is a **generator that yields events**. Each event carries a
complete snapshot of every structure and variable at that moment:

```ts
function* run(input: AlgoInput): Generator<AlgoEvent> {
  const t = new Tracer();
  const a = t.array('nums', input.nums as number[]);

  for (let i = 0; i < a.length; i++) {
    yield t.compare(5, { i, j: i + 1, note: `${a.num(i)} > ${a.num(i + 1)}?` });
    if (a.num(i) > a.num(i + 1)) {
      yield t.swap(6, a, i, i + 1, { note: 'Out of order — swap.' });
    }
  }
}
```

Because every frame is self-contained, **scrubbing backward is an array index**,
not a reverse-replay. `useEventTrace` runs the generator once and caches the
list; nothing re-executes when you drag the timeline.

The `Tracer` owns the single copy of the data. `t.swap(...)` mutates the array
*and* emits the event, so the picture can never drift from what the algorithm
actually did.

## Six event types

`compare` · `swap` · `read` · `write` · `found` · `settle` · `note`

That set has covered every problem so far — arrays, strings, stacks, queues, DP
tables, bit rows, linked lists, trees, heaps, grids, graphs and tries. Nothing
has needed a seventh. Notably, "move a pointer" is not an event: pointers are
variables, and the renderers draw them from the variable snapshot.

## Five structure kinds

| Kind | Renderer | Used by |
|---|---|---|
| `array` | `ArrayView` | arrays, strings, DP tables, stacks, queues, bit rows |
| `list` | `LinkedListView` | linked lists |
| `tree` | `TreeView` | binary trees, BSTs |
| `grid` | `GridView` | matrices, 2-D DP, flood fill |
| `graph` | `GraphView` | graphs and tries |

All five address positions the same way — a plain integer — so `i`, `j` and
`indices` mean the same thing everywhere and `StructureView` dispatches on the
tag. Adding a kind without a renderer fails the build.

Two decisions do most of the work:

- **Nodes hold still; links move.** List and tree nodes keep their creation
  position and the renderer follows their pointers. Reversing a list flips the
  arrows rather than shuffling boxes, and a cycle is simply a `next` that points
  backwards.
- **A structure can hold several collections.** There is no `head` or single
  `root` field, because a head is just a variable pointing at a node. That is
  what lets Merge Two Sorted Lists rewire nodes *between* two chains the way the
  real algorithm does, instead of copying them.

## Layout

```
src/engine/types.ts          event and structure schema
src/engine/tracer.ts         Tracer + TracedArray/List/Tree/Grid/Graph
src/engine/useEventTrace.ts  runs a generator once, caches the events
src/engine/registry.ts       every problem, in NeetCode 250 section order
src/engine/algorithms/       one file per problem
src/components/              renderers, code pane, timeline
scripts/                     verification
```

## Verification

```bash
npm run verify     # 399 assertions
```

Each case asserts the actual answer and checks every event for out-of-range
line numbers, out-of-range indices, and missing status notes. The line-number
check has caught real bugs — highlighting a line that doesn't exist — in three
separate batches of work.

```bash
npx tsx scripts/coverage.ts   # diffs the registry against the 250 manifest
npx tsx scripts/coverage.ts --missing   # lists what is left, by section
npx tsx scripts/notes.ts      # locates un-narrated frames by type and line
```

## Adding a problem

1. Write a generator in `src/engine/algorithms/`, exporting an `AlgorithmDef`
   with its source snippet, input fields and defaults.
2. Add it to `src/engine/registry.ts`.
3. Add cases to `scripts/verify.ts`.

Reuse the existing event types. A new one should only appear when a *renderer*
genuinely cannot express something with them — which has not happened yet.
