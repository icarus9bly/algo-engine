import { Tracer } from '../tracer';
import type { AlgoEvent, AlgoInput, AlgorithmDef } from '../types';

const code = `function lemonadeChange(bills) {
  let fives = 0, tens = 0;
  for (const bill of bills) {
    if (bill === 5) fives++;
    else if (bill === 10) {
      if (fives === 0) return false;
      fives--; tens++;
    } else {
      if (tens > 0 && fives > 0) { tens--; fives--; }
      else if (fives >= 3) fives -= 3;
      else return false;
    }
  }
  return true;
}`;

function* run(input: AlgoInput): Generator<AlgoEvent> {
  const bills = input.bills as number[];
  if (bills.some((b) => ![5, 10, 20].includes(b))) {
    throw new Error('Bills must be 5, 10 or 20.');
  }

  const t = new Tracer();
  const a = t.array('bills', bills, 'bills', ['i']);

  yield t.note(1, {
    note: 'A £10 note is only ever useful as change for a £20, so spend tens before fives — keeping fives back is what leaves options open.',
  });

  let fives = 0;
  let tens = 0;
  yield t.note(2, { vars: { fives, tens }, note: 'The till starts empty.' });

  for (let i = 0; i < a.length; i++) {
    const bill = a.num(i);
    yield t.read(3, { i, vars: { i, bill }, note: `A customer pays with ${bill}.` });

    if (bill === 5) {
      fives++;
      yield t.note(4, { i, vars: { fives }, note: 'Exact money — no change needed.' });
    } else if (bill === 10) {
      if (fives === 0) {
        yield t.note(6, { i, vars: { result: false }, note: 'No 5 to give as change — the queue stops here.' });
        return;
      }
      fives--;
      tens++;
      yield t.note(7, { i, vars: { fives, tens }, note: 'Give a 5 back and keep the 10.' });
    } else {
      if (tens > 0 && fives > 0) {
        tens--;
        fives--;
        yield t.note(10, {
          i,
          vars: { fives, tens },
          note: 'Pay the 15 change with a 10 and a 5, saving the other fives.',
        });
      } else if (fives >= 3) {
        fives -= 3;
        yield t.note(11, {
          i,
          vars: { fives },
          note: 'No 10 available, so three 5s it is.',
        });
      } else {
        yield t.note(12, { i, vars: { result: false }, note: 'Not enough change for 15.' });
        return;
      }
    }
  }

  yield t.settle(15, a, a.values.map((_, d) => d), {
    vars: { i: undefined, bill: undefined, result: true },
    note: 'Every customer got correct change.',
  });
}

export const lemonadeChange: AlgorithmDef = {
  id: 'lemonade-change',
  name: 'Lemonade Change',
  category: 'Greedy',
  code,
  inputFields: [
    { key: 'bills', label: 'bills', kind: 'numbers', placeholder: '5, 5, 5, 10, 20' },
  ],
  defaultInput: { bills: [5, 5, 5, 10, 20] },
  run,
};
