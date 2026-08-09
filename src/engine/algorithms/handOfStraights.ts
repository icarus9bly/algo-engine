import { Tracer, mapToRecord } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function isNStraightHand(hand, groupSize) {
  if (hand.length % groupSize !== 0) return false;
  const count = tally(hand);
  for (const card of sortedKeys(count)) {
    const need = count[card];
    if (need === 0) continue;
    for (let k = card; k < card + groupSize; k++) {
      if ((count[k] ?? 0) < need) return false;
      count[k] -= need;
    }
  }
  return true;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const hand = input.hand as number[];
  const groupSize = input.groupSize as number;
  if (groupSize < 1) throw new Error('groupSize must be at least 1.');

  const t = new Tracer();
  const a = t.array('hand', hand, 'hand', []);

  yield t.note(1, {
    note: 'The smallest card left must begin a run, so there is never a choice about where the next group starts.',
  });

  if (hand.length % groupSize !== 0) {
    yield t.note(2, {
      vars: { result: false },
      note: `${hand.length} cards do not divide into groups of ${groupSize}.`,
    });
    return;
  }

  const count = new Map<number, number>();
  for (const card of hand) count.set(card, (count.get(card) ?? 0) + 1);
  yield t.note(3, {
    vars: { count: mapToRecord(count as Map<number, number>) },
    note: 'Tally how many of each card are held.',
  });

  const cards = [...count.keys()].sort((x, y) => x - y);

  for (const card of cards) {
    const need = count.get(card) ?? 0;
    if (need === 0) {
      yield t.note(5, {
        indices: hand.map((v, k) => (v === card ? k : -1)).filter((k) => k >= 0),
        note: `All the ${card}s were already used inside earlier runs.`,
      });
      continue;
    }

    yield t.read(4, {
      indices: hand.map((v, k) => (v === card ? k : -1)).filter((k) => k >= 0),
      vars: { card, need },
      note: `${need} run${need === 1 ? '' : 's'} must start at ${card}, the smallest card left.`,
    });

    for (let k = card; k < card + groupSize; k++) {
      const available = count.get(k) ?? 0;
      if (available < need) {
        yield t.note(8, {
          vars: { result: false },
          note: `Need ${need} of card ${k} to finish those runs, but only ${available} remain.`,
        });
        return;
      }
      count.set(k, available - need);
      yield t.note(9, {
        indices: hand.map((v, idx) => (v === k ? idx : -1)).filter((idx) => idx >= 0),
        vars: { count: mapToRecord(count as Map<number, number>) },
        note: `Use ${need} of card ${k}.`,
      });
    }
  }

  yield t.settle(12, a, a.values.map((_, d) => d), {
    vars: { card: undefined, need: undefined, result: true },
    note: `Every card fits into a run of ${groupSize}.`,
  });
}

export const handOfStraights: AlgorithmDef = {
  id: 'hand-of-straights',
  name: 'Hand of Straights',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'hand', label: 'hand', kind: 'numbers', placeholder: '1,2,3,6,2,3,4,7,8' },
    { key: 'groupSize', label: 'groupSize', kind: 'number', placeholder: '3' },
  ],
  defaultInput: { hand: [1, 2, 3, 6, 2, 3, 4, 7, 8], groupSize: 3 },
  run,
};
