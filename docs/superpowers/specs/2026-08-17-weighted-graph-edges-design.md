# Weighted graph edges

Status: approved, not yet implemented
Date: 2026-08-17

## Why

`GraphNode.edges` is `number[]` — a list of neighbour node indices. There is
nowhere to put a weight, and an edge has no identity, so it cannot be
highlighted, settled, or duplicated. That blocks the Advanced Graphs section.

Surveying the nine remaining problems in that section first, because it changes
the scope:

| What it needs | Problems |
|---|---|
| Nothing — grid or unweighted | Path with Minimum Effort, Swim In Rising Water, Build a Matrix With Conditions, Greatest Common Divisor Traversal |
| Edge weights | Network Delay Time, Min Cost to Connect All Points, Cheapest Flights Within K Stops, Find Critical and Pseudo Critical Edges in MST |
| Parallel edges | Reconstruct Itinerary |

So four of the nine need no engine work, four need weights, and one needs
something different again: `TracedGraph.connect` deduplicates with `includes`,
so two identical tickets collapse into one edge, which destroys the problem.

Find Critical and Pseudo Critical Edges adds a fourth requirement that weights
alone do not cover: it must mark an *edge* as belonging to the minimum spanning
tree. `settled` is a set of node indices, so nothing today can express that.

Three gaps, then: edges need a **weight**, an **identity**, and permission to be
**parallel**.

## The tension

The engine rests on a stated invariant, from the README:

> All five address positions the same way — a plain integer — so `i`, `j` and
> `indices` mean the same thing everywhere.

Making edges addressable is exactly what strains this. The resolution chosen is
to give edges their own plain-integer space in their own event field, rather
than overloading the existing one. `i`, `j` and `indices` continue to mean node
positions in every structure, in every renderer, with no exceptions. An event
that wants to talk about edges says so in a different field.

## Design

### Types

```ts
export interface GraphEdge {
  from: number;
  to: number;
  /** Absent on unweighted graphs; the renderer labels an edge only when present. */
  weight?: number;
}

export interface GraphNode {
  value: Cell;
  /** Indices into GraphStructure.edges — the edges touching this node. */
  edges: number[];
}

export interface GraphStructure {
  kind: 'graph';
  id: string;
  label: string;
  nodes: GraphNode[];
  /** Every edge in the graph. Node adjacency indexes into this. */
  edges: GraphEdge[];
  directed: boolean;
  layout: 'circle' | 'tree';
  /** Node positions permanently final. */
  settled: number[];
  /** Edge positions permanently final — an MST membership, a chosen route. */
  settledEdges: number[];
  pointerNames: string[] | null;
}
```

`GraphNode.edges` keeps its name and its type but changes meaning: it held
neighbour node indices, it now holds incident edge indices. This is the one
breaking change in the data model, and every consumer of it must be revisited.

An **undirected edge is a single object listed in both endpoints' `edges`**. A
directed edge is listed only in `from`'s. This deletes GraphView's mirrored-edge
deduplication: an undirected pair draws one line because there is one edge, not
because a `Set` filtered the second one out.

### Events

```ts
export interface AlgoEvent {
  …
  /** Highlighted edge positions, indices into the graph's `edges`. */
  edgeIndices?: number[];
}
```

One new optional field. Only `GraphView` reads it. Nothing else in the engine
changes.

### TracedGraph

| Method | Change |
|---|---|
| `connect(from, to, weight?)` | Returns the new edge index. Always creates an edge — no deduplication. |
| `edges(i)` | Renamed `neighbours(i)`. Same semantics, same return type: node indices. |
| `incident(i)` | New. The edge indices touching node `i`. |
| `edge(e)` | New. The `GraphEdge` at position `e`. |
| `weight(e)` | New. Its weight, throwing if the edge is unweighted. |
| `settledEdges` | New `Set<number>`, alongside the existing `settled`. |

Deduplication moves out of `TracedGraph` into `buildGraph` in `graphs.ts`, which
is the function that parses user-supplied edge text. A repeated `0-1, 0-1` is
**silently ignored, not rejected** — exactly what `connect` does today, so no
existing input changes meaning. Deciding that is input hygiene, not a fact about
graphs. Reconstruct Itinerary builds its graph without `buildGraph` and gets
parallel edges as a consequence of the model rather than as a special case.

A self-loop (`from === to`) is listed **once** in that node's `edges`, not
twice, so `incident` and `neighbours` do not report it doubly.

### Tracer

- `t.connect(line, graph, from, to, opts)` gains an optional weight, and sets
  `edgeIndices: [newEdgeIndex]` on the event it emits alongside the existing
  `i: from, j: to`.
- `t.settleEdge(line, graph, edgeIndices, opts)` is new, mirroring `t.settle`.

### GraphView

- Edges are drawn from `structure.edges` directly. The dedup pass is deleted.
- An edge takes the same three-state role a node does: highlighted when
  `event.edgeIndices` contains it — using `event.type` for the class, exactly as
  nodes do — otherwise settled when in `settledEdges`, otherwise idle.
- A weight renders at the edge midpoint when `weight !== undefined`, over a
  small backing rect so the line does not run through the digits.
- `treeLayout` resolves children through the edge list rather than reading
  `node.edges` as node indices.
- Parallel edges bow apart on a quadratic curve, offset by the edge's ordinal
  among those sharing its endpoint pair, so two tickets between the same cities
  are visibly two.

### Migration

Nine files touch graphs. The work splits cleanly:

1. **Rename only** — `.edges(` to `.neighbours(` in `numberOfConnectedComponents`,
   `courseSchedule`, `cloneGraph`, `alienDictionary`, `graphValidTree`. Every one
   of these consumes the result as neighbour node indices and passes them to
   `i`/`j`, so the rename preserves behaviour exactly.
2. **Tries** — `implementTrie`, `addAndSearchWords`, `wordSearchII` use
   `connect` and `setValue` and do not read `edges` at all. They are unaffected
   in source, but they render through `treeLayout`, which makes them the
   sharpest test that the layout rewrite is correct.
3. **`graphs.ts`** — `buildGraph` absorbs edge deduplication.
4. **`verify.ts`** — the `graphOf` helper builds its expected strings from
   `n.edges` read as neighbour indices. It must resolve through the edge list
   instead. Without this every existing graph assertion breaks.

### Testing

- The 461 existing assertions are the regression suite for the migration. They
  must pass **unchanged** — any edit to an existing expectation means the
  migration altered behaviour, and needs explaining rather than accommodating.
- `verify` gains an `edgeIndices` range check against `structure.edges.length`,
  mirroring the node-index check. That check has caught real bugs three times;
  edges deserve the same.
- Each new problem gets its own cases as usual.

## Then the problems

In order:

1. The four needing no engine work: Path with Minimum Effort, Swim In Rising
   Water, Build a Matrix With Conditions, Greatest Common Divisor Traversal.
2. The four weighted: Network Delay Time, Min Cost to Connect All Points,
   Cheapest Flights Within K Stops, Find Critical and Pseudo Critical Edges in
   Minimum Spanning Tree.
3. Reconstruct Itinerary, on parallel edges.

That completes Advanced Graphs at 10/10 and brings the total to 152/250.

## Out of scope

The op-sequence input model for design problems is a separate change with its
own design. Nothing here should be shaped around it.
