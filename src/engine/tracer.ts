import type {
  AlgoEvent,
  ArrayStructure,
  Cell,
  EventType,
  ListNode,
  ListStructure,
  GraphNode,
  GraphStructure,
  GridStructure,
  Structure,
  TreeNode,
  TreeStructure,
  VarValue,
} from './types';

/**
 * A single array the algorithm is working on. Mutating it through these
 * methods keeps the tracer's snapshots in sync with the real computation —
 * there is only one copy of the data, so the visualisation can never drift
 * from what the algorithm actually did.
 */
export class TracedArray {
  readonly settled = new Set<number>();
  readonly id: string;
  readonly label: string;
  readonly values: Cell[];
  readonly pointerNames: string[] | null;

  constructor(id: string, label: string, values: Cell[], pointerNames: string[] | null = null) {
    this.id = id;
    this.label = label;
    this.values = values;
    this.pointerNames = pointerNames;
  }

  get length(): number {
    return this.values.length;
  }

  at(i: number): Cell {
    return this.values[i];
  }

  /** Convenience for numeric arrays, which is most of them. */
  num(i: number): number {
    return this.values[i] as number;
  }

  set(i: number, v: Cell): void {
    this.values[i] = v;
  }

  /** Appends a value; returns its index. Used for stacks, queues and outputs. */
  pushCell(v: Cell): number {
    this.values.push(v);
    return this.values.length - 1;
  }

  /** Removes and returns the last value. */
  popCell(): Cell | undefined {
    this.settled.delete(this.values.length - 1);
    return this.values.pop();
  }

  /** Removes and returns the first value, shifting everything left. */
  shiftCell(): Cell | undefined {
    const moved = [...this.settled].filter((i) => i > 0).map((i) => i - 1);
    this.settled.clear();
    for (const i of moved) this.settled.add(i);
    return this.values.shift();
  }

  swapCells(i: number, j: number): void {
    const tmp = this.values[i];
    this.values[i] = this.values[j];
    this.values[j] = tmp;
  }

  snapshot(): ArrayStructure {
    return {
      kind: 'array',
      id: this.id,
      label: this.label,
      values: [...this.values],
      settled: [...this.settled].sort((a, b) => a - b),
      pointerNames: this.pointerNames,
    };
  }
}

/**
 * Anything the tracer can snapshot into an event. `TracedArray` is the only
 * implementation today; lists and trees will be the next ones.
 */
export interface Traceable {
  readonly id: string;
  snapshot(): Structure;
}

/**
 * A set of linked nodes. Node positions are stable for the whole run; only the
 * `next` fields change, which is exactly what the real algorithms do.
 */
export class TracedList {
  readonly settled = new Set<number>();
  readonly id: string;
  readonly label: string;
  readonly nodes: ListNode[] = [];
  readonly pointerNames: string[] | null;

  constructor(id: string, label: string, pointerNames: string[] | null = null) {
    this.id = id;
    this.label = label;
    this.pointerNames = pointerNames;
  }

  get length(): number {
    return this.nodes.length;
  }

  /** Appends a chain of values and returns the index of its first node. */
  chain(values: Cell[]): number | null {
    if (values.length === 0) return null;
    const start = this.nodes.length;
    values.forEach((value, k) => {
      this.nodes.push({ value, next: k === values.length - 1 ? null : start + k + 1 });
    });
    return start;
  }

  value(i: number): Cell {
    return this.nodes[i].value;
  }

  num(i: number): number {
    return this.nodes[i].value as number;
  }

  next(i: number): number | null {
    return this.nodes[i].next;
  }

  setNext(i: number, to: number | null): void {
    this.nodes[i].next = to;
  }

  snapshot(): ListStructure {
    return {
      kind: 'list',
      id: this.id,
      label: this.label,
      nodes: this.nodes.map((n) => ({ ...n })),
      settled: [...this.settled].sort((a, b) => a - b),
      pointerNames: this.pointerNames,
    };
  }
}

/** Binary tree nodes, addressed by their stable creation position. */
export class TracedTree {
  readonly settled = new Set<number>();
  readonly id: string;
  readonly label: string;
  readonly nodes: TreeNode[] = [];
  readonly roots: number[] = [];
  readonly pointerNames: string[] | null;

  constructor(id: string, label: string, pointerNames: string[] | null = null) {
    this.id = id;
    this.label = label;
    this.pointerNames = pointerNames;
  }

  get length(): number {
    return this.nodes.length;
  }

  add(value: Cell, left: number | null = null, right: number | null = null): number {
    this.nodes.push({ value, left, right });
    return this.nodes.length - 1;
  }

  addRoot(i: number): void {
    if (!this.roots.includes(i)) this.roots.push(i);
  }

  replaceRoot(oldRoot: number | null, next: number | null): void {
    const at = oldRoot === null ? -1 : this.roots.indexOf(oldRoot);
    if (next === null) {
      if (at >= 0) this.roots.splice(at, 1);
    } else if (at >= 0) {
      this.roots[at] = next;
    } else {
      this.roots.push(next);
    }
  }

  value(i: number): Cell {
    return this.nodes[i].value;
  }

  num(i: number): number {
    return this.nodes[i].value as number;
  }

  left(i: number): number | null {
    return this.nodes[i].left;
  }

  right(i: number): number | null {
    return this.nodes[i].right;
  }

  setLeft(i: number, to: number | null): void {
    this.nodes[i].left = to;
  }

  setRight(i: number, to: number | null): void {
    this.nodes[i].right = to;
  }

  snapshot(): TreeStructure {
    return {
      kind: 'tree',
      id: this.id,
      label: this.label,
      nodes: this.nodes.map((n) => ({ ...n })),
      roots: [...this.roots],
      settled: [...this.settled].sort((a, b) => a - b),
      pointerNames: this.pointerNames,
    };
  }
}

/** A rectangular matrix, addressed by flat index or by row/column. */
export class TracedGrid {
  readonly settled = new Set<number>();
  readonly id: string;
  readonly label: string;
  readonly rows: number;
  readonly cols: number;
  readonly cells: Cell[];
  readonly pointerNames: string[] | null;

  constructor(
    id: string,
    label: string,
    cells: Cell[][],
    pointerNames: string[] | null = null,
  ) {
    this.id = id;
    this.label = label;
    this.rows = cells.length;
    this.cols = cells[0]?.length ?? 0;
    this.cells = cells.flat();
    this.pointerNames = pointerNames;
  }

  /** Flat index of a cell. */
  at(r: number, c: number): number {
    return r * this.cols + c;
  }

  inBounds(r: number, c: number): boolean {
    return r >= 0 && c >= 0 && r < this.rows && c < this.cols;
  }

  value(r: number, c: number): Cell {
    return this.cells[this.at(r, c)];
  }

  num(r: number, c: number): number {
    return this.cells[this.at(r, c)] as number;
  }

  set(r: number, c: number, v: Cell): void {
    this.cells[this.at(r, c)] = v;
  }

  /** Every flat index in the grid — handy for a closing settle. */
  allIndices(): number[] {
    return this.cells.map((_, i) => i);
  }

  snapshot(): GridStructure {
    return {
      kind: 'grid',
      id: this.id,
      label: this.label,
      rows: this.rows,
      cols: this.cols,
      cells: [...this.cells],
      settled: [...this.settled].sort((a, b) => a - b),
      pointerNames: this.pointerNames,
    };
  }
}

/** A general graph; also backs tries, where a node's value is its letter. */
export class TracedGraph {
  readonly settled = new Set<number>();
  readonly id: string;
  readonly label: string;
  readonly nodes: GraphNode[] = [];
  readonly directed: boolean;
  readonly layout: 'circle' | 'tree';
  readonly pointerNames: string[] | null;

  constructor(
    id: string,
    label: string,
    directed: boolean,
    layout: 'circle' | 'tree' = 'circle',
    pointerNames: string[] | null = null,
  ) {
    this.id = id;
    this.label = label;
    this.directed = directed;
    this.layout = layout;
    this.pointerNames = pointerNames;
  }

  get length(): number {
    return this.nodes.length;
  }

  add(value: Cell): number {
    this.nodes.push({ value, edges: [] });
    return this.nodes.length - 1;
  }

  value(i: number): Cell {
    return this.nodes[i].value;
  }

  setValue(i: number, v: Cell): void {
    this.nodes[i].value = v;
  }

  edges(i: number): number[] {
    return this.nodes[i].edges;
  }

  /** Adds an edge; undirected graphs get the mirror edge too. */
  connect(from: number, to: number): void {
    if (!this.nodes[from].edges.includes(to)) this.nodes[from].edges.push(to);
    if (!this.directed && !this.nodes[to].edges.includes(from)) {
      this.nodes[to].edges.push(from);
    }
  }

  snapshot(): GraphStructure {
    return {
      kind: 'graph',
      id: this.id,
      label: this.label,
      nodes: this.nodes.map((n) => ({ value: n.value, edges: [...n.edges] })),
      directed: this.directed,
      layout: this.layout,
      settled: [...this.settled].sort((a, b) => a - b),
      pointerNames: this.pointerNames,
    };
  }
}

export interface EmitOpts {
  i?: number;
  j?: number;
  indices?: number[];
  /**
   * Which structure `i`/`j`/`indices` point into. Defaults to the first one
   * registered.
   */
  target?: Traceable | string;
  note?: string;
  /** Merged into the running variable state before the snapshot is taken. */
  vars?: Record<string, VarValue | undefined>;
}

function cloneVar(v: VarValue): VarValue {
  if (Array.isArray(v)) return [...v];
  if (v !== null && typeof v === 'object') return { ...v };
  return v;
}

/**
 * Records the run. Algorithms create one, register their structures, then
 * `yield` the events its helpers return:
 *
 *   const t = new Tracer();
 *   const a = t.array('nums', nums);
 *   yield t.compare(5, { i, j, vars: { i, j } });
 */
export class Tracer {
  private readonly structures: Traceable[] = [];
  private vars: Record<string, VarValue> = {};

  /**
   * Registers an array. Pass `pointerNames` whenever the run has more than one
   * structure, so a variable is only drawn under the one it actually indexes;
   * `[]` means "no pointers belong here".
   */
  array(id: string, values: Cell[], label = id, pointerNames: string[] | null = null): TracedArray {
    // Copy so the caller's default input is never mutated between runs.
    const arr = new TracedArray(id, label, [...values], pointerNames);
    this.structures.push(arr);
    return arr;
  }

  /**
   * Registers a linked-list structure. Pass every chain that takes part in the
   * run into the same list when the algorithm rewires nodes between them
   * (merging), so the arrows can actually cross.
   */
  list(id: string, label = id, pointerNames: string[] | null = null): TracedList {
    const list = new TracedList(id, label, pointerNames);
    this.structures.push(list);
    return list;
  }

  /** Registers a graph structure. Tries use this too. */
  graph(
    id: string,
    label = id,
    directed = false,
    layout: 'circle' | 'tree' = 'circle',
    pointerNames: string[] | null = null,
  ): TracedGraph {
    const graph = new TracedGraph(id, label, directed, layout, pointerNames);
    this.structures.push(graph);
    return graph;
  }

  /** Adds a graph edge, then emits. */
  connect(
    line: number,
    graph: TracedGraph,
    from: number,
    to: number,
    opts: EmitOpts = {},
  ): AlgoEvent {
    graph.connect(from, to);
    return this.emit('write', line, { ...opts, target: graph, i: from, j: to });
  }

  /** Registers a matrix structure. */
  grid(
    id: string,
    cells: Cell[][],
    label = id,
    pointerNames: string[] | null = null,
  ): TracedGrid {
    const grid = new TracedGrid(id, label, cells.map((row) => [...row]), pointerNames);
    this.structures.push(grid);
    return grid;
  }

  /** Writes one cell of a grid, then emits with that cell highlighted. */
  writeCell(
    line: number,
    grid: TracedGrid,
    r: number,
    c: number,
    value: Cell,
    opts: EmitOpts = {},
  ): AlgoEvent {
    grid.set(r, c, value);
    return this.emit('write', line, { ...opts, target: grid, i: grid.at(r, c) });
  }

  /** Registers a binary tree structure. */
  tree(id: string, label = id, pointerNames: string[] | null = null): TracedTree {
    const tree = new TracedTree(id, label, pointerNames);
    this.structures.push(tree);
    return tree;
  }

  /** Repoints a child of a tree node, then emits. */
  setChild(
    line: number,
    tree: TracedTree,
    parent: number,
    side: 'left' | 'right',
    child: number | null,
    opts: EmitOpts = {},
  ): AlgoEvent {
    if (side === 'left') tree.setLeft(parent, child);
    else tree.setRight(parent, child);
    return this.emit('write', line, {
      ...opts,
      target: tree,
      i: parent,
      j: child ?? undefined,
    });
  }

  /** Removes the first value, then emits. Queues use this. */
  shift(line: number, arr: TracedArray, opts: EmitOpts = {}): AlgoEvent {
    arr.shiftCell();
    return this.emit('write', line, { ...opts, target: arr });
  }

  /** Repoints a node's `next`, then emits. */
  link(line: number, list: TracedList, from: number, to: number | null, opts: EmitOpts = {}): AlgoEvent {
    list.setNext(from, to);
    return this.emit('write', line, { ...opts, target: list, i: from, j: to ?? undefined });
  }

  /** Update variables without emitting an event. */
  setVars(vars: Record<string, VarValue | undefined>): void {
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) delete this.vars[k];
      else this.vars[k] = v;
    }
  }

  emit(type: EventType, line: number | undefined, opts: EmitOpts = {}): AlgoEvent {
    if (opts.vars) this.setVars(opts.vars);
    const structureId =
      typeof opts.target === 'string' ? opts.target : opts.target?.id;
    const vars: Record<string, VarValue> = {};
    for (const [k, v] of Object.entries(this.vars)) vars[k] = cloneVar(v);
    return {
      type,
      line,
      structureId,
      i: opts.i,
      j: opts.j,
      indices: opts.indices,
      note: opts.note,
      vars,
      structures: this.structures.map((s) => s.snapshot()),
    };
  }

  note(line?: number, opts: EmitOpts = {}): AlgoEvent {
    return this.emit('note', line, opts);
  }

  read(line: number, opts: EmitOpts = {}): AlgoEvent {
    return this.emit('read', line, opts);
  }

  compare(line: number, opts: EmitOpts = {}): AlgoEvent {
    return this.emit('compare', line, opts);
  }

  found(line: number, opts: EmitOpts = {}): AlgoEvent {
    return this.emit('found', line, opts);
  }

  /** Mutates the array, then emits. */
  swap(line: number, arr: TracedArray, i: number, j: number, opts: EmitOpts = {}): AlgoEvent {
    arr.swapCells(i, j);
    return this.emit('swap', line, { ...opts, target: arr, i, j });
  }

  /** Mutates the array, then emits. */
  write(line: number, arr: TracedArray, i: number, value: Cell, opts: EmitOpts = {}): AlgoEvent {
    arr.set(i, value);
    return this.emit('write', line, { ...opts, target: arr, i });
  }

  /** Appends to the array, then emits with the new position highlighted. */
  push(line: number, arr: TracedArray, value: Cell, opts: EmitOpts = {}): AlgoEvent {
    const i = arr.pushCell(value);
    return this.emit('write', line, { ...opts, target: arr, i });
  }

  /**
   * Removes the last value, then emits. Highlight the top with a `read` before
   * calling this if you want the popped cell shown before it disappears.
   */
  pop(line: number, arr: TracedArray, opts: EmitOpts = {}): AlgoEvent {
    arr.popCell();
    return this.emit('write', line, { ...opts, target: arr });
  }

  /** Marks positions as permanently final, then emits. */
  settle(
    line: number,
    target: TracedArray | TracedList | TracedTree | TracedGrid | TracedGraph,
    indices: number[],
    opts: EmitOpts = {},
  ): AlgoEvent {
    for (const i of indices) target.settled.add(i);
    return this.emit('settle', line, { ...opts, target, indices });
  }
}

/** Maps render nicely in the VarsPane once flattened to a plain record. */
export function mapToRecord(m: Map<Cell, Cell>): Record<string, Cell> {
  const out: Record<string, Cell> = {};
  for (const [k, v] of m) out[String(k)] = v;
  return out;
}
