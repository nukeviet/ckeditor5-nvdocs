import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const keep = new Set([ 'en', 'vi', 'fr', 'ru' ]);
const dir = join(process.cwd(), 'lang', 'translations');
for (const f of readdirSync(dir)) {
  const m = f.match(/^([a-z-]+)\.po$/i);
  if (m && !keep.has(m[1])) rmSync(join(dir, f));
}
