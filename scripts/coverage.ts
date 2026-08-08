import { algorithms } from '../src/engine/registry';

/** The canonical Blind 75, by NeetCode section, with expected counts. */
const EXPECTED: Record<string, number> = {
  'Arrays & Hashing': 8,
  'Two Pointers': 3,
  'Sliding Window': 4,
  Stack: 1,
  'Binary Search': 2,
  'Linked List': 6,
  Trees: 11,
  'Heap / Priority Queue': 1,
  Backtracking: 2,
  Tries: 3,
  Graphs: 6,
  'Advanced Graphs': 1,
  '1-D Dynamic Programming': 10,
  '2-D Dynamic Programming': 2,
  Greedy: 2,
  Intervals: 5,
  'Math & Geometry': 3,
  'Bit Manipulation': 5,
};

const counts = new Map<string, number>();
for (const a of algorithms) {
  counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
}

let total = 0;
let expectedTotal = 0;
let bad = 0;

for (const [section, want] of Object.entries(EXPECTED)) {
  const have = counts.get(section) ?? 0;
  total += have;
  expectedTotal += want;
  const ok = have === want;
  if (!ok) bad++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${section.padEnd(28)} ${have}/${want}`);
}

const extra = [...counts.keys()].filter((c) => !(c in EXPECTED));
for (const section of extra) {
  console.log(`     ${section.padEnd(28)} ${counts.get(section)} (outside the Blind 75)`);
}

const ids = algorithms.map((a) => a.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) console.log(`\nDUPLICATE IDS: ${dupes.join(', ')}`);

console.log(`\n${total}/${expectedTotal} Blind 75 problems, ${bad} section(s) off`);
