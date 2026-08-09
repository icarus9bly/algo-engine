import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function canCompleteCircuit(gas, cost) {
  if (sum(gas) < sum(cost)) return -1;
  let total = 0, start = 0;
  for (let i = 0; i < gas.length; i++) {
    total += gas[i] - cost[i];
    if (total < 0) {
      total = 0;
      start = i + 1;
    }
  }
  return start;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const gas = input.gas as number[];
  const cost = input.cost as number[];
  if (gas.length !== cost.length) throw new Error('gas and cost must be the same length.');
  if (gas.length === 0) throw new Error('Give at least one station.');

  const t = new Tracer();
  const g = t.array('gas', gas, 'gas', ['i']);
  t.array('cost', cost, 'cost', ['i']);
  const net = t.array('net', gas.map((v, k) => v - cost[k]), 'gas − cost', ['i']);

  yield t.note(1, {
    note: 'If the tank ever goes negative, no station in the stretch just travelled can be the start — so the next one is the only candidate left.',
  });

  const gasTotal = gas.reduce((x, y) => x + y, 0);
  const costTotal = cost.reduce((x, y) => x + y, 0);
  if (gasTotal < costTotal) {
    yield t.note(2, {
      target: net,
      vars: { gasTotal, costTotal, result: -1 },
      note: `Total gas ${gasTotal} is less than total cost ${costTotal} — the loop is impossible from anywhere.`,
    });
    return;
  }
  yield t.note(2, {
    target: net,
    vars: { gasTotal, costTotal },
    note: `Total gas ${gasTotal} covers total cost ${costTotal}, so some start must work.`,
  });

  let total = 0;
  let start = 0;
  yield t.note(3, { target: net, vars: { total, start }, note: 'Try starting at station 0.' });

  for (let i = 0; i < g.length; i++) {
    total += net.num(i);
    yield t.read(5, {
      target: net,
      i,
      vars: { i, total },
      note: `Station ${i} nets ${net.num(i)}; the tank is now ${total}.`,
    });

    if (total < 0) {
      total = 0;
      start = i + 1;
      yield t.note(7, {
        target: net,
        i: Math.min(start, g.length - 1),
        vars: { total, start },
        note: `The tank ran dry, so nothing from the old start through ${i} works — try ${start}.`,
      });
    }
  }

  yield t.settle(10, net, [start], {
    vars: { i: undefined, total: undefined, result: start },
    note: `Starting at station ${start} completes the circuit.`,
  });
}

export const gasStation: AlgorithmDef = {
  id: 'gas-station',
  name: 'Gas Station',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'gas', label: 'gas', kind: 'numbers', placeholder: '1, 2, 3, 4, 5' },
    { key: 'cost', label: 'cost', kind: 'numbers', placeholder: '3, 4, 5, 1, 2' },
  ],
  defaultInput: { gas: [1, 2, 3, 4, 5], cost: [3, 4, 5, 1, 2] },
  run,
};
