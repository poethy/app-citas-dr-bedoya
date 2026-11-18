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

// El seed y las pruebas usan la agenda del jueves 19 de noviembre de 2026. Para que no
// dependan del día en que se corren, esas fechas se cambian por el próximo jueves que
// esté a más de 48 h (así se cumplen las 24 h de anticipación para agendar).
function fechaIso(d) {
  return d.toISOString().slice(0, 10);
}
function proximoJueves() {
  const ahora = Date.now();
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  do d.setUTCDate(d.getUTCDate() + 1);
  // 8:00 a. m. de Bogotá = 13:00 UTC
  while (d.getUTCDay() !== 4 || d.getTime() + 13 * 3600e3 - ahora < 48 * 3600e3);
  return d;
}
const jueves = proximoJueves();
const masDias = (n) => fechaIso(new Date(jueves.getTime() + n * 86400e3));
const fechas = { '2026-11-19': masDias(0), '2026-11-20': masDias(1), '2026-11-22': masDias(3) };
const conFechas = (sql) => sql.replace(/2026-11-(19|20|22)/g, (f) => fechas[f]);
console.log(`Jueves de prueba: ${fechas['2026-11-19']}`);

const db = new PGlite();
await db.exec("set timezone = 'UTC'");
for (const f of archivos) {
  const esSeed = f.endsWith('seed.sql');
  try { await db.exec(esSeed ? conFechas(readFileSync(f, 'utf8')) : readFileSync(f, 'utf8')); console.log(`OK  ${f.split(/[\/]/).pop()}`); }
  catch (e) { console.error(`ERROR en ${f}: ${e.message}`); process.exit(1); }
}

const resultados = await db.exec(conFechas(readFileSync(join(aqui, 'pruebas.sql'), 'utf8')));
let fallas = 0;
for (const r of resultados) for (const fila of r.rows) {
  const v = Object.values(fila)[0];
  if (typeof v !== 'string') continue;
  if (v.startsWith('✘')) fallas++;
  console.log(v);
}
console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\nTodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
