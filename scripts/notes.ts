import { algorithms } from '../src/engine/registry';

/**
 * Every event should narrate itself in the status bar; a blank one shows the
 * placeholder hint instead, which reads as a broken frame. Lists the offenders
 * grouped by the event type and code line that produced them, so each one can
 * be found in its generator.
 */
let total = 0;
const offenders: string[] = [];

for (const algo of algorithms) {
  const blanks = new Map<string, number>();
  let n = 0;

  try {
    for (const e of algo.run(algo.defaultInput)) {
      n++;
      if (!e.note) {
        const key = `${e.type}@${e.line ?? '?'}`;
        blanks.set(key, (blanks.get(key) ?? 0) + 1);
      }
      if (n > 20000) break;
    }
  } catch {
    continue;
  }

  const count = [...blanks.values()].reduce((a, b) => a + b, 0);
  total += count;
  if (count > 0) {
    const where = [...blanks.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k}×${v}`)
      .join(' ');
    offenders.push(`${algo.id.padEnd(40)} ${String(count).padStart(3)}/${String(n).padEnd(4)} ${where}`);
  }
}

console.log(offenders.join('\n'));
console.log(`\n${total} note-less events across ${offenders.length} algorithms`);
