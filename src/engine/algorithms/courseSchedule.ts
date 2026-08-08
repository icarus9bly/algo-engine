import { Tracer, type TracedGraph } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';
import { buildGraph, parseEdges } from './graphs';

const code = `function canFinish(numCourses, prerequisites) {
  const graph = buildAdjacency(numCourses, prerequisites);
  const state = new Array(numCourses).fill('new');
  for (let c = 0; c < numCourses; c++)
    if (!dfs(c)) return false;
  return true;
}

function dfs(course) {
  if (state[course] === 'visiting') return false;
  if (state[course] === 'done') return true;
  state[course] = 'visiting';
  for (const next of graph[course])
    if (!dfs(next)) return false;
  state[course] = 'done';
  return true;
}`;

type State = 'new' | 'visiting' | 'done';

function* dfs(
  t: Tracer,
  g: TracedGraph,
  state: State[],
  course: number,
): Generator<AlgoEvent, boolean> {
  if (state[course] === 'visiting') {
    yield t.compare(10, {
      i: course,
      vars: { course },
      note: `Course ${course} is already on the current path — following it leads back to itself.`,
    });
    return false;
  }

  if (state[course] === 'done') {
    yield t.compare(11, {
      i: course,
      note: `Course ${course} was cleared earlier; no need to re-check it.`,
    });
    return true;
  }

  state[course] = 'visiting';
  yield t.read(12, {
    i: course,
    vars: { course, state: [...state] },
    note: `Start course ${course}; it is now on the path being explored.`,
  });

  for (const next of g.edges(course)) {
    yield t.note(13, {
      i: course,
      j: next,
      note: `Course ${course} requires ${next} first.`,
    });
    if (!(yield* dfs(t, g, state, next))) return false;
  }

  state[course] = 'done';
  yield t.settle(15, g, [course], {
    vars: { state: [...state] },
    note: `Everything course ${course} depends on is satisfiable.`,
  });
  return true;
}

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const n = input.n as number;
  const edges = parseEdges(String(input.prerequisites ?? ''));

  const t = new Tracer();
  const g = t.graph('courses', 'courses — an arrow means "requires"', true, 'circle', ['course']);
  buildGraph(g, n, edges);

  yield t.note(1, {
    note: 'The courses can all be taken exactly when the prerequisite graph has no cycle.',
  });

  const state: State[] = new Array(n).fill('new');
  yield t.note(3, {
    vars: { state: [...state] },
    note: 'Three states per course: untouched, on the current path, or fully cleared.',
  });

  for (let c = 0; c < n; c++) {
    yield t.note(4, { i: c, vars: { course: c }, note: `Check course ${c}.` });
    if (!(yield* dfs(t, g, state, c))) {
      yield t.note(5, {
        i: c,
        vars: { result: false },
        note: 'A cycle means two courses each require the other — impossible.',
      });
      return;
    }
  }

  yield t.note(6, {
    vars: { course: undefined, result: true },
    note: 'No cycles anywhere — every course can be completed.',
  });
}

export const courseSchedule: AlgorithmDef = {
  id: 'course-schedule',
  name: 'Course Schedule',
  category: 'Graphs',
  code,
  inputFields: [
    { key: 'n', label: 'courses', kind: 'number', placeholder: '4' },
    { key: 'prerequisites', label: 'requires (a>b)', kind: 'text', placeholder: '1>0, 2>1, 3>2' },
  ],
  defaultInput: { n: 4, prerequisites: '1>0, 2>1, 3>2' },
  run,
};
