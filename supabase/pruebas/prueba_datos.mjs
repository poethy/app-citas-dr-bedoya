// Comprueba que supabase/datos_prueba.sql corre sobre las migraciones y el seed, dos veces seguidas.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = dirname(fileURLToPath(import.meta.url));
const m = join(aqui, '..', 'migrations');
const db = new PGlite();
await db.exec("set timezone = 'UTC'");
await db.exec(readFileSync(join(aqui, 'stub_supabase.sql'), 'utf8'));
for (const f of readdirSync(m).filter((f) => f.endsWith('.sql') && !f.includes('cron')).sort()) await db.exec(readFileSync(join(m, f), 'utf8'));
await db.exec(readFileSync(join(aqui, '..', 'seed.sql'), 'utf8'));
const datos = readFileSync(join(aqui, '..', 'datos_prueba.sql'), 'utf8');
await db.exec(datos);
await db.exec(datos);
const r = await db.query(`select p.nombre, s.nombre as servicio, to_char(c.inicio at time zone 'America/Bogota', 'Dy DD HH24:MI') as cuando, c.estado, c.precio_acordado_cop from citas c join pacientes p on p.id = c.paciente_id join servicios s on s.id = c.servicio_id order by c.inicio`);
console.table(r.rows);
const cfg = await db.query('select latitud, longitud, telefono from configuracion');
console.log(cfg.rows);
