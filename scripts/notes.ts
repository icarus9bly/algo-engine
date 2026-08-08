import { algorithms } from '../src/engine/registry';

let total = 0;
const offenders: string[] = [];

for (const algo of algorithms) {
  let blank = 0;
  let n = 0;
  try {
    for (const e of algo.run(algo.defaultInput)) {
      n++;
      if (!e.note) blank++;
      if (n > 20000) break;
    }
  } catch {
    continue;
  }
  total += blank;
  if (blank > 0) offenders.push(`${algo.id.padEnd(40)} ${String(blank).padStart(3)} / ${n}`);
}

console.log(offenders.join('\n'));
console.log(`\n${total} note-less events across ${offenders.length} algorithms`);
