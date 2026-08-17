# Roadmap

Where the project stands and what comes next. Written to be picked up cold — on
another machine, in another session, by someone who was not there for the
decisions.

## Where things stand

143 of the NeetCode 250. Eight sections complete: Two Pointers, Sliding Window,
1-D and 2-D Dynamic Programming, Greedy, Bit Manipulation, Backtracking, and —
counting the Blind 75 as the original scope — everything that list contained.

Re-derive all of this rather than trusting the numbers above, which go stale:

```bash
npm run verify                          # 461 assertions
npx tsx scripts/coverage.ts             # 143/250, by section
npx tsx scripts/coverage.ts --missing   # exactly what is left, by section
npx tsx scripts/layout.ts               # 9 graphs, geometry sound
npm run lint && npm run build
```

## What the remaining 107 need

| | Count |
|---|---|
| Buildable today on existing renderers | 94 |
| Blocked on the op-sequence input model | 13 |

Nothing else is blocked. Weighted graph edges landed in `24ba344`, which
unblocked Advanced Graphs; the design is in
`docs/superpowers/specs/2026-08-17-weighted-graph-edges-design.md`.

## Next up: Advanced Graphs (1/10 → 10/10)

Nine problems, and they do not all need the same thing. Checked individually —
worth redoing that check for any section before planning it, since it changed
the scope materially here:

**Need no engine work** — grid or unweighted:
Path with Minimum Effort · Swim In Rising Water · Build a Matrix With Conditions ·
Greatest Common Divisor Traversal

**Weighted**, on the API that now exists:
Network Delay Time (Dijkstra) · Min Cost to Connect All Points (Prim) ·
Cheapest Flights Within K Stops (Bellman-Ford) ·
Find Critical and Pseudo Critical Edges in Minimum Spanning Tree (Kruskal)

**Parallel edges**:
Reconstruct Itinerary — build its graph *without* `buildGraph`, which
deduplicates repeated pairs. `TracedGraph.connect` does not, so two identical
tickets become two edges, which is the point of the problem.

That closes the section and reaches 152/250.

### The graph API, as it now is

An edge has an identity: `GraphStructure.edges` is the spine, and a node's
`edges` field holds positions into it, not neighbour indices.

- `graph.connect(from, to, weight?)` → returns the new edge position
- `graph.neighbours(i)` → node positions (this is the old `edges(i)`)
- `graph.incident(i)` → edge positions
- `graph.edge(e)`, `graph.weight(e)`, `graph.edgeBetween(a, b)`
- `t.connect(line, graph, from, to, { weight })` → highlights both endpoints
  *and* the new edge
- `t.settleEdge(line, graph, edgeIndices, opts)` → the edge counterpart of
  `t.settle`
- `AlgoEvent.edgeIndices` addresses edges; `i`/`j`/`indices` still mean node
  positions in every structure, without exception

Kruskal sorts `graph.edges` directly and calls `t.settleEdge` on the ones it
keeps. That is the shape the model was changed for.

## After that

In order, largest teaching value and fewest surprises first. All renderer-ready:

1. **Trees** 11/23 → 23/23 (12)
2. **Graphs** 6/21 → 21/21 (15)
3. **Binary Search** (11 of 12) · **Stack** (9 of 13) · **Math & Geometry** (9 of 10)
4. **Heap** (9 of 11) · **Arrays & Hashing** (12 of 14)
5. **Linked List** (5 of 8) · **Tries** (1) · **Intervals** (2)

Each section is one commit, matching every commit on this branch so far.

## The last engine piece: the op-sequence input model

Thirteen problems are "design a data structure" — they take a *sequence of
method calls* as input and assert each call's return value. `InputField` has no
way to express that, and `AlgorithmDef.run(input)` takes a single input object.

Blocked on it: Min Stack · Implement Stack Using Queues · Implement Queue using
Stacks · Maximum Frequency Stack · Design HashSet · Design HashMap · Design
Circular Queue · LRU Cache · LFU Cache · Time Based Key Value Store · Design
Twitter · Kth Largest Element In a Stream · Detect Squares

This is architectural and wants its own design pass before code — questions,
approaches, a spec in `docs/superpowers/specs/`, then implementation. It will
touch `InputField`, `AlgorithmDef`, `src/engine/input.ts`, and probably needs a
new pane: the interesting thing to *show* is the call sequence with each call's
return value beside it, which no current renderer does.

Doing it last is deliberate. It is the largest redesign and benefits from not
being rushed.

## Two standing hazards

**A line number can be wrong and still be in range.** `verify` checks that every
event's `line` falls inside its snippet, and that check has caught real bugs four
times. It cannot catch an off-by-one. `partitionKSubsets` had *every* line number
one too low against its own snippet and passed cleanly; it was found by reading.
When adding a problem, count the snippet lines by hand.

**`verify` cannot see the renderer.** A layout bug produces perfectly valid
events. That is why graph geometry moved out of the JSX into
`src/components/graphLayout.ts` with `scripts/layout.ts` checking it. Nothing
equivalent guards `ArrayView`, `TreeView`, `GridView` or `LinkedListView`.

**Known unverified:** the weighted-edge rendering — weight labels, edge
highlight and settle colours, and the parallel-edge bowing — has never been
looked at. Chrome was unavailable when it was written. `scripts/layout.ts`
checks the geometry is sound, but no one has seen it draw. Worth `npm run dev`
and a look at a weighted problem the first time one exists.
