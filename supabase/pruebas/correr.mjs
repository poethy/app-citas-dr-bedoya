// Corre las migraciones y el seed en un PostgreSQL en memoria (PGlite) y luego las pruebas.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const migraciones = join(aqui, '..', 'migrations');
const archivos = [
  join(aqui, 'stub_supabase.sql'),
  // pg_cron no existe en PGlite: la migración de tareas programadas se omite
  ...readdirSync(migraciones).filter(f => f.endsWith('.sql') && !f.includes('cron')).sort().map(f => join(migraciones, f)),
  join(aqui, '..', 'seed.sql'),
];

const db = new PGlite();
await db.exec("set timezone = 'UTC'");
for (const f of archivos) {
  try { await db.exec(readFileSync(f, 'utf8')); console.log(`OK  ${f.split(/[\/]/).pop()}`); }
  catch (e) { console.error(`ERROR en ${f}: ${e.message}`); process.exit(1); }
}

const resultados = await db.exec(readFileSync(join(aqui, 'pruebas.sql'), 'utf8'));
let fallas = 0;
for (const r of resultados) for (const fila of r.rows) {
  const v = Object.values(fila)[0];
  if (typeof v !== 'string') continue;
  if (v.startsWith('✘')) fallas++;
  console.log(v);
}
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
