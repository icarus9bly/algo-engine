/**
 * Shared types for the algorithm event stream.
 *
 * The whole engine is built on one idea: an algorithm is a generator that
 * yields a flat list of *events*. Each event is a complete, self-contained
 * description of one moment in the run — including a snapshot of every array
 * and variable at that moment. That makes scrubbing backward free: frame N is
 * just `events[N]`, no re-execution and no reverse-replay logic.
 *
 * Add new event types sparingly. Most algorithms can be expressed with the
 * ones below; a new type should only appear when a *renderer* needs to draw
 * something the existing ones can't express.
 */

/** A value that can live in a visualised array. */
export type Cell = number | string;

export type EventType =
  /** Two positions are being examined against each other. */
  | 'compare'
  /** Two positions exchanged values (the snapshot already reflects it). */
  | 'swap'
  /** A position is being looked at / dereferenced. */
  | 'read'
  /** A position received a new value (the snapshot already reflects it). */
  | 'write'
  /** The answer (or a piece of it) was located here. */
  | 'found'
  /** A position is finalised and won't move again — e.g. sorted tail. */
  | 'settle'
  /** Narration with no positional meaning: setup, branches, returns. */
  | 'note';

/** Anything the VarsPane knows how to render. */
export type VarValue =
  | number
  | string
  | boolean
  | null
  | Cell[]
  | Record<string, Cell>;

export interface ArrayStructure {
  kind: 'array';
  id: string;
  label: string;
  values: Cell[];
  /** Positions permanently locked in as of this event. */
  settled: number[];
  /**
   * Variables that index *this* structure, drawn as pointer badges under its
   * cells. `null` falls back to a default whitelist of common pointer names,
   * which is right for single-structure algorithms and wrong as soon as two
   * structures are in play (a stack must not show the string's `i`).
   */
  pointerNames: string[] | null;
}

export interface ListNode {
  value: Cell;
  /** Index into `nodes`, or null for the end of the list. */
  next: number | null;
}

/**
 * A set of linked nodes. Nodes keep the stable position they were created at
 * and the renderer draws arrows from their `next` fields, so reversing a list
 * flips the arrows rather than moving the boxes, and a cycle is simply a
 * `next` that points backwards.
 *
 * There is deliberately no `head` field: a head is just a variable pointing at
 * a node, which is what `pointerNames` already renders. That also lets one
 * structure hold several lists at once — which is how merging is shown, since
 * the real algorithm rewires nodes between lists rather than copying them.
 */
export interface ListStructure {
  kind: 'list';
  id: string;
  label: string;
  nodes: ListNode[];
  settled: number[];
  pointerNames: string[] | null;
}

export interface TreeNode {
  value: Cell;
  left: number | null;
  right: number | null;
}

/**
 * Binary tree nodes. Like lists, nodes hold their creation position and the
 * renderer follows `left`/`right`, so rewiring children (Invert Binary Tree)
 * moves the edges rather than the identities.
 *
 * `roots` is a list rather than a single root so one structure can hold two
 * trees — which is what Same Tree and Subtree of Another Tree compare, and
 * how a tree and its rebuilt copy sit side by side.
 */
export interface TreeStructure {
  kind: 'tree';
  id: string;
  label: string;
  nodes: TreeNode[];
  roots: number[];
  settled: number[];
  pointerNames: string[] | null;
}

/**
 * A rectangular matrix. Cells are stored row-major and addressed by the flat
 * index `row * cols + col`, so `i`/`j`/`indices` stay numeric here too and
 * every renderer highlights positions the same way.
 */
export interface GridStructure {
  kind: 'grid';
  id: string;
  label: string;
  rows: number;
  cols: number;
  cells: Cell[];
  settled: number[];
  pointerNames: string[] | null;
}

export interface GraphNode {
  value: Cell;
  /** Indices of neighbours. Directed graphs only list outgoing edges. */
  edges: number[];
}

/**
 * A general graph. Nodes are laid out on a circle by the renderer, which needs
 * no physics and keeps positions stable across frames — the same reason list
 * and tree nodes hold still while their links change.
 *
 * Tries are graphs too: a trie node's `value` is its incoming character, so
 * the same renderer draws both. `directed` only affects arrowheads.
 */
export interface GraphStructure {
  kind: 'graph';
  id: string;
  label: string;
  nodes: GraphNode[];
  directed: boolean;
  /**
   * `circle` suits arbitrary graphs; `tree` layers by depth from node 0 and
   * centres each parent over its children, which is what a trie needs.
   */
  layout: 'circle' | 'tree';
  settled: number[];
  pointerNames: string[] | null;
}

/**
 * A data structure the algorithm is working on, snapshotted at one event.
 *
 * Each `kind` gets its own small renderer and `StructureView` dispatches on
 * the tag. Nothing else in the engine needs to know the difference.
 */
export type Structure =
  | ArrayStructure
  | ListStructure
  | TreeStructure
  | GridStructure
  | GraphStructure;

export interface AlgoEvent {
  type: EventType;
  /** 1-based line in the algorithm's `code` string to highlight. */
  line?: number;
  /**
   * Which structure the positions below refer to. Defaults to the first one.
   */
  structureId?: string;
  /**
   * Highlighted positions within that structure. For an array these are plain
   * indices; for structures that arrive later (lists, trees) they are offsets
   * into that structure's own element list, so this stays numeric throughout.
   */
  i?: number;
  j?: number;
  /** Extra highlighted positions beyond i/j. */
  indices?: number[];
  /** One short sentence explaining this step, shown in the status bar. */
  note?: string;
  vars: Record<string, VarValue>;
  structures: Structure[];
}

/** Input to an algorithm, keyed by `InputField.key`. */
export type AlgoInput = Record<string, unknown>;

export type InputField = {
  key: string;
  label: string;
  /** `numbers`/`words` accept a comma/space separated list. */
  kind: 'numbers' | 'number' | 'words' | 'text';
  placeholder?: string;
};

export interface AlgorithmDef {
  id: string;
  name: string;
  /** Grouping label for the picker, e.g. "Arrays & Hashing". */
  category: string;
  /** Source shown in the CodePane. Line 1 of this string is `line: 1`. */
  code: string;
  inputFields: InputField[];
  defaultInput: AlgoInput;
  run(input: AlgoInput): Generator<AlgoEvent>;
}
